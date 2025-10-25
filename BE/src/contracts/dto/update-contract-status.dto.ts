import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ContractStatus } from '../schemas/contract.schema';

export class UpdateContractStatusDto {
  @ApiPropertyOptional({
    enum: ContractStatus,
    description: 'Updated contract status',
  })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @ApiPropertyOptional({
    description: 'Optional descriptive note recorded in audit log',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
