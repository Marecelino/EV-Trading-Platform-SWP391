import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsMongoId, IsOptional, Min } from 'class-validator';
import { NotificationType } from '../../model/notifications';

export class FilterNotificationsDto {
  @IsOptional()
  @IsMongoId()
  user_id?: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsBoolean()
  is_read?: boolean;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
