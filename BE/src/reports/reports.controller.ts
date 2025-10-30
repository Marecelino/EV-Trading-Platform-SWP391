import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportsSummaryQueryDto } from './dto/reports-summary-query.dto';
import { ReportsTrendQueryDto } from './dto/reports-trend-query.dto';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Aggregate transaction summary for dashboards' })
  getSummary(@Query() query: ReportsSummaryQueryDto) {
    return this.reportsService.getSummary(query);
  }

  @Get('trend')
  @ApiOperation({ summary: 'Time-series trend of transactions and revenue' })
  getTrend(@Query() query: ReportsTrendQueryDto) {
    return this.reportsService.getTrend(query);
  }
}
