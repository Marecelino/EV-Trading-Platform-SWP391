import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from '../model/notifications';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { FilterNotificationsDto } from './dto/filter-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const notification = new this.notificationModel(createNotificationDto);
    return notification.save();
  }

  async findAll(filters: FilterNotificationsDto) {
    const { user_id, type, is_read, page = 1, limit = 10 } = filters;

    const query: Record<string, any> = {};
    if (user_id) query.user_id = user_id;
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
    await this.notificationModel.updateMany(
      { user_id: userId, is_read: false },
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
