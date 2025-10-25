import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSignnowContractDto {
  @ApiProperty({ description: 'Existing contract identifier' })
  @IsMongoId()
  contract_id!: string;

  @ApiProperty({ description: 'Buyer full name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  buyer_name!: string;

  @ApiProperty({ description: 'Buyer email for signature invitation' })
  @IsEmail()
  buyer_email!: string;

  @ApiProperty({ description: 'Seller full name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  seller_name!: string;

  @ApiProperty({ description: 'Seller email for signature invitation' })
  @IsEmail()
  seller_email!: string;

  @ApiProperty({
    description: 'Contract total amount (VND)',
    example: 125000000,
  })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({
    description:
      'Optional contract subject line used for the signature invitation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  subject?: string;

  @ApiPropertyOptional({
    description: 'Optional message displayed in the signature invitation email',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
