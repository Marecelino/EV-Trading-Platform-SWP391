import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommissionConfigsService } from './commission-configs.service';
import { CommissionConfigsController } from './commission-configs.controller';
import { CommissionConfig, CommissionConfigSchema } from '../model/commissionconfigs';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CommissionConfig.name, schema: CommissionConfigSchema },
    ]),
  ],
  controllers: [CommissionConfigsController],
  providers: [CommissionConfigsService],
  exports: [CommissionConfigsService],
})
export class CommissionConfigsModule {}