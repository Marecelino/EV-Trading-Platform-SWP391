import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BatteryDetailsService } from './battery-details.service';
import { BatteryDetailsController } from './battery-details.controller';
import { BatteryDetail, BatteryDetailSchema } from '../model/batterydetails';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BatteryDetail.name, schema: BatteryDetailSchema },
    ]),
  ],
  controllers: [BatteryDetailsController],
  providers: [BatteryDetailsService],
  exports: [BatteryDetailsService],
})
export class BatteryDetailsModule {}