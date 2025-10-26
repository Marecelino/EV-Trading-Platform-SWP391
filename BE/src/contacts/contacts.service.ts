import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Contract, ContractDocument } from '../model/contacts';
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
    const contract = new this.contractModel(createContactDto);
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
      .populate('transaction_id')
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
}
