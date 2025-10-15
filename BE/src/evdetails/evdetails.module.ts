import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EVDetail, EVDetailSchema } from '../model/evdetails';
import { EvdetailsController } from './evdetails.controller';
import { EvdetailsService } from './evdetails.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EVDetail.name, schema: EVDetailSchema },
    ]),
  ],
  controllers: [EvdetailsController],
  providers: [EvdetailsService],
  exports: [EvdetailsService],
})
export class EvdetailsModule {}