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
import { ApiTags } from '@nestjs/swagger';
import { ModelsService } from './models.service';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { FilterModelsDto } from './dto/filter-models.dto';

@ApiTags('models')
@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Post()
  create(@Body() createModelDto: CreateModelDto) {
    return this.modelsService.create(createModelDto);
  }

  @Get()
  findAll(@Query() filter: FilterModelsDto) {
    return this.modelsService.findAll(
      filter,
      filter.page || 1,
      filter.limit || 20,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modelsService.findOne(id);
  }

  @Get('brand/:brandId')
  findByBrand(@Param('brandId') brandId: string) {
    return this.modelsService.findByBrand(brandId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateModelDto: UpdateModelDto) {
    return this.modelsService.update(id, updateModelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.modelsService.remove(id);
  }
}