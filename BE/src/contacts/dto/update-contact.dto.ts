import { IsEnum, IsOptional } from 'class-validator';
import { ContractStatus } from '../../model/contacts';

export class UpdateContactDto {
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;
}
