import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SignnowService } from './signnow.service';
import { SignnowController } from './signnow.controller';
import { ContactsModule } from '../contacts/contacts.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({ timeout: 10000 }),
    forwardRef(() => require('../contacts/contacts.module').ContactsModule),
  ],
  providers: [SignnowService],
  controllers: [SignnowController],
  exports: [SignnowService],
})
export class SignnowModule { }
