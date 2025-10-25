import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommissionsService } from './commissions.service';

@Module({
  imports: [ConfigModule],
  providers: [CommissionsService],
  exports: [CommissionsService],
})
export class CommissionsModule {}
