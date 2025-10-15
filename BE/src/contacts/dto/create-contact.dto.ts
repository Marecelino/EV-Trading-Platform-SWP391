import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractStatus } from '../../model/contacts';

export class CreateContactDto {
  @ApiProperty({
    description: 'ID của transaction liên quan',
    example: '507f1f77bcf86cd799439011',
    pattern: '^[0-9a-fA-F]{24}$'
  })
  @IsMongoId()
  transaction_id: string;

  @ApiProperty({
    description: 'Số hợp đồng duy nhất',
    example: 'CONTRACT-2024-001',
    minLength: 1,
    maxLength: 50
  })
  @IsString()
  @IsNotEmpty()
  contract_no: string;

  @ApiPropertyOptional({
    description: 'Trạng thái hợp đồng',
    enum: ContractStatus,
    example: ContractStatus.DRAFT,
    default: ContractStatus.DRAFT
  })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @ApiProperty({
    description: 'URL tài liệu hợp đồng (PDF, DOC, etc.)',
    example: 'https://example.com/contracts/contract-001.pdf',
    format: 'url'
  })
  @IsUrl()
  document_url: string;

  @ApiPropertyOptional({
    description: 'Điều khoản và điều kiện của hợp đồng',
    example: 'Bên mua có trách nhiệm kiểm tra xe trước khi nhận...',
    maxLength: 2000
  })
  @IsOptional()
  @IsString()
  terms_and_conditions?: string;

  @ApiPropertyOptional({
    description: 'Ghi chú thêm về hợp đồng',
    example: 'Khách hàng yêu cầu giao xe vào cuối tuần',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  notes?: string;
}