import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Notification, NotificationSchema } from '../model/notifications';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsStreamController } from './notifications.stream.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [NotificationsController, NotificationsStreamController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
