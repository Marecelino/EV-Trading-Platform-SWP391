import {
  IsEmail,
  IsString,
  IsPhoneNumber,
  IsOptional,
  MinLength,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from './user-role.enum';

export class RegisterDto {
  @ApiProperty({
    description: 'Tên người dùng',
    example: 'Nguyễn Văn A',
    minLength: 2
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  name: string;

  @ApiProperty({
    description: 'Email đăng ký',
    example: 'nguyenvana@example.com'
  })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'Mật khẩu',
    example: 'Password123!',
    minLength: 6
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    description: 'Số điện thoại (Vietnam)',
    example: '+84901234567',
    required: false
  })
  @IsOptional()
  @IsPhoneNumber('VN', {
    message: 'Phone number must be a valid Vietnamese phone number',
  })
  phone?: string;

  @ApiProperty({
    description: 'Địa chỉ',
    example: '123 Đường Láng, Hà Nội',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  address?: string;

  @ApiProperty({
    description: 'Vai trò người dùng',
    enum: UserRole,
    example: UserRole.USER,
    default: UserRole.USER,
    required: false
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be a valid user role' })
  role?: UserRole;
}
