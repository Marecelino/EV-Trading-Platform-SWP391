import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionStatus } from 'src/model/transactions';
import { CreateCommissionDto, UpdateCommissionDto } from './dto';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Commission, CommissionStatus } from 'src/model/commissions';

@Injectable()
export class CommissionsService {
  private readonly logger = new Logger(CommissionsService.name);
  private readonly defaultRate: number;
  private readonly rules: CommissionRule[];

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Commission.name)
    private readonly commissionModel: Model<Commission>,
    private readonly transactionsService: TransactionsService,
  ) {
    this.defaultRate = this.parseNumberConfig('COMMISSION_DEFAULT_RATE', 0.05);
    this.rules = this.parseRules();
  }

  /**
   * Pay a commission and (best-effort) mark the related transaction as COMPLETED.
   * This intentionally does not modify any Contract records.
   */
  async payCommission(
    id: string,
    paymentReference?: string,
  ): Promise<Commission> {
    const commission = await this.commissionModel.findById(id).exec();
    if (!commission) {
      throw new NotFoundException(`Commission with ID ${id} not found`);
    }

    if (commission.status === CommissionStatus.PAID) {
      return commission;
    }

    commission.status = CommissionStatus.PAID;
    commission.paid_at = new Date();
    if (paymentReference) commission.payment_reference = paymentReference;

    const saved = await commission.save();

    // Best-effort: update related transaction to COMPLETED
    try {
      const txId = (saved.transaction_id as any)?.toString?.()
        ? (saved.transaction_id as any).toString()
        : String(saved.transaction_id || '');
      if (txId && Types.ObjectId.isValid(txId)) {
        await this.transactionsService.updateStatus(txId, {
          status: TransactionStatus.COMPLETED,
          notes: `Commission ${saved._id} marked as paid`,
        } as any);
      }
    } catch (err) {
      this.logger.warn(
        'Failed to update related transaction after commission payment',
        {
          commissionId: saved._id,
          error: err?.message || err,
        },
      );
    }

    return saved;
  }

  calculate(context: CommissionContext) {
    const rate = this.resolveRate(context);
    const platformFee = Math.round(context.amount * rate);
    const sellerPayout = Math.max(context.amount - platformFee, 0);

    return { rate, platformFee, sellerPayout };
  }

  private resolveRate(context: CommissionContext) {
    const matchingRule = this.rules.find((rule) => {
      if (rule.category && rule.category !== context.category) {
        return false;
      }
      if (rule.min !== undefined && context.amount < rule.min) {
        return false;
      }
      if (rule.max !== undefined && context.amount > rule.max) {
        return false;
      }
      return true;
    });

    return matchingRule?.rate ?? this.defaultRate;
  }

  private parseRules() {
    const raw = this.configService.get<string>('COMMISSION_RULES_JSON');
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as CommissionRule[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      this.logger.warn(`COMMISSION_RULES_JSON could not be parsed: ${error}`);
      return [];
    }
  }

  private parseNumberConfig(key: string, fallback: number) {
    const raw = this.configService.get<string>(key);
    if (!raw) {
      return fallback;
    }

    const value = Number(raw);
    if (Number.isNaN(value) || value < 0) {
      this.logger.warn(`${key} is invalid, using fallback ${fallback}`);
      return fallback;
    }

    return value;
  }
  async create(createCommissionDto: CreateCommissionDto): Promise<Commission> {
    try {
      const commission = new this.commissionModel(createCommissionDto);
      return await commission.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          'Commission for this transaction already exists',
        );
      }
      throw error;
    }
  }

  async findAll(): Promise<Commission[]> {
    return this.commissionModel
      .find()
      .populate('transaction_id')
      .populate('config_id')
      .exec();
  }

  async findByStatus(status: CommissionStatus): Promise<Commission[]> {
    return this.commissionModel
      .find({ status })
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
    const commission = await this.commissionModel
      .findById(id)
      .populate('transaction_id')
      .populate('config_id')
      .exec();
    if (!commission) {
      throw new NotFoundException(`Commission with ID ${id} not found`);
    }
    return commission;
  }

  async findByTransactionId(transactionId: string): Promise<Commission> {
    const commission = await this.commissionModel
      .findOne({ transaction_id: transactionId })
      .populate('transaction_id')
      .populate('config_id')
      .exec();
    if (!commission) {
      throw new NotFoundException(
        `Commission for transaction ${transactionId} not found`,
      );
    }
    return commission;
  }

  async update(
    id: string,
    updateCommissionDto: UpdateCommissionDto,
  ): Promise<Commission> {
    try {
      const commission = await this.commissionModel
        .findByIdAndUpdate(id, updateCommissionDto, {
          new: true,
          runValidators: true,
        })
        .populate('transaction_id')
        .populate('config_id')
        .exec();

      if (!commission) {
        throw new NotFoundException(`Commission with ID ${id} not found`);
      }
      return commission;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException(
          'Commission for this transaction already exists',
        );
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
    const commission = await this.commissionModel
      .findByIdAndUpdate(id, { status: CommissionStatus.PAID }, { new: true })
      .populate('transaction_id')
      .populate('config_id')
      .exec();

    if (!commission) {
      throw new NotFoundException(`Commission with ID ${id} not found`);
    }
    return commission;
  }

  async markAsCancelled(id: string): Promise<Commission> {
    const commission = await this.commissionModel
      .findByIdAndUpdate(
        id,
        { status: CommissionStatus.CANCELLED },
        { new: true },
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
    const result = await this.commissionModel
      .aggregate([
        { $match: { status } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ])
      .exec();

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
    const stats = await this.commissionModel
      .aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$amount' },
          },
        },
      ])
      .exec();

    const result = {
      pending: { count: 0, total: 0 },
      paid: { count: 0, total: 0 },
      cancelled: { count: 0, total: 0 },
    };

    stats.forEach((stat) => {
      result[stat._id] = { count: stat.count, total: stat.total };
    });

    return result;
  }
}

type CommissionRule = {
  min?: number;
  max?: number;
  rate: number;
  category?: string;
};

type CommissionContext = {
  amount: number;
  category?: string;
};
