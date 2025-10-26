import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  Payment,
  PaymentDocument,
  PaymentStatus,
  PaymentMethod,
} from './schemas/payment.schema';
import { CreatePaymentDto, VNPayIPNDto } from './dto/payment.dto';
import { VNPay } from 'vnpay/vnpay';
import { ProductCode, VnpLocale } from 'vnpay/enums';
import { dateFormat } from 'vnpay/utils';
import { ListingsService } from '../listings/listings.service';
import { TransactionsService } from '../transactions/transactions.service';
import { ContractsService } from '../contracts/contracts.service';
import { CommissionsService } from '../commissions/commissions.service';
import { SignnowService } from '../signnow/signnow.service';
import { ListingStatus } from '../model/listings';

@Injectable()
export class PaymentService {
  private readonly vnpPaymentEndpoint: string;
  private readonly vnpHost: string;
  private readonly tmnCode: string;
  private readonly hashSecret: string;
  private readonly returnUrl: string;
  private readonly vnpay: VNPay;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private readonly configService: ConfigService,
    private readonly listingsService: ListingsService,
    private readonly transactionsService: TransactionsService,
    private readonly contractsService: ContractsService,
    private readonly commissionsService: CommissionsService,
    private readonly signnowService: SignnowService,
  ) {
    // Initialize VNPay config values
    const vnpUrlRaw =
      this.configService.get<string>('VNPAY_URL') ||
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.tmnCode = this.configService.get<string>('VNPAY_TMN_CODE') || '';
    this.hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET') || '';
    this.returnUrl = this.configService.get<string>('VNPAY_RETURN_URL') || '';

    // Validate required config
    if (!this.tmnCode || !this.hashSecret || !this.returnUrl) {
      throw new Error('Missing required VNPAY configuration');
    }

    try {
      const parsed = new URL(vnpUrlRaw);
      this.vnpHost = `${parsed.protocol}//${parsed.host}`;
      this.vnpPaymentEndpoint =
        parsed.pathname.replace(/^\//, '') || 'paymentv2/vpcpay.html';

      this.vnpay = new VNPay({
        tmnCode: this.tmnCode,
        secureSecret: this.hashSecret,
        vnpayHost: this.vnpHost,
        testMode: parsed.hostname.includes('sandbox'),
        endpoints: {
          paymentEndpoint: this.vnpPaymentEndpoint,
        },
      });
    } catch (error) {
      throw new Error(`Invalid VNPAY_URL provided: ${error}`);
    }
  }

  /**
   * Create payment URL for VNPay
   */
  async createVNPayUrl(
    createPaymentDto: CreatePaymentDto,
    userId: string,
    ipAddress: string,
  ) {
    // First create payment record
    const payment = await this.createPayment(createPaymentDto, userId);

    const orderId = (payment._id as Types.ObjectId).toString();
    // Use the server-authoritative payment amount (in case client omitted or sent different value)
    const amount = payment.amount;

    const vnpayResponse = this.vnpay.buildPaymentUrl({
      vnp_Amount: Math.round(amount * 100), // Amount in smallest currency unit (integer)
      vnp_IpAddr: ipAddress,
      vnp_OrderInfo: `Thanh toan cho đơn hàng #${createPaymentDto.listing_id}`,
      vnp_TxnRef: orderId, // Use payment._id as transaction reference
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: this.returnUrl, // Use the value initialized in constructor
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(new Date(Date.now() + 30 * 60 * 1000)), // 30 minutes from now
    });

    return {
      payment,
      paymentUrl: vnpayResponse,
    };
  }

  /**
   * Create new payment record
   */
  private async createPayment(dto: CreatePaymentDto, buyerId: string) {
    // Fetch listing to get seller and price
    const listing = await this.listingsService.findOne(dto.listing_id);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Prevent buyer being the seller
    const listingSellerId =
      listing.seller_id instanceof Types.ObjectId
        ? listing.seller_id.toString()
        : (listing.seller_id as any)?._id?.toString() ||
          String(listing.seller_id);

    if (listingSellerId === buyerId) {
      throw new BadRequestException('Buyer cannot be the seller');
    }

    // Listing must be active
    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException('Listing is not available for purchase');
    }

    // Use price from listing (server authoritative). If client sent amount and it's different, reject.
    const listingPrice = listing.price;
    if (dto.amount && dto.amount !== listingPrice) {
      throw new BadRequestException('Amount does not match listing price');
    }

    // Use the authoritative IDs we already have. Avoid calling `new Types.ObjectId(...)`
    // on values that may not be valid 24-char hex strings; Mongoose will cast strings
    // to ObjectId where needed. Also prefer the fetched `listing._id` for reliability.
    const payment = await this.paymentModel.create({
      buyer_id: buyerId,
      seller_id: listingSellerId,
      listing_id: (listing as any)._id ?? dto.listing_id,
      amount: listingPrice,
      payment_method: dto.payment_method,
      status: PaymentStatus.PENDING,
    });

    return payment;
  }

  /**
   * Handle VNPay IPN (Instant Payment Notification)
   */
  async handleVNPayIPN(vnpayData: VNPayIPNDto) {
    const verify = this.vnpay.verifyReturnUrl(vnpayData as any) as any;
    if (!verify.isSuccess) {
      throw new BadRequestException(verify.message || 'Invalid signature');
    }

    // Get payment by transaction reference
    const payment = await this.paymentModel.findById(vnpayData.vnp_TxnRef);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Update payment status based on vnpay response code
    let status = PaymentStatus.PENDING;
    if (vnpayData.vnp_ResponseCode === '00') {
      status = PaymentStatus.COMPLETED;
    } else {
      status = PaymentStatus.FAILED;
    }

    // Update payment record
    payment.status = status;
    payment.vnp_TransactionNo = vnpayData.vnp_TransactionNo;
    payment.vnp_PayDate = vnpayData.vnp_PayDate;
    payment.vnp_OrderInfo = vnpayData.vnp_OrderInfo;
    payment.vnp_ResponseCode = vnpayData.vnp_ResponseCode;
    payment.payment_response = vnpayData;

    await payment.save();

    if (status === PaymentStatus.COMPLETED) {
      try {
        await this.finalizeSuccessfulPayment(payment, 'IPN');
      } catch (err) {
        console.error('Error finalizing payment via IPN:', err);
      }
    }

    return { RspCode: '00', Message: 'success' };
  }

  /**
   * Verify VNPay Return
   */
  async verifyReturnUrl(vnpayData: Record<string, any>) {
    const verify = this.vnpay.verifyReturnUrl(vnpayData as any) as any;
    if (!verify.isSuccess) {
      throw new BadRequestException(verify.message || 'Invalid signature');
    }

    const orderId = verify.data?.vnp_TxnRef || vnpayData.vnp_TxnRef;
    const rspCode = verify.data?.vnp_ResponseCode || vnpayData.vnp_ResponseCode;
    // If we can, update the payment record on return (idempotent). IPN is authoritative
    try {
      const payment = await this.paymentModel.findById(orderId);
      if (payment) {
        payment.vnp_TransactionNo = vnpayData.vnp_TransactionNo;
        payment.vnp_PayDate = vnpayData.vnp_PayDate;
        payment.vnp_OrderInfo = vnpayData.vnp_OrderInfo;
        payment.vnp_ResponseCode = rspCode;
        payment.payment_response = vnpayData;

        if (rspCode === '00') {
          payment.status = PaymentStatus.COMPLETED;
        } else {
          payment.status = PaymentStatus.FAILED;
        }

        await payment.save();

        // If completed and no transaction created yet, try to create one (idempotent)
        if (rspCode === '00') {
          try {
            await this.finalizeSuccessfulPayment(payment, 'RETURN');
          } catch (err) {
            console.error('Error finalizing payment via return:', err);
          }
        }
      }
    } catch (err) {
      // Don't fail the return flow if DB updates fail; log and continue
      console.error('Error updating payment on VNPay return:', err);
    }

    return {
      orderId,
      rspCode,
      message:
        rspCode === '00'
          ? verify.message || 'Success'
          : verify.message || 'Failed',
    };
  }

  private async finalizeSuccessfulPayment(
    payment: PaymentDocument,
    source: 'IPN' | 'RETURN',
  ) {
    if ((payment as any).transaction_id) {
      return;
    }

    let listing: any = null;
    try {
      listing = await this.listingsService.findOne(
        payment.listing_id.toString(),
      );
    } catch (err) {
      // Listing might have been removed; continue with minimal data
      console.warn('Listing not found during payment finalization', err);
    }

    const category = listing?.category ?? undefined;
    const { rate, platformFee, sellerPayout } =
      this.commissionsService.calculate({
        amount: payment.amount,
        category,
      });

    const createTransactionDto = {
      listing_id: payment.listing_id.toString(),
      buyer_id: payment.buyer_id.toString(),
      seller_id: payment.seller_id.toString(),
      price: payment.amount,
      payment_method: PaymentMethod.VNPAY,
      payment_reference: (payment._id as Types.ObjectId).toString(),
      notes: `Auto-created from VNPay ${source}`,
      commission_rate: rate,
      platform_fee: platformFee,
      seller_payout: sellerPayout,
    } as any;

    const transaction =
      await this.transactionsService.create(createTransactionDto);

    (payment as any).transaction_id = transaction._id;
    payment.commission_rate = rate;
    payment.platform_fee = platformFee;
    payment.seller_payout = sellerPayout;
    await payment.save();

    const listingId =
      listing?._id?.toString?.() ??
      listing?.id?.toString?.() ??
      payment.listing_id?.toString?.();

    if (listingId) {
      try {
        await this.listingsService.updateStatus(listingId, ListingStatus.SOLD);
      } catch (error) {
        console.warn('Failed to update listing status after payment', {
          listingId,
          error,
        });
      }
    }

    const contract = await this.contractsService.createFromPayment({
      transactionId: (transaction._id as Types.ObjectId).toString(),
      paymentId: (payment._id as Types.ObjectId).toString(),
      amount: payment.amount,
      listingTitle: listing?.title,
      sellerName: listing?.seller_id?.name,
    });

    if (contract) {
      const contractId = (
        (contract as any)?._id as Types.ObjectId | undefined
      )?.toString();
      const contractNo = (contract as any)?.contract_no as string | undefined;

      if (contractId) {
        transaction.contract_id = new Types.ObjectId(contractId);
        payment.contract_id = new Types.ObjectId(contractId);
      }
      await transaction.save();
      await payment.save();

      try {
        const populatedTransaction = await this.transactionsService.findOne(
          (transaction._id as Types.ObjectId).toString(),
        );
        const buyer = (populatedTransaction as any)?.buyer_id;
        const seller = (populatedTransaction as any)?.seller_id;

        if (buyer?.email && seller?.email) {
          if (!contractId) {
            throw new Error('Missing contract identifier for SignNow');
          }
          await this.signnowService.createContractAndInvite({
            contract_id: contractId,
            buyer_name: buyer?.name || 'Buyer',
            buyer_email: buyer.email,
            seller_name: seller?.name || 'Seller',
            seller_email: seller.email,
            amount: payment.amount,
            subject: contractNo
              ? `Ký hợp đồng ${contractNo}`
              : 'Ký hợp đồng giao dịch',
          });
        } else {
          console.warn('Missing buyer/seller email for SignNow invitation', {
            buyer,
            seller,
          });
        }
      } catch (error) {
        console.error('Failed to trigger SignNow contract invite', error);
      }
    }

    return {
      transaction,
      contract,
      commission: { rate, platformFee, sellerPayout },
    };
  }
}
