import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';

export class CompleteRegistrationDto {
  @ApiProperty({ description: 'ID người dùng đang hoàn tất đăng ký' })
  @IsMongoId({ message: 'User ID không hợp lệ' })
  userId: string;

  @ApiProperty({ description: 'Họ và tên đầy đủ', example: 'Nguyễn Văn A' })
  @IsString({ message: 'Họ tên phải là chuỗi' })
  @IsNotEmpty({ message: 'Họ tên là bắt buộc' })
  @MinLength(2, { message: 'Họ tên cần tối thiểu 2 ký tự' })
  fullName: string;

  @ApiProperty({
    description: 'Số điện thoại liên hệ (Việt Nam)',
    example: '+84901234567',
  })
  @IsPhoneNumber('VN', {
    message: 'Số điện thoại không hợp lệ. Vui lòng nhập định dạng Việt Nam',
  })
  phone: string;

  @ApiProperty({
    description: 'Địa chỉ cư trú',
    example: '123 Đường Láng, Hà Nội',
  })
  @IsString({ message: 'Địa chỉ phải là chuỗi' })
  @IsNotEmpty({ message: 'Địa chỉ là bắt buộc' })
  address: string;

  @ApiProperty({
    description: 'Ngày sinh (định dạng ISO 8601)',
    example: '1995-05-21',
  })
  @IsDateString({}, { message: 'Ngày sinh phải ở định dạng ISO (YYYY-MM-DD)' })
  dateOfBirth: string;
}
