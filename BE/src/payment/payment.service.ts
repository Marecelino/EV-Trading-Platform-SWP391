import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
// qs not required anymore — canonical signing built manually
import { Payment, PaymentDocument, PaymentStatus } from './schemas/payment.schema';
import { CreatePaymentDto, VNPayIPNDto } from './dto/payment.dto';
import { dateFormat, ProductCode, VNPay, VnpLocale } from 'vnpay';
import { ListingsService } from '../listings/listings.service';
import { TransactionsService } from '../transactions/transactions.service';
import { ContactsService } from '../contacts/contacts.service';
import { ListingStatus } from '../model/listings';

@Injectable()
export class PaymentService {
  private readonly vnpUrl: string;
  private readonly tmnCode: string;
  private readonly hashSecret: string;
  private readonly returnUrl: string;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private readonly configService: ConfigService,
    private readonly listingsService: ListingsService,
    private readonly transactionsService: TransactionsService,
    private readonly contactsService: ContactsService,
  ) {
    // Initialize VNPay config values
    this.vnpUrl = this.configService.get<string>('VNPAY_URL') || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.tmnCode = this.configService.get<string>('VNPAY_TMN_CODE') || '';
    this.hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET') || '';
    this.returnUrl = this.configService.get<string>('VNPAY_RETURN_URL') || '';

    // Validate required config
    if (!this.tmnCode || !this.hashSecret || !this.returnUrl) {
      throw new Error('Missing required VNPAY configuration');
    }
  }

  /**
   * Create payment URL for VNPay
   */
  async createVNPayUrl(
    createPaymentDto: CreatePaymentDto, 
    userId: string, 
    ipAddress: string
  ) {
    // First create payment record
    const payment = await this.createPayment(createPaymentDto, userId);
    
    const vnpay = new VNPay({
      tmnCode: this.tmnCode, // Use the value initialized in constructor
      secureSecret: this.hashSecret, // Use the value initialized in constructor
      vnpayHost: this.vnpUrl, // Use the value initialized in constructor
      testMode: true,
    });

  const orderId = (payment._id as Types.ObjectId).toString();
  // Use the server-authoritative payment amount (in case client omitted or sent different value)
  const amount = payment.amount;

    const vnpayResponse = await vnpay.buildPaymentUrl({
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
      paymentUrl: vnpayResponse
    }; }

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
    const listingSellerId = listing.seller_id instanceof Types.ObjectId
      ? listing.seller_id.toString()
      : (listing.seller_id as any)?._id?.toString() || String(listing.seller_id);

    if (listingSellerId === buyerId) {
      throw new BadRequestException('Buyer cannot be the seller');
    }

    // Listing must be active
    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException('Listing is not available for purchase');
    }

    // Use price from listing (server authoritative). If client sent amount and it's different, reject.
    const listingPrice = listing.price as number;
    if (dto.amount && dto.amount !== listingPrice) {
      throw new BadRequestException('Amount does not match listing price');
    }

    const payment = await this.paymentModel.create({
      buyer_id: new Types.ObjectId(buyerId),
      seller_id: new Types.ObjectId(listingSellerId),
      listing_id: new Types.ObjectId(dto.listing_id),
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
    // Validate secure hash
    const secureHash = vnpayData.vnp_SecureHash;
    const dataWithoutHash = { ...vnpayData };
    delete (dataWithoutHash as any).vnp_SecureHash;
    delete (dataWithoutHash as any).vnp_SecureHashType;

    const signData = this.sortObject(dataWithoutHash);
    // Build signature string using encodeURIComponent for values (VNPay requires URL encoded values)
  const signDataQueryString = this.buildVnPaySignString(signData);

  // Debug: log incoming and computed signature (temporary for troubleshooting)
  console.log('[VNPay IPN] sign string:', signDataQueryString);
  console.log('[VNPay IPN] incoming secureHash:', secureHash);

  const hmac = crypto.createHmac('sha512', this.hashSecret);
  const signed = hmac.update(Buffer.from(signDataQueryString, 'utf-8')).digest('hex');
  console.log('[VNPay IPN] computed secureHash:', signed);

    if (secureHash !== signed) {
      throw new BadRequestException('Invalid signature');
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
      // Trigger business logic for successful payment
      try {
        // Avoid duplicate transaction/contract if already created
        if (!(payment as any).transaction_id) {
          // Create a transaction record
          const createTransactionDto = {
            listing_id: payment.listing_id.toString(),
            buyer_id: payment.buyer_id.toString(),
            seller_id: payment.seller_id.toString(),
            price: payment.amount,
            payment_method: undefined,
            payment_reference: (payment._id as Types.ObjectId).toString(),
            notes: 'Auto-created from VNPay IPN',
          } as any;

          const transaction = await this.transactionsService.create(createTransactionDto);

          // Save transaction id to payment to mark it handled
          (payment as any).transaction_id = transaction._id;
          await payment.save();

          // Create a simple contract record referencing this transaction
          const contractNo = `CONTRACT-${new Date().toISOString().replace(/[:.]/g, '-')}-${transaction._id.toString().slice(-6)}`;
          const documentUrl = `${this.returnUrl.replace(/\/api\/payment\/vnpay-return$/, '')}/contracts/${contractNo}.pdf`;

          const createContractDto = {
            transaction_id: transaction._id.toString(),
            payment_id: (payment._id as Types.ObjectId).toString(),
            contract_no: contractNo,
            document_url: documentUrl,
            terms_and_conditions: 'Standard sale contract',
            notes: 'Auto-generated on successful payment',
          } as any;

          await this.contactsService.create(createContractDto);
        }
      } catch (err) {
        // Log error but don't fail IPN processing
        console.error('Error creating transaction/contract after payment:', err);
      }
    }

    return { RspCode: '00', Message: 'success' };
  }

  /**
   * Verify VNPay Return
   */
  async verifyReturnUrl(vnpayData: Record<string, any>) {
    const secureHash = vnpayData.vnp_SecureHash;
    const dataWithoutHash = { ...vnpayData };
    delete (dataWithoutHash as any).vnp_SecureHash;
    delete (dataWithoutHash as any).vnp_SecureHashType;

    const signData = this.sortObject(dataWithoutHash);
  const signDataQueryString = this.buildVnPaySignString(signData);

  // Debug: log incoming and computed signature (temporary for troubleshooting)
  console.log('[VNPay Return] sign string:', signDataQueryString);
  console.log('[VNPay Return] incoming secureHash:', secureHash);

  const hmac = crypto.createHmac('sha512', this.hashSecret);
  const signed = hmac.update(Buffer.from(signDataQueryString, 'utf-8')).digest('hex');
  console.log('[VNPay Return] computed secureHash:', signed);

    if (secureHash !== signed) {
      throw new BadRequestException('Invalid signature');
    }

    const orderId = vnpayData.vnp_TxnRef;
    const rspCode = vnpayData.vnp_ResponseCode;
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
            if (!(payment as any).transaction_id) {
              const createTransactionDto = {
                listing_id: payment.listing_id.toString(),
                buyer_id: payment.buyer_id.toString(),
                seller_id: payment.seller_id.toString(),
                price: payment.amount,
                payment_method: undefined,
                payment_reference: (payment._id as Types.ObjectId).toString(),
                notes: 'Auto-created from VNPay Return',
              } as any;

              const transaction = await this.transactionsService.create(createTransactionDto);
              (payment as any).transaction_id = transaction._id;
              await payment.save();

              const contractNo = `CONTRACT-${new Date().toISOString().replace(/[:.]/g, '-')}-${transaction._id.toString().slice(-6)}`;
              const documentUrl = `${this.returnUrl.replace(/\/api\/payment\/vnpay-return$/, '')}/contracts/${contractNo}.pdf`;

              const createContractDto = {
                transaction_id: transaction._id.toString(),
                payment_id: (payment._id as Types.ObjectId).toString(),
                contract_no: contractNo,
                document_url: documentUrl,
                terms_and_conditions: 'Standard sale contract',
                notes: 'Auto-generated on successful payment (return)',
              } as any;

              await this.contactsService.create(createContractDto);
            }
          } catch (err) {
            console.error('Error creating transaction/contract on return:', err);
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
      message: rspCode === '00' ? 'Success' : 'Failed'
    };
  }

  /**
   * Sort object by key
   */
  private sortObject(obj: Record<string, any>): Record<string, any> {
    const sorted: Record<string, any> = {};
    const keys = Object.keys(obj).sort();
    
    for (const key of keys) {
      if (obj[key] !== null && obj[key] !== undefined) {
        sorted[key] = obj[key];
      }
    }
    
    return sorted;
  }

  /**
   * Build VNPay signature string: key1=value1&key2=value2... with values encoded
   * VNPay expects URL encoded values (encodeURIComponent) when computing HMAC
   */
  private buildVnPaySignString(obj: Record<string, any>): string {
    const keys = Object.keys(obj).sort();
    const parts: string[] = [];
    for (const key of keys) {
      const value = obj[key];
      // VNPay expects values to be URL encoded
      // VNPay historically uses + for spaces in their canonical string. Encode then replace %20 with +
      const encoded = encodeURIComponent(value ?? '').replace(/%20/g, '+');
      parts.push(`${key}=${encoded}`);
    }
    return parts.join('&');
  }

  /**
   * Format date for VNPay
   */
  private formatDate(date: Date): string {
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    
    return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
  }
}