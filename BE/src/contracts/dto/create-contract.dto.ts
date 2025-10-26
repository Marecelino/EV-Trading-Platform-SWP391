import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { ContractStatus } from '../schemas/contract.schema';

export class CreateContractDto {
  @ApiProperty({ description: 'Transaction associated with the contract' })
  @IsMongoId()
  transaction_id!: string;

  @ApiProperty({ description: 'Payment reference used to create the contract' })
  @IsMongoId()
  payment_id!: string;

  @ApiProperty({
    description: 'Contract number shown to end users',
    example: 'CONTRACT-2025-00001',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  contract_no!: string;

  @ApiProperty({
    description: 'URL pointing to the generated contract document (PDF/HTML)',
  })
  @IsString()
  @IsUrl()
  document_url!: string;

  @ApiPropertyOptional({
    description: 'Initial status of the contract',
    enum: ContractStatus,
  })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @ApiPropertyOptional({
    description: 'Terms and conditions text embedded inside the contract',
  })
  @IsOptional()
  @IsString()
  terms_and_conditions?: string;

  @ApiPropertyOptional({ description: 'Additional notes for audit trail' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
