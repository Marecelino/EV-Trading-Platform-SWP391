import { IsString, IsNotEmpty, IsNumber, Min } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class CreateBidDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the user placing the bid',
    example: '507f1f77bcf86cd799439013',
    type: 'string'
  })
  @IsString()
  @IsNotEmpty()
  user_id!: string;

  @ApiProperty({
    description: 'Bid amount in VND - must be at least current_price + min_increment',
    example: 925000000,
    type: 'number',
    minimum: 0
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;
}
