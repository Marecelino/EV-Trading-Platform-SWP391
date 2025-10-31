import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { forwardRef } from '@nestjs/common';
import { ListingsModule } from '../listings/listings.module';
import { AuctionsModule } from '../auctions/auctions.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { ContactsModule } from '../contacts/contacts.module';
import { CommissionsModule } from '../commissions/commissions.module';
import { SignnowModule } from '../signnow/signnow.module';
import { User, UserSchema } from '../model/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ConfigModule,
    forwardRef(() => ListingsModule),
    forwardRef(() => AuctionsModule),
    TransactionsModule,
    ContactsModule,
    CommissionsModule,
    SignnowModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule { }
