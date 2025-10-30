import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { FilterReviewsDto } from './dto/filter-reviews.dto';
import { ToggleVisibilityDto } from './dto/toggle-visibility.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../model/users.schema';
import type { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; role?: UserRole };
}

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Request() req: AuthenticatedRequest,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(req.user.userId, createReviewDto);
  }

  @Get()
  findAll(@Query() filters: FilterReviewsDto) {
    return this.reviewsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/visibility')
  toggleVisibility(
    @Param('id') id: string,
    @Body() { is_visible }: ToggleVisibilityDto,
  ) {
    return this.reviewsService.toggleVisibility(id, is_visible);
  }
}
