import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UserStatus } from '../model/users.schema';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardMetrics();
  }

  @Get('pending-listings')
  getPending(@Query('limit') limit?: number) {
    return this.adminService.getPendingListings(Number(limit) || 20);
  }

  @Patch('listings/:id/verify')
  verifyListing(
    @Param('id') id: string,
    @Body('approve') approve: boolean,
    @Body('message') message?: string,
  ) {
    return this.adminService.verifyListing(id, approve, message);
  }

  @Patch('users/:id/status')
  changeUserStatus(
    @Param('id') id: string,
    @Body('status') status: UserStatus,
  ) {
    return this.adminService.changeUserStatus(id, status);
  }

  @Patch('reviews/:id/visibility')
  moderateReview(
    @Param('id') id: string,
    @Body('is_visible') isVisible: boolean,
  ) {
    return this.adminService.moderateReview(id, isVisible);
  }
}
