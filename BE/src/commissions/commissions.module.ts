import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommissionsService } from './commissions.service';
import { CommissionsController } from './commissions.controller';
import { Commission, CommissionSchema } from '../model/commissions';
import { TransactionsModule } from '../transactions/transactions.module';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Commission.name, schema: CommissionSchema },
    ]),
    TransactionsModule,
    PlatformSettingsModule,
  ],
  controllers: [CommissionsController],
  providers: [CommissionsService],
  exports: [CommissionsService],
})
export class CommissionsModule {}
