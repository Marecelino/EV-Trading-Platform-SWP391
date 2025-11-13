import {
  Controller,
  Get,
  Patch,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformSettingsService } from './platform-settings.service';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../model/users.schema';
import type { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string };
}

@ApiTags('admin-platform-settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/platform-settings')
export class PlatformSettingsController {
  constructor(
    private readonly platformSettingsService: PlatformSettingsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lấy cấu hình phí hiện tại (Admin only)' })
  async getSettings() {
    return this.platformSettingsService.getCurrentSettings();
  }

  @Patch()
  @ApiOperation({ summary: 'Cập nhật cấu hình phí (Admin only)' })
  async updateSettings(
    @Body() dto: UpdatePlatformSettingsDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.platformSettingsService.updateSettings(
      dto,
      req.user.userId,
    );
  }
}

