import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class SignnowWebhookDto {
  @ApiProperty({ description: 'Webhook event type sent by SignNow' })
  @IsString()
  event!: string;

  @ApiProperty({
    description: 'Document identifier from SignNow',
    required: false,
  })
  @IsOptional()
  @IsString()
  document_id?: string;

  @ApiProperty({ description: 'Full payload sent by SignNow' })
  @IsObject()
  data!: Record<string, any>;
}
