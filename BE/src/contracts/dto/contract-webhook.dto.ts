import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { ContractStatus } from '../schemas/contract.schema';

export class ContractWebhookDto {
  @ApiProperty({
    description: 'Contract number provided by the e-sign provider',
  })
  @IsString()
  contract_no!: string;

  @ApiProperty({
    enum: ContractStatus,
    description: 'Status conveyed by the e-sign provider',
  })
  @IsEnum(ContractStatus)
  status!: ContractStatus;

  @ApiProperty({
    description: 'Signature event payload returned by provider',
    required: false,
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @ApiProperty({
    description: 'System or user performing the action',
    required: false,
  })
  @IsOptional()
  @IsString()
  performed_by?: string;
}
