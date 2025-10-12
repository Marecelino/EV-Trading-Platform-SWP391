import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string; // token từ email link

  @IsString()
  @MinLength(6)
  newPassword: string;
}
