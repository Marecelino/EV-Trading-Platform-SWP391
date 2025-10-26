import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { NotificationType } from '../../model/notifications';

export class CreateNotificationDto {
  @IsMongoId()
  user_id: string;

  @IsString()
  @MaxLength(500)
  message: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsString()
  related_id?: string;

  @IsOptional()
  @IsString()
  action_url?: string;
}
