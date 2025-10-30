import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  TransactionComplaint,
  TransactionComplaintDocument,
  TransactionComplaintResolution,
  TransactionComplaintStatus,
} from '../model/transactioncomplaints';
import { Transaction, TransactionDocument } from '../model/transactions';
import { CreateTransactionComplaintDto } from './dto/create-transaction-complaint.dto';
import { UpdateTransactionComplaintDto } from './dto/update-transaction-complaint.dto';
import { FilterTransactionComplaintsDto } from './dto/filter-transaction-complaints.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../model/notifications';

@Injectable()
export class TransactionComplaintsService {
  constructor(
    @InjectModel(TransactionComplaint.name)
    private readonly complaintModel: Model<TransactionComplaintDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    userId: string,
    transactionId: string,
    dto: CreateTransactionComplaintDto,
  ) {
    const { transaction, participantRole, counterpartId } =
      await this.validateParticipant(transactionId, userId);

    const reasonLabel = dto.reason.replace(/_/g, ' ').toLowerCase();

    const complaint = await this.complaintModel.create({
      transaction_id: transaction._id,
      complainant_id: new Types.ObjectId(userId),
      respondent_id: counterpartId
        ? new Types.ObjectId(counterpartId)
        : undefined,
      reason: dto.reason,
      description: dto.description,
      attachments: dto.attachments ?? [],
      status: TransactionComplaintStatus.OPEN,
    });

    if (counterpartId) {
      await this.notificationsService.create({
        user_id: counterpartId,
        type: NotificationType.COMPLAINT_SUBMITTED,
        message: `A new complaint (${reasonLabel}) was filed for transaction ${transaction._id.toString()}.`,
        related_id: complaint._id.toString(),
      });
    }

    return {
      ...complaint.toObject(),
      participantRole,
    };
  }

  async findForParticipant(userId: string, transactionId: string) {
    await this.validateParticipant(transactionId, userId);

    const complaints = await this.complaintModel
      .find({
        transaction_id: new Types.ObjectId(transactionId),
        $or: [
          { complainant_id: new Types.ObjectId(userId) },
          { respondent_id: new Types.ObjectId(userId) },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    return complaints;
  }

  async findAllForAdmin(filters: FilterTransactionComplaintsDto) {
    const {
      status,
      transaction_id,
      complainant_id,
      search,
      limit = 20,
      page = 1,
    } = filters;

    const query: FilterQuery<TransactionComplaintDocument> = {};

    if (status) {
      query.status = status;
    }

    if (transaction_id) {
      if (!Types.ObjectId.isValid(transaction_id)) {
        throw new BadRequestException('Invalid transaction reference');
      }
      query.transaction_id = new Types.ObjectId(transaction_id);
    }

    if (complainant_id) {
      if (!Types.ObjectId.isValid(complainant_id)) {
        throw new BadRequestException('Invalid user reference');
      }
      query.complainant_id = new Types.ObjectId(complainant_id);
    }

    if (search) {
      query.$text = { $search: search };
    }

    const capLimit = Math.max(1, Math.min(limit, 100));
    const normalizedPage = Math.max(1, page);
    const skip = (normalizedPage - 1) * capLimit;

    const [data, total] = await Promise.all([
      this.complaintModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(capLimit)
        .populate('transaction_id')
        .populate('complainant_id', 'name email')
        .populate('respondent_id', 'name email')
        .lean(),
      this.complaintModel.countDocuments(query),
    ]);

    return {
      data,
      meta: {
        page: normalizedPage,
        limit: capLimit,
        total,
        totalPages: Math.ceil(total / capLimit),
      },
    };
  }

  async findOneForAdmin(id: string) {
    const complaint = await this.complaintModel
      .findById(id)
      .populate('transaction_id')
      .populate('complainant_id', 'name email')
      .populate('respondent_id', 'name email')
      .lean();

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    return complaint;
  }

  async updateByAdmin(
    id: string,
    dto: UpdateTransactionComplaintDto,
    performedBy: string,
  ) {
    if (!Types.ObjectId.isValid(performedBy)) {
      throw new UnauthorizedException('Invalid administrator reference');
    }

    const update: Partial<TransactionComplaint> = {};

    if (dto.status) {
      update.status = dto.status;
      if (
        dto.status === TransactionComplaintStatus.RESOLVED ||
        dto.status === TransactionComplaintStatus.REJECTED
      ) {
        update.resolved_at = new Date();
      } else {
        update.resolved_at = undefined;
      }
    }

    if (dto.resolution) {
      update.resolution = dto.resolution;
    }

    if (dto.admin_notes !== undefined) {
      update.admin_notes = dto.admin_notes;
    }

    if (dto.assigned_to) {
      if (!Types.ObjectId.isValid(dto.assigned_to)) {
        throw new BadRequestException('Invalid assignee reference');
      }
      update.assigned_to = new Types.ObjectId(dto.assigned_to);
    }

    const complaint = await this.complaintModel
      .findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
      })
      .lean();

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    const complainantId =
      complaint.complainant_id instanceof Types.ObjectId
        ? complaint.complainant_id.toHexString()
        : String(
            (complaint.complainant_id as any)?._id ?? complaint.complainant_id,
          );

    const respondentId =
      complaint.respondent_id instanceof Types.ObjectId
        ? complaint.respondent_id.toHexString()
        : complaint.respondent_id
          ? String(
              (complaint.respondent_id as any)?._id ?? complaint.respondent_id,
            )
          : undefined;

    const notifyPromises = [
      this.notificationsService.create({
        user_id: complainantId,
        type: NotificationType.COMPLAINT_UPDATED,
        message: `Your complaint ${complaint._id.toString()} has been updated to status ${complaint.status}.`,
        related_id: complaint._id.toString(),
      }),
    ];

    if (respondentId) {
      notifyPromises.push(
        this.notificationsService.create({
          user_id: respondentId,
          type: NotificationType.COMPLAINT_UPDATED,
          message: `Complaint ${complaint._id.toString()} status is now ${complaint.status}.`,
          related_id: complaint._id.toString(),
        }),
      );
    }

    await Promise.allSettled(notifyPromises);

    return complaint;
  }

  private async validateParticipant(transactionId: string, userId: string) {
    if (!Types.ObjectId.isValid(transactionId)) {
      throw new BadRequestException('Invalid transaction reference');
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new UnauthorizedException('Invalid user reference');
    }

    const transaction = await this.transactionModel
      .findById(transactionId)
      .select('buyer_id seller_id status')
      .lean();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const buyerId = this.normalizeId(transaction.buyer_id);
    const sellerId = this.normalizeId(transaction.seller_id);
    const normalizedUserId = userId.toString();

    if (normalizedUserId !== buyerId && normalizedUserId !== sellerId) {
      throw new UnauthorizedException(
        'You are not a participant in this transaction',
      );
    }

    const participantRole = normalizedUserId === buyerId ? 'BUYER' : 'SELLER';
    const counterpartId = participantRole === 'BUYER' ? sellerId : buyerId;

    return { transaction, participantRole, counterpartId };
  }

  private normalizeId(value: any) {
    if (!value) {
      return undefined;
    }

    if (value instanceof Types.ObjectId) {
      return value.toHexString();
    }

    return String(value);
  }
}
