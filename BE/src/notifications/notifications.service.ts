import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from '../model/notifications';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { FilterNotificationsDto } from './dto/filter-notifications.dto';

export const NOTIFICATION_CREATED_EVENT = 'notifications.created';
export interface NotificationCreatedEvent {
  userId: string;
  notification: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const userId = new Types.ObjectId(createNotificationDto.user_id);
    const payload = {
      ...createNotificationDto,
      user_id: userId,
    };

    const notification = await new this.notificationModel(payload).save();
    const serialized = notification.toObject();
    const normalizedUserId = userId.toHexString();

    const eventPayload: NotificationCreatedEvent = {
      userId: normalizedUserId,
      notification: {
        ...serialized,
        user_id: normalizedUserId,
      },
    };

    this.eventEmitter.emit(NOTIFICATION_CREATED_EVENT, eventPayload);

    return {
      ...serialized,
      user_id: normalizedUserId,
    };
  }

  async findAll(filters: FilterNotificationsDto) {
    const { user_id, type, is_read, page = 1, limit = 10 } = filters;

    const query: Record<string, any> = {};
    if (user_id) {
      query.user_id = Types.ObjectId.isValid(user_id)
        ? new Types.ObjectId(user_id)
        : user_id;
    }
    if (type) query.type = type;
    if (is_read !== undefined) query.is_read = is_read;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.notificationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments(query),
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

  async markAsRead(id: string) {
    const notification = await this.notificationModel
      .findByIdAndUpdate(
        id,
        { is_read: true, read_at: new Date() },
        { new: true },
      )
      .lean();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAllAsRead(userId: string) {
    const target = Types.ObjectId.isValid(userId)
      ? new Types.ObjectId(userId)
      : userId;
    await this.notificationModel.updateMany(
      { user_id: target, is_read: false },
      { is_read: true, read_at: new Date() },
    );
    return { success: true };
  }

  async update(id: string, updateDto: UpdateNotificationDto) {
    const notification = await this.notificationModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .lean();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async remove(id: string) {
    const notification = await this.notificationModel
      .findByIdAndDelete(id)
      .lean();
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }
}
