import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from '../model/transactions';
import { User, UserSchema } from '../model/users.schema';
import { TransactionsService } from './transactions.service';
import { ListingsModule } from '../listings/listings.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ListingsModule,
  ],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
