import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionComplaintReason } from '../../model/transactioncomplaints';

export class CreateTransactionComplaintDto {
  @ApiProperty({
    enum: TransactionComplaintReason,
    example: TransactionComplaintReason.QUALITY_ISSUE,
    description: 'Reason for the complaint',
  })
  @IsEnum(TransactionComplaintReason)
  reason: TransactionComplaintReason;

  @ApiProperty({
    example:
      'The buyer did not deliver the item as agreed and stopped responding to messages.',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['https://example.com/attachment1.jpg'],
    description: 'Optional array of attachment URLs',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  // Optional explicit sender/recipient fields to help Swagger docs / clients.
  // The server will still derive the complainant/respondent from the authenticated
  // user and the transaction participants when creating a complaint.
  @ApiPropertyOptional({ example: '671234567890abcdef123456', description: 'Optional sender user id' })
  @IsOptional()
  @IsMongoId()
  sender_id?: string;

  @ApiPropertyOptional({ example: '671234567890abcdef654321', description: 'Optional recipient user id' })
  @IsOptional()
  @IsMongoId()
  recipient_id?: string;
}
