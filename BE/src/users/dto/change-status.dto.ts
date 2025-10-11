import { IsEnum } from 'class-validator';
import { UserStatus } from '../../model/users.schema';

export class ChangeStatusDto {
  @IsEnum(UserStatus)
  status: UserStatus;
}
