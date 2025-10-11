import {
  IsEmail,
  MinLength,
  IsString,
  IsPhoneNumber,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsOptional()
  @IsPhoneNumber('VN', {
    message: 'Phone number must be a valid Vietnamese number',
  })
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
