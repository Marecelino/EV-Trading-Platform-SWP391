import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TransactionComplaintResolution } from '../../model/transactioncomplaints';

export class HandleTransactionComplaintDto {
    @ApiProperty({
        enum: TransactionComplaintResolution,
        example: TransactionComplaintResolution.REFUND,
        description: 'Resolution chosen by the admin',
        required: false,
    })
    @IsOptional()
    @IsEnum(TransactionComplaintResolution)
    resolution?: TransactionComplaintResolution;

    @ApiProperty({
        example: 'Đã kiểm tra bằng chứng, hoàn tiền toàn bộ cho người mua.',
        description: 'Admin response or notes visible to both parties',
        required: false,
        maxLength: 1000,
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    admin_notes?: string;
}
