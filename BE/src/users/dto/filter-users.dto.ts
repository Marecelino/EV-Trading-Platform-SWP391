import { IsEnum, IsOptional, IsString } from 'class-validator';
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
}
