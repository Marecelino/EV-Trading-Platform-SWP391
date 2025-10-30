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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EvdetailsService } from './evdetails.service';
import { CreateEVDetailDto } from './dto/create-evdetail.dto';
import { UpdateEVDetailDto } from './dto/update-evdetail.dto';
import { FilterEVDetailsDto } from './dto/filter-evdetails.dto';

@ApiTags('evdetails')
  @ApiBearerAuth()
@Controller('evdetails')
export class EvdetailsController {
  constructor(private readonly evdetailsService: EvdetailsService) {}

  @Post()
  create(@Body() createEVDetailDto: CreateEVDetailDto) {
    return this.evdetailsService.create(createEVDetailDto);
  }

  @Get()
  findAll(@Query() filter: FilterEVDetailsDto) {
    return this.evdetailsService.findAll(
      filter,
      filter.page || 1,
      filter.limit || 20,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.evdetailsService.findOne(id);
  }

  @Get('listing/:listingId')
  findByListing(@Param('listingId') listingId: string) {
    return this.evdetailsService.findByListing(listingId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateEVDetailDto: UpdateEVDetailDto,
  ) {
    return this.evdetailsService.update(id, updateEVDetailDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.evdetailsService.remove(id);
  }
}
