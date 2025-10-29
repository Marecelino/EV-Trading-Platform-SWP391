import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { FilterReviewsDto } from './dto/filter-reviews.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ToggleVisibilityDto } from './dto/toggle-visibility.dto';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }

  @Get()
  findAll(@Query() filters: FilterReviewsDto) {
    return this.reviewsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewsService.update(id, updateReviewDto);
  }

  @Patch(':id/visibility')
  toggleVisibility(
    @Param('id') id: string,
    @Body() { is_visible }: ToggleVisibilityDto,
  ) {
    return this.reviewsService.toggleVisibility(id, is_visible);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
