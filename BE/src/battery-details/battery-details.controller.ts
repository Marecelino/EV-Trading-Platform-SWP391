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
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BatteryDetailsService } from './battery-details.service';
import { CreateBatteryDetailDto, UpdateBatteryDetailDto } from './dto';

@ApiTags('Battery Details')
@ApiBearerAuth()
@Controller('battery-details')
export class BatteryDetailsController {
  constructor(private readonly batteryDetailsService: BatteryDetailsService) { }

  @Post()
  @ApiOperation({ summary: 'Tạo thông tin chi tiết pin mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  create(@Body() createBatteryDetailDto: CreateBatteryDetailDto) {
    return this.batteryDetailsService.create(createBatteryDetailDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả thông tin chi tiết pin' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findAll() {
    return this.batteryDetailsService.findAll();
  }

  @Get('by-chemistry/:chemistry')
  @ApiOperation({ summary: 'Lấy danh sách pin theo loại hóa học' })
  @ApiParam({
    name: 'chemistry',
    description: 'Loại hóa học pin',
    example: 'lithium_ion',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findByChemistry(@Param('chemistry') chemistry: string) {
    return this.batteryDetailsService.findByChemistry(chemistry);
  }

  @Get('by-capacity')
  @ApiOperation({ summary: 'Lấy danh sách pin theo khoảng dung lượng' })
  @ApiQuery({
    name: 'min',
    description: 'Dung lượng tối thiểu (kWh)',
    example: 50,
  })
  @ApiQuery({
    name: 'max',
    description: 'Dung lượng tối đa (kWh)',
    example: 100,
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findByCapacityRange(
    @Query('min', ParseFloatPipe) min: number,
    @Query('max', ParseFloatPipe) max: number,
  ) {
    return this.batteryDetailsService.findByCapacityRange(min, max);
  }

  @Get('by-health')
  @ApiOperation({
    summary: 'Lấy danh sách pin theo khoảng tình trạng sức khỏe',
  })
  @ApiQuery({
    name: 'min',
    description: 'Tình trạng sức khỏe tối thiểu (%)',
    example: 80,
  })
  @ApiQuery({
    name: 'max',
    description: 'Tình trạng sức khỏe tối đa (%)',
    example: 100,
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findByHealthRange(
    @Query('min', ParseFloatPipe) min: number,
    @Query('max', ParseFloatPipe) max: number,
  ) {
    return this.batteryDetailsService.findByHealthRange(min, max);
  }

  @Get('by-listing/:listingId')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết pin theo ID listing' })
  @ApiParam({
    name: 'listingId',
    description: 'ID của listing',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findByListingId(@Param('listingId') listingId: string) {
    return this.batteryDetailsService.findByListingId(listingId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết pin theo ID' })
  @ApiParam({
    name: 'id',
    description: 'ID của battery detail',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Lấy thông tin thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string) {
    return this.batteryDetailsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin chi tiết pin' })
  @ApiParam({
    name: 'id',
    description: 'ID của battery detail',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  update(
    @Param('id') id: string,
    @Body() updateBatteryDetailDto: UpdateBatteryDetailDto,
  ) {
    return this.batteryDetailsService.update(id, updateBatteryDetailDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa thông tin chi tiết pin' })
  @ApiParam({
    name: 'id',
    description: 'ID của battery detail',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  remove(@Param('id') id: string) {
    return this.batteryDetailsService.remove(id);
  }
}
