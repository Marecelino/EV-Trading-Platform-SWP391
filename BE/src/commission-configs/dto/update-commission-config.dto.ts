import { PartialType } from '@nestjs/swagger';
import { CreateCommissionConfigDto } from './create-commission-config.dto';

export class UpdateCommissionConfigDto extends PartialType(CreateCommissionConfigDto) {}