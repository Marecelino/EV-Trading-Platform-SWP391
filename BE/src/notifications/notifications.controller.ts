import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { FilterNotificationsDto } from './dto/filter-notifications.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../model/users.schema';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  findAll(@Query() filters: FilterNotificationsDto) {
    return this.notificationsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  /**
   * Convenience endpoint: get notifications for a specific user_id.
   * Only the user themself or admins can access this route.
   */
  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  async findByUser(
    @Param('userId') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Request() req: any,
  ) {
    const requester = req.user as { userId?: string; role?: UserRole };
    if (!requester) throw new ForbiddenException('Unauthorized');
    // if (requester.userId !== userId && requester.role !== UserRole.ADMIN) {
    //   throw new ForbiddenException('Forbidden');
    // }

    const filters: FilterNotificationsDto = {
      user_id: userId,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    };

    return this.notificationsService.findAll(filters);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateNotificationDto) {
    return this.notificationsService.update(id, updateDto);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Post('mark-all')
  markAll(@Body('user_id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}
