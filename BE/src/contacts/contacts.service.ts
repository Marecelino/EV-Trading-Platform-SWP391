import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { Contract, ContractDocument, ContractStatus } from '../model/contacts';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { FilterContactsDto } from './dto/filter-contacts.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
  ) {}

  async create(createContactDto: CreateContactDto): Promise<ContractDocument> {
    // Initialize audit events and record creation event
    const payload: any = { ...createContactDto };
    payload.audit_events = payload.audit_events || [];
    payload.audit_events.push({
      event: 'created',
      by: 'system',
      at: new Date(),
      meta: { source: 'createContact' },
    });

    const contract = new this.contractModel(payload);
    return contract.save();
  }

  async findAll(filter: FilterContactsDto = {}, page = 1, limit = 20) {
    const query: FilterQuery<Contract> = {};

    if (filter.status) {
      query.status = filter.status;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.contractModel
        .find(query)
        .populate('transaction_id')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.contractModel.countDocuments(query),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<ContractDocument> {
    const contract = await this.contractModel
      .findById(id)
      .populate({
        path: 'transaction_id',
        populate: [{ path: 'buyer_id' }, { path: 'seller_id' }],
      })
      .exec();

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  async update(
    id: string,
    updateContactDto: UpdateContactDto,
  ): Promise<ContractDocument> {
    const contract = await this.contractModel
      .findByIdAndUpdate(id, updateContactDto, {
        new: true,
        runValidators: true,
      })
      .populate('transaction_id')
      .exec();

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  async remove(id: string): Promise<ContractDocument> {
    const contract = await this.contractModel.findByIdAndDelete(id).exec();

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }

  async findByTransaction(
    transactionId: string,
  ): Promise<ContractDocument | null> {
    return this.contractModel
      .findOne({ transaction_id: transactionId })
      .populate('transaction_id')
      .exec();
  }

  /**
   * Find a contact/contract by a provider document identifier that may be
   * embedded in the stored document_url (e.g. SignNow document id).
   */
  async findByDocumentId(documentId: string): Promise<ContractDocument | null> {
    if (!documentId) return null;
    // match any document_url that contains the documentId substring
    return this.contractModel
      .findOne({ document_url: { $regex: documentId } })
      .populate('transaction_id')
      .exec();
  }

  /**
   * Confirm an electronic signature on a contact/contract.
   * Adds a signature hash to the record, appends an audit note, and optionally marks the contract as signed.
   */
  async confirmSignature(
    id: string,
    payload: {
      signer_id?: string;
      signer_email?: string;
      signature_hash?: string;
      method?: string;
      signed_at?: string;
      mark_as_signed?: boolean;
    },
    performedBy?: string,
  ): Promise<ContractDocument> {
    const contract = await this.contractModel.findById(id).exec();
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    contract.signatures = contract.signatures || [];
    if (payload.signature_hash) {
      contract.signatures.push(payload.signature_hash);
    }

    const signer =
      payload.signer_email || payload.signer_id || performedBy || 'unknown';
    const when = payload.signed_at ? new Date(payload.signed_at) : new Date();
    const note = `Signature confirmed by ${signer} method=${payload.method || 'electronic'} at ${when.toISOString()}`;
    contract.notes = (contract.notes || '') + '\n' + note;

    if (payload.signed_at) {
      contract.signed_at = new Date(payload.signed_at);
    }

    if (payload.mark_as_signed) {
      contract.status = ContractStatus.SIGNED;
      if (!contract.signed_at) contract.signed_at = new Date();
    }
    // Append audit event for signature confirmation
    contract.audit_events = contract.audit_events || [];
    contract.audit_events.push({
      event: 'signature_confirmed',
      by: payload.signer_email || payload.signer_id || performedBy || 'unknown',
      at: new Date(payload.signed_at || Date.now()),
      meta: {
        method: payload.method || 'electronic',
        signature_hash: payload.signature_hash,
      },
    });

    await contract.save();
    return contract;
  }

  /**
   * Store the URL of a rendered/signed contract PDF on the contract document.
   */
  async setSignedDocumentUrl(id: string, url: string) {
    const contract = await this.contractModel
      .findByIdAndUpdate(id, { signed_document_url: url }, { new: true })
      .populate({
        path: 'transaction_id',
        populate: [{ path: 'buyer_id' }, { path: 'seller_id' }],
      })
      .exec();

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return contract;
  }
}
