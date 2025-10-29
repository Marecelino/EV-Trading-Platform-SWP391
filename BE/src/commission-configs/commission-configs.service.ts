import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommissionConfig } from '../model/commissionconfigs';
import { CreateCommissionConfigDto, UpdateCommissionConfigDto } from './dto';

@Injectable()
export class CommissionConfigsService {
  constructor(
    @InjectModel(CommissionConfig.name)
    private commissionConfigModel: Model<CommissionConfig>,
  ) {}

  async create(
    createCommissionConfigDto: CreateCommissionConfigDto,
  ): Promise<CommissionConfig> {
    const commissionConfig = new this.commissionConfigModel(
      createCommissionConfigDto,
    );
    return commissionConfig.save();
  }

  async findAll(): Promise<CommissionConfig[]> {
    return this.commissionConfigModel.find().exec();
  }

  async findActive(): Promise<CommissionConfig[]> {
    const now = new Date();
    return this.commissionConfigModel
      .find({
        is_active: true,
        effective_from: { $lte: now },
        $or: [{ effective_to: { $gte: now } }, { effective_to: null }],
      })
      .exec();
  }

  async findCurrent(): Promise<CommissionConfig | null> {
    const now = new Date();
    return this.commissionConfigModel
      .findOne({
        is_active: true,
        effective_from: { $lte: now },
        $or: [{ effective_to: { $gte: now } }, { effective_to: null }],
      })
      .sort({ effective_from: -1 })
      .exec();
  }

  async findOne(id: string): Promise<CommissionConfig> {
    const commissionConfig = await this.commissionConfigModel
      .findById(id)
      .exec();
    if (!commissionConfig) {
      throw new NotFoundException(`Commission config with ID ${id} not found`);
    }
    return commissionConfig;
  }

  async update(
    id: string,
    updateCommissionConfigDto: UpdateCommissionConfigDto,
  ): Promise<CommissionConfig> {
    const commissionConfig = await this.commissionConfigModel
      .findByIdAndUpdate(id, updateCommissionConfigDto, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!commissionConfig) {
      throw new NotFoundException(`Commission config with ID ${id} not found`);
    }
    return commissionConfig;
  }

  async remove(id: string): Promise<void> {
    const result = await this.commissionConfigModel
      .findByIdAndDelete(id)
      .exec();
    if (!result) {
      throw new NotFoundException(`Commission config with ID ${id} not found`);
    }
  }

  async toggleActive(id: string): Promise<CommissionConfig> {
    const commissionConfig = await this.commissionConfigModel
      .findById(id)
      .exec();
    if (!commissionConfig) {
      throw new NotFoundException(`Commission config with ID ${id} not found`);
    }

    commissionConfig.is_active = !commissionConfig.is_active;
    return commissionConfig.save();
  }

  async findByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<CommissionConfig[]> {
    return this.commissionConfigModel
      .find({
        effective_from: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      })
      .exec();
  }

  async findExpired(): Promise<CommissionConfig[]> {
    const now = new Date();
    return this.commissionConfigModel
      .find({
        effective_to: { $lt: now },
      })
      .exec();
  }

  async calculateCommission(
    transactionAmount: number,
  ): Promise<{ amount: number; config: CommissionConfig }> {
    const config = await this.findCurrent();
    if (!config) {
      throw new NotFoundException('No active commission configuration found');
    }

    let commissionAmount = (transactionAmount * config.percentage) / 100;

    // Apply min/max limits
    if (commissionAmount < config.min_fee) {
      commissionAmount = config.min_fee;
    } else if (commissionAmount > config.max_fee) {
      commissionAmount = config.max_fee;
    }

    return {
      amount: commissionAmount,
      config,
    };
  }
}
