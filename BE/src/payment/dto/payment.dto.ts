import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaymentMethod } from '../schemas/payment.schema';

export class CreatePaymentDto {
  @ApiProperty({
    example: '6523f5c30fde90429138cc5a',
    description: 'ID of the listing to pay for',
  })
  @IsNotEmpty()
  @IsString()
  listing_id: string;

  @ApiPropertyOptional({
    example: '6523f5c30fde90429138cc5b',
    description:
      'Deprecated: buyer id is resolved from the authenticated request context',
  })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiProperty({
    example: 1000000,
    description: 'Payment amount in VND',
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({
    example: 'VNPAY',
    description: 'Payment method',
    enum: PaymentMethod,
  })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @ApiProperty({
    example: 'NCB',
    description: 'Bank code for VNPAY',
    required: false,
  })
  @IsOptional()
  @IsString()
  bank_code?: string;
}

export class CreateAuctionPaymentDto {
  @ApiProperty({
    example: '6523f5c30fde90429138cc5a',
    description: 'ID of the auction to pay for',
  })
  @IsNotEmpty()
  @IsString()
  auction_id: string;

  @ApiPropertyOptional({
    example: '6523f5c30fde90429138cc5b',
    description:
      'Optional: buyer id to use for the payment (if omitted, taken from authenticated user context)',
  })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiProperty({
    example: 1000000,
    description: 'Payment amount in VND (server will validate)',
  })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({
    example: 'VNPAY',
    description: 'Payment method',
    enum: PaymentMethod,
  })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @ApiProperty({
    example: 'NCB',
    description: 'Bank code for VNPAY',
    required: false,
  })
  @IsOptional()
  @IsString()
  bank_code?: string;
}

export class VNPayIPNDto {
  @ApiProperty()
  @IsString()
  vnp_TmnCode: string;

  @ApiProperty()
  @IsString()
  vnp_Amount: string;

  @ApiProperty()
  @IsString()
  vnp_BankCode: string;

  @ApiProperty()
  @IsString()
  vnp_BankTranNo: string;

  @ApiProperty()
  @IsString()
  vnp_CardType: string;

  @ApiProperty()
  @IsString()
  vnp_PayDate: string;

  @ApiProperty()
  @IsString()
  vnp_OrderInfo: string;

  @ApiProperty()
  @IsString()
  vnp_TransactionNo: string;

  @ApiProperty()
  @IsString()
  vnp_ResponseCode: string;

  @ApiProperty()
  @IsString()
  vnp_TransactionStatus: string;

  @ApiProperty()
  @IsString()
  vnp_TxnRef: string;

  @ApiProperty()
  @IsString()
  vnp_SecureHash: string;
}
