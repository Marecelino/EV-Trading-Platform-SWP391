import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Review, ReviewSchema } from '../model/reviews.schema';
import { Transaction, TransactionSchema } from '../model/transactions';
import { User, UserSchema } from '../model/users.schema';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
