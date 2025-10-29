import { EventEmitter } from 'events';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { firstValueFrom, take } from 'rxjs';
import { NotificationsStreamController } from './notifications.stream.controller';
import { NOTIFICATION_CREATED_EVENT } from './notifications.service';

describe('NotificationsStreamController', () => {
  it('emits notifications for the authenticated user', async () => {
    const emitter = new EventEmitter2();
    const controller = new NotificationsStreamController(emitter);
    const request = Object.assign(new EventEmitter(), {
      user: { sub: 'user-1' },
    });

    const eventPromise = firstValueFrom(
      controller.stream(request as any).pipe(take(1)),
    );

    emitter.emit(NOTIFICATION_CREATED_EVENT, {
      userId: 'user-2',
      notification: { id: 'ignored' },
    });

    emitter.emit(NOTIFICATION_CREATED_EVENT, {
      userId: 'user-1',
      notification: { id: 'target' },
    });

    const event = await eventPromise;
    request.emit('close');

    expect(event.data).toEqual({ id: 'target' });
  });

  it('cleans up listeners when the request closes', async () => {
    const emitter = new EventEmitter2();
    const controller = new NotificationsStreamController(emitter);
    const request = Object.assign(new EventEmitter(), {
      user: { sub: 'user-33' },
    });

    const stream$ = controller.stream(request as any);
    const eventPromise = firstValueFrom(stream$.pipe(take(1)));

    emitter.emit(NOTIFICATION_CREATED_EVENT, {
      userId: 'user-33',
      notification: { id: 'cleanup' },
    });

    await eventPromise;
    request.emit('close');

    expect(emitter.listenerCount(NOTIFICATION_CREATED_EVENT)).toBe(0);
  });
});
