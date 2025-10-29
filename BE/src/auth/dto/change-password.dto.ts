import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Mật khẩu hiện tại',
    example: 'oldPassword123!',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'Mật khẩu mới',
    example: 'newPassword123!',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
