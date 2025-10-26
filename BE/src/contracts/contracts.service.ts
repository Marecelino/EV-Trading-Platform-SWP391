import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  Contract,
  ContractDocument,
  ContractStatus,
} from './schemas/contract.schema';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractStatusDto } from './dto/update-contract-status.dto';
import { ContractWebhookDto } from './dto/contract-webhook.dto';

interface CreateFromPaymentOptions {
  transactionId: string;
  paymentId: string;
  amount: number;
  buyerName?: string;
  sellerName?: string;
  listingTitle?: string;
  notes?: string;
}

interface ProviderMetadata {
  provider?: string;
  provider_document_id?: string;
  provider_invite_id?: string;
  document_url?: string;
  notes?: string;
  performed_by?: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class ContractsService {
  private readonly publicBaseUrl: string;

  constructor(
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
    private readonly configService: ConfigService,
  ) {
    this.publicBaseUrl =
      this.configService.get<string>('CONTRACT_PUBLIC_BASE_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:5173';
  }

  async create(dto: CreateContractDto) {
    const contract = new this.contractModel({
      ...dto,
      transaction_id: new Types.ObjectId(dto.transaction_id),
      payment_id: new Types.ObjectId(dto.payment_id),
      audit_events: [
        {
          label: 'CONTRACT_CREATED',
          performed_at: new Date(),
          performed_by: 'system',
          payload: { status: dto.status ?? ContractStatus.DRAFT },
        },
      ],
    });

    return contract.save();
  }

  async createFromPayment(options: CreateFromPaymentOptions) {
    const contractNo = this.generateContractNumber(options.transactionId);
    const documentUrl = this.buildDocumentUrl(contractNo);

    const createContractDto: CreateContractDto = {
      transaction_id: options.transactionId,
      payment_id: options.paymentId,
      contract_no: contractNo,
      document_url: documentUrl,
      status: ContractStatus.PENDING_SIGNATURE,
      terms_and_conditions: this.buildDefaultTerms(options),
      notes: options.notes,
    };

    return this.create(createContractDto);
  }

  async findById(id: string) {
    const contract = await this.contractModel.findById(id).lean();
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    return contract;
  }

  async findByContractNo(contractNo: string) {
    const contract = await this.contractModel
      .findOne({ contract_no: contractNo })
      .lean();
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    return contract;
  }

  async updateStatus(id: string, dto: UpdateContractStatusDto) {
    const contract = await this.contractModel.findById(id);
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (dto.status) {
      contract.status = dto.status;
      if (dto.status === ContractStatus.SIGNED && !contract.signed_at) {
        contract.signed_at = new Date();
      }
    }

    if (dto.notes) {
      contract.notes = dto.notes;
    }

    contract.audit_events.push({
      label: 'CONTRACT_STATUS_UPDATED',
      performed_at: new Date(),
      performed_by: 'system',
      payload: { status: dto.status, notes: dto.notes },
    });

    await contract.save();
    return contract.toObject();
  }

  async attachProviderMetadata(contractId: string, metadata: ProviderMetadata) {
    const contract = await this.contractModel.findById(contractId);
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (metadata.provider) {
      contract.provider = metadata.provider;
    }
    if (metadata.provider_document_id) {
      contract.provider_document_id = metadata.provider_document_id;
    }
    if (metadata.provider_invite_id) {
      contract.provider_invite_id = metadata.provider_invite_id;
    }
    if (metadata.document_url) {
      contract.document_url = metadata.document_url;
    }
    if (metadata.notes) {
      contract.notes = metadata.notes;
    }

    contract.audit_events.push({
      label: 'CONTRACT_PROVIDER_METADATA_ATTACHED',
      performed_at: new Date(),
      performed_by: metadata.performed_by ?? 'system',
      payload: metadata.payload ?? {
        provider: metadata.provider,
        provider_document_id: metadata.provider_document_id,
        provider_invite_id: metadata.provider_invite_id,
      },
    });

    await contract.save();
    return contract.toObject();
  }

  async findByProviderDocumentId(providerDocumentId: string) {
    return this.contractModel
      .findOne({ provider_document_id: providerDocumentId })
      .lean();
  }

  async handleWebhook(dto: ContractWebhookDto) {
    const contract = await this.contractModel.findOne({
      contract_no: dto.contract_no,
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    contract.status = dto.status;
    if (dto.status === ContractStatus.SIGNED) {
      contract.signed_at = new Date();
    }

    contract.audit_events.push({
      label: 'CONTRACT_WEBHOOK_EVENT',
      performed_at: new Date(),
      performed_by: dto.performed_by ?? 'provider',
      payload: dto.payload,
    });

    await contract.save();
    return contract.toObject();
  }

  private buildDefaultTerms(options: CreateFromPaymentOptions) {
    const lines = [
      'This contract is generated automatically after a successful payment.',
      `Total amount: ${options.amount.toLocaleString('vi-VN')} VND.`,
    ];

    if (options.buyerName) {
      lines.push(`Buyer: ${options.buyerName}`);
    }

    if (options.sellerName) {
      lines.push(`Seller: ${options.sellerName}`);
    }

    if (options.listingTitle) {
      lines.push(`Listing: ${options.listingTitle}`);
    }

    return lines.join('\n');
  }

  private buildDocumentUrl(contractNo: string) {
    const normalized = this.publicBaseUrl.replace(/\/$/, '');
    return `${normalized}/contracts/${contractNo}.pdf`;
  }

  private generateContractNumber(transactionId: string) {
    const suffix = transactionId.slice(-6).toUpperCase();
    return `CONTRACT-${new Date().toISOString().replace(/[:.]/g, '-')}-${suffix}`;
  }
}
