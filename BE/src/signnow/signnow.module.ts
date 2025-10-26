import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SignnowService } from './signnow.service';
import { SignnowController } from './signnow.controller';
import { ContractsModule } from '../contracts/contracts.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({ timeout: 10000 }),
    ContractsModule,
  ],
  providers: [SignnowService],
  controllers: [SignnowController],
  exports: [SignnowService],
})
export class SignnowModule {}
