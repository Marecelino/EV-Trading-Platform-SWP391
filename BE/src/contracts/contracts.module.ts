import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { Contract, ContractSchema } from './schemas/contract.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Contract.name, schema: ContractSchema },
    ]),
  ],
  providers: [ContractsService],
  controllers: [ContractsController],
  exports: [ContractsService],
})
export class ContractsModule {}
