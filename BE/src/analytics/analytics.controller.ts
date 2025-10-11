import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  AnalyticsService,
  BrandPopularity,
  FavoriteTrend,
  RevenueByMonth,
} from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  overview() {
    return this.analyticsService.getOverview();
  }

  @Get('revenue')
  revenue(
    @Query('year', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe)
    year: number,
  ): Promise<RevenueByMonth[]> {
    return this.analyticsService.getRevenueByMonth(year);
  }

  @Get('popular-brands')
  popularBrands(
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe)
    limit: number,
  ): Promise<BrandPopularity[]> {
    return this.analyticsService.getPopularBrands(limit);
  }

  @Get('favorite-trend')
  favoriteTrend(
    @Query('limit', new DefaultValuePipe(7), ParseIntPipe)
    limit: number,
  ): Promise<FavoriteTrend[]> {
    return this.analyticsService.getFavoriteTrend(limit);
  }
}
