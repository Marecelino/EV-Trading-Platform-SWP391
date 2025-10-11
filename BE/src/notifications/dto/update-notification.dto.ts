import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateNotificationDto {
  @IsOptional()
  @IsBoolean()
  is_read?: boolean;

  @IsOptional()
  @IsString()
  action_url?: string;
}
