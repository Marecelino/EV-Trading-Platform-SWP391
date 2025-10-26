import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseFloatPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { CommissionConfigsService } from './commission-configs.service';
import { CreateCommissionConfigDto, UpdateCommissionConfigDto } from './dto';

@ApiTags('Commission Configs')
@Controller('commission-configs')
export class CommissionConfigsController {
  constructor(
    private readonly commissionConfigsService: CommissionConfigsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Tạo cấu hình hoa hồng mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  create(@Body() createCommissionConfigDto: CreateCommissionConfigDto) {
    return this.commissionConfigsService.create(createCommissionConfigDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả cấu hình hoa hồng' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findAll() {
    return this.commissionConfigsService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Lấy danh sách cấu hình hoa hồng đang hoạt động' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findActive() {
    return this.commissionConfigsService.findActive();
  }

  @Get('current')
  @ApiOperation({ summary: 'Lấy cấu hình hoa hồng hiện tại đang áp dụng' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({
    status: 404,
    description: 'Không có cấu hình nào đang hoạt động',
  })
  findCurrent() {
    return this.commissionConfigsService.findCurrent();
  }

  @Get('expired')
  @ApiOperation({ summary: 'Lấy danh sách cấu hình hoa hồng đã hết hạn' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findExpired() {
    return this.commissionConfigsService.findExpired();
  }

  @Get('by-date-range')
  @ApiOperation({
    summary: 'Lấy danh sách cấu hình hoa hồng theo khoảng thời gian',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Ngày bắt đầu',
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Ngày kết thúc',
    example: '2024-12-31',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.commissionConfigsService.findByDateRange(startDate, endDate);
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Tính toán hoa hồng cho một giao dịch' })
  @ApiBody({
    description: 'Số tiền giao dịch',
    schema: {
      type: 'object',
      properties: {
        transactionAmount: {
          type: 'number',
          example: 10000000,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Tính toán thành công' })
  @ApiResponse({
    status: 404,
    description: 'Không có cấu hình nào đang hoạt động',
  })
  calculateCommission(
    @Body('transactionAmount', ParseFloatPipe) transactionAmount: number,
  ) {
    return this.commissionConfigsService.calculateCommission(transactionAmount);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin cấu hình hoa hồng theo ID' })
  @ApiParam({
    name: 'id',
    description: 'ID của cấu hình hoa hồng',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string) {
    return this.commissionConfigsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật cấu hình hoa hồng' })
  @ApiParam({
    name: 'id',
    description: 'ID của cấu hình hoa hồng',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  update(
    @Param('id') id: string,
    @Body() updateCommissionConfigDto: UpdateCommissionConfigDto,
  ) {
    return this.commissionConfigsService.update(id, updateCommissionConfigDto);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({
    summary: 'Bật/tắt trạng thái hoạt động của cấu hình hoa hồng',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của cấu hình hoa hồng',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  toggleActive(@Param('id') id: string) {
    return this.commissionConfigsService.toggleActive(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa cấu hình hoa hồng' })
  @ApiParam({
    name: 'id',
    description: 'ID của cấu hình hoa hồng',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  remove(@Param('id') id: string) {
    return this.commissionConfigsService.remove(id);
  }
}
