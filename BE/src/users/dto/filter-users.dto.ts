import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../../model/users.schema';

export class FilterUsersDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsString()
  search?: string;

  // ✅ Thêm phần phân trang
  @IsOptional()
  @ApiPropertyOptional({ type: Number, description: 'Page number (>=1)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @ApiPropertyOptional({ type: Number, description: 'Items per page (>=1)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

