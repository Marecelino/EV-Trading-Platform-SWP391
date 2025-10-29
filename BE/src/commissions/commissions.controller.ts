import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CommissionsService } from './commissions.service';
import { CreateCommissionDto, UpdateCommissionDto } from './dto';
import { CommissionStatus } from '../model/commissions';

@ApiTags('Commissions')
@Controller('commissions')
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo hoa hồng mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({
    status: 409,
    description: 'Hoa hồng cho giao dịch này đã tồn tại',
  })
  create(@Body() createCommissionDto: CreateCommissionDto) {
    return this.commissionsService.create(createCommissionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả hoa hồng' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findAll() {
    return this.commissionsService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê hoa hồng theo trạng thái' })
  @ApiResponse({ status: 200, description: 'Lấy thống kê thành công' })
  getCommissionStats() {
    return this.commissionsService.getCommissionStats();
  }

  @Get('pending')
  @ApiOperation({ summary: 'Lấy danh sách hoa hồng đang chờ thanh toán' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findPending() {
    return this.commissionsService.findPending();
  }

  @Get('paid')
  @ApiOperation({ summary: 'Lấy danh sách hoa hồng đã thanh toán' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findPaid() {
    return this.commissionsService.findPaid();
  }

  @Get('cancelled')
  @ApiOperation({ summary: 'Lấy danh sách hoa hồng đã hủy' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findCancelled() {
    return this.commissionsService.findCancelled();
  }

  @Get('by-status')
  @ApiOperation({ summary: 'Lấy danh sách hoa hồng theo trạng thái' })
  @ApiQuery({
    name: 'status',
    description: 'Trạng thái hoa hồng',
    enum: CommissionStatus,
    example: CommissionStatus.PENDING,
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findByStatus(@Query('status') status: CommissionStatus) {
    return this.commissionsService.findByStatus(status);
  }

  @Get('total/pending')
  @ApiOperation({ summary: 'Lấy tổng tiền hoa hồng đang chờ thanh toán' })
  @ApiResponse({ status: 200, description: 'Lấy tổng tiền thành công' })
  getTotalPendingCommission() {
    return this.commissionsService.getTotalPendingCommission();
  }

  @Get('total/paid')
  @ApiOperation({ summary: 'Lấy tổng tiền hoa hồng đã thanh toán' })
  @ApiResponse({ status: 200, description: 'Lấy tổng tiền thành công' })
  getTotalPaidCommission() {
    return this.commissionsService.getTotalPaidCommission();
  }

  @Get('by-transaction/:transactionId')
  @ApiOperation({ summary: 'Lấy hoa hồng theo ID giao dịch' })
  @ApiParam({
    name: 'transactionId',
    description: 'ID của giao dịch',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findByTransactionId(@Param('transactionId') transactionId: string) {
    return this.commissionsService.findByTransactionId(transactionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin hoa hồng theo ID' })
  @ApiParam({
    name: 'id',
    description: 'ID của hoa hồng',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string) {
    return this.commissionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin hoa hồng' })
  @ApiParam({
    name: 'id',
    description: 'ID của hoa hồng',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({
    status: 409,
    description: 'Hoa hồng cho giao dịch này đã tồn tại',
  })
  update(
    @Param('id') id: string,
    @Body() updateCommissionDto: UpdateCommissionDto,
  ) {
    return this.commissionsService.update(id, updateCommissionDto);
  }

  @Patch(':id/mark-paid')
  @ApiOperation({ summary: 'Đánh dấu hoa hồng đã thanh toán' })
  @ApiParam({
    name: 'id',
    description: 'ID của hoa hồng',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  markAsPaid(@Param('id') id: string) {
    return this.commissionsService.markAsPaid(id);
  }

  @Post(':id/pay')
  @ApiOperation({
    summary:
      'Thanh toán hoa hồng và cập nhật giao dịch (không cập nhật hợp đồng)',
  })
  @ApiResponse({ status: 200, description: 'Thanh toán hoa hồng thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hoa hồng' })
  payCommission(
    @Param('id') id: string,
    @Body('payment_reference') payment_reference?: string,
  ) {
    return this.commissionsService.payCommission(id, payment_reference);
  }

  @Patch(':id/mark-cancelled')
  @ApiOperation({ summary: 'Đánh dấu hoa hồng đã hủy' })
  @ApiParam({
    name: 'id',
    description: 'ID của hoa hồng',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  markAsCancelled(@Param('id') id: string) {
    return this.commissionsService.markAsCancelled(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa hoa hồng' })
  @ApiParam({
    name: 'id',
    description: 'ID của hoa hồng',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  remove(@Param('id') id: string) {
    return this.commissionsService.remove(id);
  }
}
