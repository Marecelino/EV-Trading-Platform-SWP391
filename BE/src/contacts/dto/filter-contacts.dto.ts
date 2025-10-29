import { Type } from 'class-transformer';
import { IsEnum, IsOptional, Min } from 'class-validator';
import { ContractStatus } from '../../model/contacts';

export class FilterContactsDto {
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;
}
