import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { ListingsModule } from '../listings/listings.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { ContractsModule } from '../contracts/contracts.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { SignnowModule } from '../signnow/signnow.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    ConfigModule,
    ListingsModule,
    TransactionsModule,
    ContractsModule,
    CommissionsModule,
    SignnowModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
