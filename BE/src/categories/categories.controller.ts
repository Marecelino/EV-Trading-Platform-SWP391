import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo danh mục mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Tên danh mục đã tồn tại' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả danh mục' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('active')
  @ApiOperation({ summary: 'Lấy danh sách danh mục đang hoạt động' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findActive() {
    return this.categoriesService.findActive();
  }

  @Get('parent')
  @ApiOperation({ summary: 'Lấy danh sách danh mục cha (không có parent)' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findParentCategories() {
    return this.categoriesService.findParentCategories();
  }

  @Get('subcategories/:parentId')
  @ApiOperation({ summary: 'Lấy danh sách danh mục con theo ID danh mục cha' })
  @ApiParam({ name: 'parentId', description: 'ID của danh mục cha', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findSubCategories(@Param('parentId') parentId: string) {
    return this.categoriesService.findSubCategories(parentId);
  }

  @Get('name/:name')
  @ApiOperation({ summary: 'Lấy danh mục theo tên' })
  @ApiParam({ name: 'name', description: 'Tên danh mục', example: 'Pin xe điện' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findByName(@Param('name') name: string) {
    return this.categoriesService.findByName(name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin danh mục theo ID' })
  @ApiParam({ name: 'id', description: 'ID của danh mục', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin danh mục' })
  @ApiParam({ name: 'id', description: 'ID của danh mục', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Tên danh mục đã tồn tại' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Bật/tắt trạng thái hoạt động của danh mục' })
  @ApiParam({ name: 'id', description: 'ID của danh mục', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  toggleActive(@Param('id') id: string) {
    return this.categoriesService.toggleActive(id);
  }

  @Patch(':id/increment-listing')
  @ApiOperation({ summary: 'Tăng số lượng listing của danh mục' })
  @ApiParam({ name: 'id', description: 'ID của danh mục', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  incrementListingCount(@Param('id') id: string) {
    return this.categoriesService.incrementListingCount(id);
  }

  @Patch(':id/decrement-listing')
  @ApiOperation({ summary: 'Giảm số lượng listing của danh mục' })
  @ApiParam({ name: 'id', description: 'ID của danh mục', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  decrementListingCount(@Param('id') id: string) {
    return this.categoriesService.decrementListingCount(id);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Sắp xếp lại thứ tự danh mục' })
  @ApiBody({
    description: 'Danh sách ID danh mục theo thứ tự mới',
    schema: {
      type: 'object',
      properties: {
        categoryIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Sắp xếp thành công' })
  @ApiResponse({ status: 404, description: 'Một hoặc nhiều danh mục không tìm thấy' })
  reorderCategories(@Body('categoryIds') categoryIds: string[]) {
    return this.categoriesService.reorderCategories(categoryIds);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa danh mục' })
  @ApiParam({ name: 'id', description: 'ID của danh mục', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  @ApiResponse({ status: 409, description: 'Không thể xóa danh mục có danh mục con' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}