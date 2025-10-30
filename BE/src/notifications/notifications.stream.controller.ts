import { Controller, MessageEvent, Req, Sse, UseGuards } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  NOTIFICATION_CREATED_EVENT,
  NotificationCreatedEvent,
} from './notifications.service';
import { ApiBearerAuth } from '@nestjs/swagger';

const HEARTBEAT_INTERVAL_MS = 30_000;
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsStreamController {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  @UseGuards(JwtAuthGuard)
  @Sse('stream')
  stream(@Req() req: Request): Observable<MessageEvent> {
    const authUser = req.user as
      | { sub?: string; id?: string; _id?: string }
      | undefined;
    const userId = authUser?.sub ?? authUser?.id ?? authUser?._id;

    return new Observable<MessageEvent>((observer) => {
      if (!userId) {
        observer.complete();
        return;
      }

      const handler = (payload: NotificationCreatedEvent) => {
        if (String(payload.userId) !== String(userId)) {
          return;
        }

        observer.next({ data: payload.notification });
      };

      const heartbeat = setInterval(() => {
        observer.next({
          data: {
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
          },
        });
      }, HEARTBEAT_INTERVAL_MS);

      this.eventEmitter.on(NOTIFICATION_CREATED_EVENT, handler);

      let closed = false;
      const cleanup = () => {
        if (closed) {
          return;
        }
        closed = true;
        clearInterval(heartbeat);
        this.eventEmitter.off(NOTIFICATION_CREATED_EVENT, handler);
        observer.complete();
        req.removeListener('close', cleanup);
      };

      req.on('close', cleanup);

      return cleanup;
    });
  }
}
