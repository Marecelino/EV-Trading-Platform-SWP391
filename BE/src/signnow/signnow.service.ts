import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import FormData = require('form-data');
import PDFDocument = require('pdfkit');
import * as crypto from 'crypto';
import { CreateSignnowContractDto } from './dto/create-signnow-contract.dto';
import { ContractsService } from '../contracts/contracts.service';
import { ContractStatus } from '../contracts/schemas/contract.schema';
import { SignnowWebhookDto } from './dto/signnow-webhook.dto';

interface UploadResult {
  documentId: string;
  downloadUrl: string;
}

@Injectable()
export class SignnowService {
  private readonly logger = new Logger(SignnowService.name);
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly username: string;
  private readonly password: string;
  private readonly fromEmail: string;
  private readonly webhookSecret?: string;

  private accessToken?: string;
  private tokenExpiresAt = 0;

  constructor(
    @Inject(HttpService)
    private readonly httpService: any,
    private readonly configService: ConfigService,
    private readonly contractsService: ContractsService,
  ) {
    this.baseUrl =
      this.configService.get<string>('SIGNNOW_BASE_URL') ||
      'https://api-eval.signnow.com';
    // Do NOT throw during construction. Read values permissively here so the
    // app can start even when SignNow is not configured. Strict validation is
    // performed lazily when SignNow actions are invoked (see getAccessToken()).
    this.clientId = this.configService.get<string>('SIGNNOW_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('SIGNNOW_CLIENT_SECRET') || '';
    this.username = this.configService.get<string>('SIGNNOW_USERNAME') || '';
    this.password = this.configService.get<string>('SIGNNOW_PASSWORD') || '';
    this.fromEmail = this.configService.get<string>('SIGNNOW_FROM_EMAIL') || this.username;
    this.webhookSecret = this.configService.get<string>('SIGNNOW_WEBHOOK_SECRET');
  }

  async createContractAndInvite(dto: CreateSignnowContractDto) {
    const contract = await this.contractsService.findById(dto.contract_id);
    if (!contract.contract_no) {
      throw new InternalServerErrorException(
        'Contract missing contract number',
      );
    }

    const token = await this.getAccessToken();
    const pdfBuffer = await this.buildPdfBuffer({
      buyerName: dto.buyer_name,
      sellerName: dto.seller_name,
      amount: dto.amount,
      contractNo: contract.contract_no,
    });

    const contractNo = contract.contract_no!;
    const uploadResult = await this.uploadDocument(
      token,
      pdfBuffer,
      contractNo,
    );
    const inviteId = await this.sendInvite(
      token,
      uploadResult.documentId,
      dto,
      contractNo,
    );

    await this.contractsService.attachProviderMetadata(dto.contract_id, {
      provider: 'signnow',
      provider_document_id: uploadResult.documentId,
      provider_invite_id: inviteId,
      document_url: uploadResult.downloadUrl,
      notes: 'Pending signatures via SignNow',
      performed_by: this.fromEmail,
    });

    // Ensure contract remains pending signature while waiting for webhook
    if (contract.status !== ContractStatus.PENDING_SIGNATURE) {
      await this.contractsService.updateStatus(dto.contract_id, {
        status: ContractStatus.PENDING_SIGNATURE,
        notes: 'Awaiting SignNow signatures',
      });
    }

    return {
      provider: 'signnow',
      documentId: uploadResult.documentId,
      inviteId,
      downloadUrl: uploadResult.downloadUrl,
    };
  }

  async handleWebhook(payload: SignnowWebhookDto, signature?: string) {
    if (this.webhookSecret) {
      if (!signature) {
        throw new BadRequestException('Missing webhook signature');
      }
      const expected = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      if (expected !== signature) {
        throw new BadRequestException('Invalid webhook signature');
      }
    }

    const documentId =
      payload.document_id ||
      payload.data?.document_id ||
      payload.data?.document?.id;

    if (!documentId) {
      throw new BadRequestException(
        'Webhook payload missing document identifier',
      );
    }

    const contract =
      await this.contractsService.findByProviderDocumentId(documentId);

    if (!contract) {
      this.logger.warn(`Received webhook for unknown document ${documentId}`);
      return { status: 'ignored' };
    }

    const event = (payload.event || '').toLowerCase();
    if (event.includes('complete') || event.includes('signed')) {
      await this.contractsService.updateStatus(contract._id.toString(), {
        status: ContractStatus.SIGNED,
        notes: 'SignNow marked contract as signed',
      });
      return { status: 'signed' };
    }

    if (event.includes('decline') || event.includes('reject')) {
      await this.contractsService.updateStatus(contract._id.toString(), {
        status: ContractStatus.CANCELLED,
        notes: 'SignNow reported decline',
      });
      return { status: 'declined' };
    }

    this.logger.debug(`Unhandled SignNow event ${event}`);
    return { status: 'ignored' };
  }

  private requireConfig(key: string) {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new InternalServerErrorException(`Missing configuration ${key}`);
    }
    return value;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiresAt > Date.now() + 30_000) {
      return this.accessToken;
    }

    // Validate required configs now that we actually need to authenticate.
    const username = this.requireConfig('SIGNNOW_USERNAME');
    const password = this.requireConfig('SIGNNOW_PASSWORD');
    const clientId = this.requireConfig('SIGNNOW_CLIENT_ID');
    const clientSecret = this.requireConfig('SIGNNOW_CLIENT_SECRET');

    const payload = new URLSearchParams();
    payload.append('grant_type', 'password');
    payload.append('username', username);
    payload.append('password', password);

    try {
      const response = await this.httpService.axiosRef.post(
        `${this.baseUrl}/oauth2/token`,
        payload.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          auth: {
            username: clientId,
            password: clientSecret,
          },
        },
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;
      return this.accessToken!;
    } catch (error) {
      this.logger.error('Failed to retrieve SignNow token', error);
      throw new InternalServerErrorException(
        'Unable to authenticate with SignNow',
      );
    }
  }

  private async uploadDocument(
    token: string,
    buffer: Buffer,
    contractNo: string,
  ): Promise<UploadResult> {
    const fileName = `contract-${contractNo}.pdf`;
    const form = new FormData();
    form.append('file', buffer, {
      filename: fileName,
      contentType: 'application/pdf',
    });

    try {
      const response = await this.httpService.axiosRef.post(
        `${this.baseUrl}/document`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            ...form.getHeaders(),
          },
        },
      );

      const documentId = response.data?.id;
      if (!documentId) {
        throw new Error('SignNow response missing document id');
      }

      const downloadUrl = `${this.baseUrl}/document/${documentId}/download?type=collapsed`;
      return { documentId, downloadUrl };
    } catch (error) {
      this.logger.error('Failed to upload contract to SignNow', error);
      throw new InternalServerErrorException(
        'Failed to upload contract to SignNow',
      );
    }
  }

  private async sendInvite(
    token: string,
    documentId: string,
    dto: CreateSignnowContractDto,
    contractNo: string,
  ) {
    const payload = {
      to: [
        {
          email: dto.buyer_email,
          role: 'Buyer',
          order: 1,
        },
        {
          email: dto.seller_email,
          role: 'Seller',
          order: 2,
        },
      ],
      from: this.fromEmail,
      subject: dto.subject || `Signature request for contract ${contractNo}`,
      message:
        dto.message ||
        `Xin vui lòng xem và ký hợp đồng ${contractNo} với tổng giá trị ${dto.amount.toLocaleString('vi-VN')} VND`,
    };

    try {
      const response = await this.httpService.axiosRef.post(
        `${this.baseUrl}/document/${documentId}/invite`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data?.id;
    } catch (error) {
      this.logger.error('Failed to create SignNow invite', error);
      throw new InternalServerErrorException('Failed to create SignNow invite');
    }
  }

  private async buildPdfBuffer(options: {
    buyerName: string;
    sellerName: string;
    amount: number;
    contractNo: string;
  }) {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      doc.fontSize(18).text('Sales Contract', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Contract No: ${options.contractNo}`);
      doc.text(`Date: ${new Date().toLocaleDateString('vi-VN')}`);
      doc.moveDown();

      doc.text(`Buyer: ${options.buyerName}`);
      doc.text(`Seller: ${options.sellerName}`);
      doc.text(`Total amount: ${options.amount.toLocaleString('vi-VN')} VND`);
      doc.moveDown();

      doc.text(
        'Terms and Conditions:\n' +
        '- The buyer agrees to purchase the listed EV/battery from the seller.\n' +
        '- The seller guarantees the accuracy of the information provided.\n' +
        '- Both parties agree to finalize the transaction upon successful payment.',
      );

      doc.moveDown();
      doc.text('Buyer Signature: ____________________________');
      doc.text('Seller Signature: ___________________________');

      doc.end();
    });
  }
}
