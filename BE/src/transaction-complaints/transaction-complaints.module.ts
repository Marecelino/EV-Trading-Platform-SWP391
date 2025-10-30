import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TransactionComplaint,
  TransactionComplaintSchema,
} from '../model/transactioncomplaints';
import { Transaction, TransactionSchema } from '../model/transactions';
import { User, UserSchema } from '../model/users.schema';
import { TransactionComplaintsService } from './transaction-complaints.service';
import { TransactionComplaintsController } from './transaction-complaints.controller';
import { TransactionComplaintsAdminController } from './transaction-complaints.admin.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TransactionComplaint.name, schema: TransactionComplaintSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [
    TransactionComplaintsController,
    TransactionComplaintsAdminController,
  ],
  providers: [TransactionComplaintsService],
  exports: [TransactionComplaintsService],
})
export class TransactionComplaintsModule {}
