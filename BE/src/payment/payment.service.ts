import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
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
import { AuctionsService } from '../auctions/auctions.service';
import { AuctionStatus } from '../model/auctions';
import { TransactionsService } from '../transactions/transactions.service';
import { ContactsService } from '../contacts/contacts.service';
import { ContractStatus } from '../model/contacts';
import { SignnowService } from '../signnow/signnow.service';
import { ListingStatus, PaymentListingStatus } from '../model/listings';
import { TransactionStatus } from '../model/transactions';
import { CommissionsService } from '../commissions/commissions.service';
import { CommissionStatus } from '../model/commissions';
import { User, UserDocument } from '../model/users.schema';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
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
    private readonly auctionsService: AuctionsService,
    private readonly transactionsService: TransactionsService,
    private readonly contactsService: ContactsService,
    private readonly signnowService: SignnowService,
    private readonly commissionsService: CommissionsService,
    private readonly platformSettingsService: PlatformSettingsService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
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

    // VNPay requires amounts within certain limits (VND): >= 5,000 and < 1,000,000,000
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      throw new BadRequestException('Invalid payment amount');
    }
    if (amount < 5000 || amount >= 1000000000) {
      throw new BadRequestException(
        'Số tiền giao dịch không hợp lệ. Số tiền hợp lệ từ 5,000 đến dưới 1 tỷ đồng',
      );
    }

    const vnpayResponse = this.vnpay.buildPaymentUrl({
      vnp_Amount: Math.round(amount), // Amount in smallest currency unit (integer)
      vnp_IpAddr: ipAddress,
      vnp_OrderInfo: `Thanh toan cho tin đăng bán #${createPaymentDto.listing_id}`,
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
   * Create VNPay payment URL specifically for auctions
   */
  async createVNPayUrlForAuction(
    auctionDto: any,
    userId: string,
    ipAddress: string,
  ) {
    // Validate auction id
    const auctionId = auctionDto.auction_id;
    if (!auctionId || !Types.ObjectId.isValid(String(auctionId))) {
      throw new BadRequestException('Invalid auction identifier');
    }

    // Fetch auction
    const auction = await this.auctionsService.findOne(auctionId);
    if (!auction) throw new NotFoundException('Auction not found');

    // Determine seller and price
    const sellerId =
      auction.seller_id instanceof Types.ObjectId
        ? auction.seller_id.toString()
        : auction.seller_id?._id?.toString() || String(auction.seller_id);

    if (!userId || String(userId).toLowerCase() === 'null') {
      throw new BadRequestException('Invalid buyer identifier');
    }

    if (sellerId === userId) {
      throw new BadRequestException('Buyer cannot be the seller');
    }

    const amount = auction.current_price ?? auction.starting_price ?? 0;

    // Only allow auction payment when auction has ended
    if (auction.status !== AuctionStatus.ENDED) {
      throw new BadRequestException(
        'Auction payment is only allowed when auction has ended',
      );
    }
    if (auctionDto.amount && auctionDto.amount !== amount) {
      throw new BadRequestException('Amount does not match auction price');
    }

    // VNPay requires amounts within certain limits (VND): >= 5,000 and < 1,000,000,000
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      throw new BadRequestException('Invalid payment amount');
    }
    if (amount < 5000 || amount >= 1000000000) {
      throw new BadRequestException(
        'Số tiền giao dịch không hợp lệ. Số tiền hợp lệ từ 5,000 đến dưới 1 tỷ đồng',
      );
    }

    // Create payment record
    const payment = await this.paymentModel.create({
      buyer_id: userId,
      seller_id: sellerId,
      listing_id: auction.listing_id ?? undefined,
      auction_id: auction._id ?? auctionId,
      amount,
      payment_method: auctionDto.payment_method,
      status: PaymentStatus.PENDING,
    });

    const orderId = (payment._id as Types.ObjectId).toString();

    const vnpayResponse = this.vnpay.buildPaymentUrl({
      // VNPay expects amount in smallest currency unit (e.g., VND * 100)
      vnp_Amount: Math.round(amount),
      vnp_IpAddr: ipAddress,
      vnp_OrderInfo: `Thanh toan cho auction #${auctionId}`,
      vnp_TxnRef: orderId,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: this.returnUrl,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(new Date(Date.now() + 30 * 60 * 1000)),
    });

    return { payment, paymentUrl: vnpayResponse };
  }

  /**
   * Build a VNPay URL for an existing payment record. Useful when payment
   * record already exists (e.g., listing fee) and frontend requests the
   * redirect URL.
   */
  async createVNPayUrlForPayment(
    paymentId: string,
    userId: string,
    ipAddress = '127.0.0.1',
  ) {
    if (!paymentId || !Types.ObjectId.isValid(String(paymentId))) {
      throw new BadRequestException('Invalid payment identifier');
    }

    const payment = await this.paymentModel.findById(paymentId).lean();
    if (!payment) throw new NotFoundException('Payment not found');

    // Only the buyer (payer) should be able to request the payment URL.
    // Normalize several shapes: ObjectId, populated object, or string.
    const normalize = (v: any) => {
      if (!v && v !== 0) return '';
      if (typeof v === 'string') return v;
      if (v instanceof Types.ObjectId) return v.toString();
      if (typeof v === 'object') {
        if (v._id) return String(v._id);
        if (v.id) return String(v.id);
        if (typeof v.toString === 'function') return v.toString();
        return JSON.stringify(v);
      }
      return String(v);
    };

    const buyerId = normalize(payment.buyer_id);
    const normalizedUserId = normalize(userId);
    if (buyerId !== normalizedUserId) {
      // Helpful debug log to diagnose why auth mismatch happens during auction create
      this.logger.warn('Unauthorized attempt to build payment URL', {
        paymentId,
        buyerId,
        userId: normalizedUserId,
      });
      throw new BadRequestException(
        'Unauthorized to create payment URL for this payment',
      );
    }

    const amount = payment.amount;
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      throw new BadRequestException('Invalid payment amount');
    }
    if (amount < 5000 || amount >= 1000000000) {
      throw new BadRequestException(
        'Số tiền giao dịch không hợp lệ. Số tiền hợp lệ từ 5,000 đến dưới 1 tỷ đồng',
      );
    }

    const orderId = String(payment._id);
    const vnpayResponse = this.vnpay.buildPaymentUrl({
      vnp_Amount: Math.round(amount),
      vnp_IpAddr: ipAddress,
      vnp_OrderInfo: `Thanh toan cho payment #${orderId}`,
      vnp_TxnRef: orderId,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: this.returnUrl,
      vnp_Locale: VnpLocale.VN,
      vnp_CreateDate: dateFormat(new Date()),
      vnp_ExpireDate: dateFormat(new Date(Date.now() + 30 * 60 * 1000)),
    });

    return { payment, paymentUrl: vnpayResponse };
  }

  /**
   * Create new payment record
   */
  private async createPayment(dto: CreatePaymentDto, buyerId: string) {
    // Fetch listing to get seller and price
    // Validate incoming identifiers early to avoid casting errors later
    if (!dto?.listing_id || !Types.ObjectId.isValid(String(dto.listing_id))) {
      throw new BadRequestException('Invalid listing identifier');
    }

    if (!buyerId || String(buyerId).toLowerCase() === 'null') {
      throw new BadRequestException('Invalid buyer identifier');
    }

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
        if ((payment as any).is_listing_fee) {
          await this.finalizeSuccessfulListingPayment(payment, 'IPN');
        } else {
          await this.finalizeSuccessfulPayment(payment, 'IPN');
        }
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
            if ((payment as any).is_listing_fee) {
              await this.finalizeSuccessfulListingPayment(payment, 'RETURN');
            } else {
              await this.finalizeSuccessfulPayment(payment, 'RETURN');
            }
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
      if (payment.listing_id) {
        listing = await this.listingsService.findOne(
          payment.listing_id.toString(),
        );
      }
    } catch (err) {
      // Listing might have been removed; continue with minimal data
      console.warn('Listing not found during payment finalization', err);
    }

    // Determine commission rate and compute platform fee and seller payout.
    // Business rule: if amount < threshold then use 2% commission, otherwise use default rate.
    const commissionThreshold = await this.platformSettingsService.getCommissionThreshold();
    const defaultRate = await this.platformSettingsService.getCommissionDefaultRate();
    const rate = typeof payment.amount === 'number' && payment.amount < commissionThreshold ? 0.02 : defaultRate;

    const platformFee = Math.max(Math.round((payment.amount || 0) * rate), 0);
    const sellerPayout = Math.max((payment.amount || 0) - platformFee, 0);

    const createTransactionDto: any = {
      buyer_id: payment.buyer_id.toString(),
      seller_id: payment.seller_id.toString(),
      price: payment.amount,
      payment_method: PaymentMethod.VNPAY,
      payment_reference: (payment._id as Types.ObjectId).toString(),
      notes: `Auto-created from VNPay ${source}`,
      platform_fee: platformFee,
      seller_payout: sellerPayout,
    } as any;

    if (payment.listing_id)
      createTransactionDto.listing_id = payment.listing_id.toString();
    if ((payment as any).auction_id)
      createTransactionDto.auction_id = (payment as any).auction_id.toString();

    const transaction = await this.transactionsService.create(createTransactionDto);

    // Attach transaction metadata to payment and persist
    (payment as any).transaction_id = transaction._id;
    payment.platform_fee = platformFee;
    payment.seller_payout = sellerPayout;
    transaction.status = TransactionStatus.COMPLETED;
    try {
      await transaction.save();
    } catch (err) {
      console.warn('Failed to save transaction after payment update', {
        transactionId: transaction._id,
        error: err?.message || err,
      });
    }

    try {
      await payment.save();
    } catch (err) {
      console.warn('Failed to save payment after payment update', {
        paymentId: payment._id,
        error: err?.message || err,
      });
    }

    // Create commission record for this transaction when platformFee > 0
    try {
      if (platformFee > 0) {
        // Avoid duplicate commission by checking existing commission for transaction
        let commission: any = null;
        try {
          commission = await this.commissionsService.findByTransactionId(
            (transaction._id as any).toString(),
          );
        } catch (err) {
          // Not found -> proceed to create
        }

        if (!commission) {
          const createCommissionDto: any = {
            transaction_id: (transaction._id as any).toString(),
            percentage: rate * 100,
            amount: platformFee,
            status: CommissionStatus.PENDING,
          };

          try {
            commission = await this.commissionsService.create(createCommissionDto);
          } catch (err) {
            this.logger.warn('Failed to create commission (continuing)', err?.message || err);
          }
        }

        if (commission && commission._id) {
          try {
            (transaction as any).commission_id = commission._id;
            await transaction.save();
          } catch (err) {
            this.logger.warn('Failed to attach commission to transaction', err?.message || err);
          }

          try {
            (payment as any).commission_id = commission._id;
            await payment.save();
          } catch (err) {
            this.logger.warn('Failed to attach commission to payment', err?.message || err);
          }
        }
      }
    } catch (err) {
      this.logger.warn('Commission creation flow failed (continuing)', err?.message || err);
    }

    const listingId =
      listing?._id?.toString?.() ??
      listing?.id?.toString?.() ??
      payment.listing_id?.toString?.();

    if (listingId) {
      try {
        // Mark listing as pending publication/processing
        await this.listingsService.updateStatus(listingId, ListingStatus.SOLD);
      } catch (error) {
        console.warn('Failed to update listing status after payment', {
          listingId,
          error,
        });
      }

      try {
        // Also update the listing.payment_status to COMPLETED
        await this.listingsService.updatePaymentStatus(
          listingId,
          PaymentListingStatus.COMPLETED,
        );
      } catch (error) {
        console.warn('Failed to update listing payment_status after payment', {
          listingId,
          error,
        });
      }
    }

    // Do not create a contract record or trigger SignNow.
    // For purchase payments (non-listing fees) create a draft Contract and
    // attempt to send a SignNow invite (best-effort). If SignNow isn't
    // configured or the invite fails, continue without blocking the flow.
    let createdContract: any = null;
    let signnowResult: any = null;
    try {
      const buyerId =
        (payment.buyer_id as any)?.toString?.() ??
        String((payment as any).buyer_id || '');
      const sellerId =
        (payment.seller_id as any)?.toString?.() ??
        String((payment as any).seller_id || '');
      const [buyer, seller] = await Promise.all([
        buyerId
          ? this.userModel
            .findById(buyerId)
            .lean()
            .catch(() => null)
          : Promise.resolve(null),
        sellerId
          ? this.userModel
            .findById(sellerId)
            .lean()
            .catch(() => null)
          : Promise.resolve(null),
      ]);

      const contractNo = `CONTRACT-${String(transaction._id)}`;

      createdContract = await this.contactsService.create({
        transaction_id: (transaction._id as Types.ObjectId).toString(),
        contract_no: contractNo,
        document_url: 'about:blank',
        status: ContractStatus.DRAFT,
        terms_and_conditions: '',
        notes: `Auto-created on payment ${String(payment._id)}`,
      } as any);

      // Try SignNow invite if we have buyer/seller emails
      try {
        const dto: any = {
          contract_id: (createdContract._id as any).toString(),
          buyer_name: (buyer && (buyer.name || '')) || '',
          buyer_email: (buyer && (buyer.email || '')) || '',
          seller_name: (seller && (seller.name || '')) || '',
          seller_email: (seller && (seller.email || '')) || '',
          amount: payment.amount,
        };

        if (dto.buyer_email && dto.seller_email) {
          signnowResult =
            await this.signnowService.createContractAndInvite(dto);
        } else {
          this.logger.warn(
            'Skipping SignNow invite: missing buyer or seller email',
            {
              buyerEmail: dto.buyer_email,
              sellerEmail: dto.seller_email,
            },
          );
        }
      } catch (err) {
        this.logger.warn(
          'SignNow invite failed (continuing)',
          err?.message || err,
        );
      }

      // attach contract reference to payment
      try {
        payment.contract_id = createdContract._id as any;
        await payment.save();
      } catch (err) {
        this.logger.warn('Failed to attach contract to payment', {
          error: err?.message || err,
        });
      }
    } catch (err) {
      this.logger.warn(
        'Failed to create contract after payment (continuing)',
        err?.message || err,
      );
    }

    // Instead: if the payment is related to an auction, mark the auction as
    // PAYMENT_COMPLETED; if it's related to a listing, the listing was already
    // updated to SOLD above. Return the transaction metadata only.
    try {
      if ((payment as any).auction_id) {
        const auctionId =
          (payment as any).auction_id?.toString?.() ??
          String((payment as any).auction_id);
        if (auctionId) {
          try {
            // After listing-fee payment completes, move auction from DRAFT to SOLD
            await this.auctionsService.updateStatus(
              auctionId,
              AuctionStatus.SOLD,
            );
            await this.auctionsService.updatePaymentStatus(
              auctionId,
              PaymentListingStatus.COMPLETED,
            );
          } catch (err) {
            console.warn('Failed to update auction status to SOLD', {
              auctionId,
              error: err?.message || err,
            });
          }
        }
      }
    } catch (err) {
      console.warn(
        'Error while updating auction/listing status after payment',
        err?.message || err,
      );
    }
    return {
      transaction,
      contract: createdContract,
      signnow: signnowResult,
    };
  }

  private async finalizeSuccessfulListingPayment(
    payment: PaymentDocument,
    source: 'IPN' | 'RETURN',
  ) {
    // For listing-fee payments: create a Transaction record for bookkeeping
    // but DO NOT create a Commission (platform fee is the revenue). Then
    // update listing/auction status and attach the transaction to the payment.
    let listing: any = null;
    try {
      if (payment.listing_id) {
        listing = await this.listingsService.findOne(
          payment.listing_id.toString(),
        );
      }
    } catch (err) {
      console.warn('Listing not found during listing-fee finalization', err);
    }

    // Create a minimal transaction (no commission)
    let transaction: any = null;
    try {
      const createTransactionDto: any = {
        buyer_id: (payment.buyer_id as any)?.toString?.() ?? String((payment as any).buyer_id || ''),
        seller_id: (payment.seller_id as any)?.toString?.() ?? String((payment as any).seller_id || ''),
        price: payment.amount,
        payment_method: PaymentMethod.VNPAY,
        payment_reference: (payment._id as Types.ObjectId).toString(),
        notes: `Listing fee auto-created from VNPay ${source}`,
      } as any;

      if (payment.listing_id) createTransactionDto.listing_id = payment.listing_id.toString();
      if ((payment as any).auction_id) createTransactionDto.auction_id = (payment as any).auction_id.toString();

      transaction = await this.transactionsService.create(createTransactionDto);

      // Mark transaction as completed immediately since payment completed
      try {
        transaction.status = TransactionStatus.COMPLETED;
        await transaction.save();
      } catch (err) {
        console.warn('Failed to save listing-fee transaction status', { transactionId: transaction._id, error: err?.message || err });
      }

      // Attach transaction reference to payment and persist
      try {
        (payment as any).transaction_id = transaction._id;
        // For listing-fee payments, ensure platform fee and commission are zero
        payment.platform_fee = 0;
        payment.seller_payout = 0;
        try {
          (payment as any).commission_id = undefined;
        } catch {}
        await payment.save();
      } catch (err) {
        console.warn('Failed to attach transaction to listing-fee payment', { paymentId: payment._id, error: err?.message || err });
      }
    } catch (err) {
      console.warn('Failed to create transaction for listing-fee payment (continuing)', err?.message || err);
    }

    const listingId =
      listing?._id?.toString?.() ??
      listing?.id?.toString?.() ??
      payment.listing_id?.toString?.();

    if (listingId) {
      try {
        await this.listingsService.updateStatus(
          listingId,
          ListingStatus.PENDING,
        );
      } catch (error) {
        console.warn(
          'Failed to update listing status after listing-fee payment',
          {
            listingId,
            error,
          },
        );
      }

      try {
        await this.listingsService.updatePaymentStatus(
          listingId,
          PaymentListingStatus.COMPLETED,
        );
      } catch (error) {
        console.warn(
          'Failed to update listing payment_status after listing-fee payment',
          {
            listingId,
            error,
          },
        );
      }
    }

    try {
      if ((payment as any).auction_id) {
        const auctionId =
          (payment as any).auction_id?.toString?.() ??
          String((payment as any).auction_id);
        if (auctionId) {
          try {
            await this.auctionsService.updateStatus(
              auctionId,
              AuctionStatus.PENDING,
            );
            await this.auctionsService.updatePaymentStatus(
              auctionId,
              PaymentListingStatus.COMPLETED,
            );
          } catch (err) {
            console.warn('Failed to update auction status to PENDING', {
              auctionId,
              error: err?.message || err,
            });
          }
        }
      }
    } catch (err) {
      console.warn(
        'Error while updating auction/listing status after listing-fee payment',
        err?.message || err,
      );
    }

    // Return payment and the created transaction (if any). No commission created.
    return { payment, transaction };
  }

  /**
   * Get statistics for listing fees
   * Returns total amount and count of completed listing fee payments
   */
  async getListingFeesStats(): Promise<{ total: number; count: number }> {
    const stats = await this.paymentModel.aggregate([
      {
        $match: {
          is_listing_fee: true,
          status: PaymentStatus.COMPLETED,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      total: stats[0]?.total || 0,
      count: stats[0]?.count || 0,
    };
  }
}
