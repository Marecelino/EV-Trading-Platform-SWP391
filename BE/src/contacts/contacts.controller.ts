import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { FilterContactsDto } from './dto/filter-contacts.dto';

@ApiTags('contacts')
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Tạo hợp đồng mới',
    description: 'Tạo hợp đồng cho giao dịch xe điện'
  })
  @ApiResponse({ status: 201, description: 'Hợp đồng được tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactsService.create(createContactDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Lấy danh sách hợp đồng',
    description: 'Lấy danh sách hợp đồng với tùy chọn lọc và phân trang'
  })
  @ApiResponse({ status: 200, description: 'Danh sách hợp đồng' })
  findAll(@Query() filter: FilterContactsDto) {
    return this.contactsService.findAll(
      filter,
      filter.page || 1,
      filter.limit || 20,
    );
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Lấy thông tin hợp đồng',
    description: 'Lấy chi tiết hợp đồng theo ID'
  })
  @ApiParam({ name: 'id', description: 'ID của hợp đồng', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Thông tin hợp đồng' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hợp đồng' })
  findOne(@Param('id') id: string) {
    return this.contactsService.findOne(id);
  }

  @Get('transaction/:transactionId')
  @ApiOperation({ 
    summary: 'Lấy hợp đồng theo giao dịch',
    description: 'Lấy hợp đồng dựa trên ID giao dịch'
  })
  @ApiParam({ name: 'transactionId', description: 'ID của giao dịch', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Hợp đồng của giao dịch' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hợp đồng cho giao dịch này' })
  findByTransaction(@Param('transactionId') transactionId: string) {
    return this.contactsService.findByTransaction(transactionId);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Cập nhật hợp đồng',
    description: 'Cập nhật thông tin hợp đồng theo ID'
  })
  @ApiParam({ name: 'id', description: 'ID của hợp đồng', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Hợp đồng được cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hợp đồng' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto) {
    return this.contactsService.update(id, updateContactDto);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Xóa hợp đồng',
    description: 'Xóa hợp đồng theo ID'
  })
  @ApiParam({ name: 'id', description: 'ID của hợp đồng', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Hợp đồng được xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hợp đồng' })
  remove(@Param('id') id: string) {
    return this.contactsService.remove(id);
  }
}