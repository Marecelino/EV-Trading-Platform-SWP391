import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Commission, CommissionStatus } from '../model/commissions';
import { CreateCommissionDto, UpdateCommissionDto } from './dto';

@Injectable()
export class CommissionsService {
  constructor(
    @InjectModel(Commission.name) private commissionModel: Model<Commission>,
  ) {}

  async create(createCommissionDto: CreateCommissionDto): Promise<Commission> {
    try {
      const commission = new this.commissionModel(createCommissionDto);
      return await commission.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Commission for this transaction already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<Commission[]> {
    return this.commissionModel.find()
      .populate('transaction_id')
      .populate('config_id')
      .exec();
  }

  async findByStatus(status: CommissionStatus): Promise<Commission[]> {
    return this.commissionModel.find({ status })
      .populate('transaction_id')
      .populate('config_id')
      .exec();
  }

  async findPending(): Promise<Commission[]> {
    return this.findByStatus(CommissionStatus.PENDING);
  }

  async findPaid(): Promise<Commission[]> {
    return this.findByStatus(CommissionStatus.PAID);
  }

  async findCancelled(): Promise<Commission[]> {
    return this.findByStatus(CommissionStatus.CANCELLED);
  }

  async findOne(id: string): Promise<Commission> {
    const commission = await this.commissionModel.findById(id)
      .populate('transaction_id')
      .populate('config_id')
      .exec();
    if (!commission) {
      throw new NotFoundException(`Commission with ID ${id} not found`);
    }
    return commission;
  }

  async findByTransactionId(transactionId: string): Promise<Commission> {
    const commission = await this.commissionModel.findOne({ transaction_id: transactionId })
      .populate('transaction_id')
      .populate('config_id')
      .exec();
    if (!commission) {
      throw new NotFoundException(`Commission for transaction ${transactionId} not found`);
    }
    return commission;
  }

  async update(id: string, updateCommissionDto: UpdateCommissionDto): Promise<Commission> {
    try {
      const commission = await this.commissionModel.findByIdAndUpdate(
        id,
        updateCommissionDto,
        { new: true, runValidators: true }
      )
        .populate('transaction_id')
        .populate('config_id')
        .exec();
      
      if (!commission) {
        throw new NotFoundException(`Commission with ID ${id} not found`);
      }
      return commission;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Commission for this transaction already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.commissionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Commission with ID ${id} not found`);
    }
  }

  async markAsPaid(id: string): Promise<Commission> {
    const commission = await this.commissionModel.findByIdAndUpdate(
      id,
      { status: CommissionStatus.PAID },
      { new: true }
    )
      .populate('transaction_id')
      .populate('config_id')
      .exec();
    
    if (!commission) {
      throw new NotFoundException(`Commission with ID ${id} not found`);
    }
    return commission;
  }

  async markAsCancelled(id: string): Promise<Commission> {
    const commission = await this.commissionModel.findByIdAndUpdate(
      id,
      { status: CommissionStatus.CANCELLED },
      { new: true }
    )
      .populate('transaction_id')
      .populate('config_id')
      .exec();
    
    if (!commission) {
      throw new NotFoundException(`Commission with ID ${id} not found`);
    }
    return commission;
  }

  async getTotalCommissionByStatus(status: CommissionStatus): Promise<number> {
    const result = await this.commissionModel.aggregate([
      { $match: { status } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).exec();
    
    return result.length > 0 ? result[0].total : 0;
  }

  async getTotalPendingCommission(): Promise<number> {
    return this.getTotalCommissionByStatus(CommissionStatus.PENDING);
  }

  async getTotalPaidCommission(): Promise<number> {
    return this.getTotalCommissionByStatus(CommissionStatus.PAID);
  }

  async getCommissionStats(): Promise<{
    pending: { count: number; total: number };
    paid: { count: number; total: number };
    cancelled: { count: number; total: number };
  }> {
    const stats = await this.commissionModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]).exec();

    const result = {
      pending: { count: 0, total: 0 },
      paid: { count: 0, total: 0 },
      cancelled: { count: 0, total: 0 }
    };

    stats.forEach(stat => {
      result[stat._id] = { count: stat.count, total: stat.total };
    });

    return result;
  }
}