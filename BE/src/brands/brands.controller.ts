import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { CreateBrandDto, UpdateBrandDto } from './dto';

@ApiTags('Brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo thương hiệu mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Tên thương hiệu đã tồn tại' })
  create(@Body() createBrandDto: CreateBrandDto) {
    return this.brandsService.create(createBrandDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả thương hiệu' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findAll() {
    return this.brandsService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Lấy danh sách thương hiệu đang hoạt động' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findActive() {
    return this.brandsService.findActive();
  }

  @Get('name/:name')
  @ApiOperation({ summary: 'Lấy thương hiệu theo tên' })
  @ApiParam({ name: 'name', description: 'Tên thương hiệu', example: 'Tesla' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findByName(@Param('name') name: string) {
    return this.brandsService.findByName(name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin thương hiệu theo ID' })
  @ApiParam({ name: 'id', description: 'ID của thương hiệu', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin thương hiệu' })
  @ApiParam({ name: 'id', description: 'ID của thương hiệu', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Tên thương hiệu đã tồn tại' })
  update(@Param('id') id: string, @Body() updateBrandDto: UpdateBrandDto) {
    return this.brandsService.update(id, updateBrandDto);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Bật/tắt trạng thái hoạt động của thương hiệu' })
  @ApiParam({ name: 'id', description: 'ID của thương hiệu', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  toggleActive(@Param('id') id: string) {
    return this.brandsService.toggleActive(id);
  }

  @Patch(':id/increment-listing')
  @ApiOperation({ summary: 'Tăng số lượng listing của thương hiệu' })
  @ApiParam({ name: 'id', description: 'ID của thương hiệu', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  incrementListingCount(@Param('id') id: string) {
    return this.brandsService.incrementListingCount(id);
  }

  @Patch(':id/decrement-listing')
  @ApiOperation({ summary: 'Giảm số lượng listing của thương hiệu' })
  @ApiParam({ name: 'id', description: 'ID của thương hiệu', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  decrementListingCount(@Param('id') id: string) {
    return this.brandsService.decrementListingCount(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa thương hiệu' })
  @ApiParam({ name: 'id', description: 'ID của thương hiệu', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}