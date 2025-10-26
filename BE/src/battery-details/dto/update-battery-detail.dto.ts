import { PartialType } from '@nestjs/swagger';
import { CreateBatteryDetailDto } from './create-battery-detail.dto';

export class UpdateBatteryDetailDto extends PartialType(
  CreateBatteryDetailDto,
) {}
