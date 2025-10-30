import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TransactionComplaintsService } from './transaction-complaints.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../model/users.schema';
import { FilterTransactionComplaintsDto } from './dto/filter-transaction-complaints.dto';
import { UpdateTransactionComplaintDto } from './dto/update-transaction-complaint.dto';
import type { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; role?: UserRole };
}

@ApiTags('admin-transaction-complaints')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/transaction-complaints')
export class TransactionComplaintsAdminController {
  constructor(
    private readonly transactionComplaintsService: TransactionComplaintsService,
  ) {}

  @Get()
  findAll(@Query() filters: FilterTransactionComplaintsDto) {
    return this.transactionComplaintsService.findAllForAdmin(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionComplaintsService.findOneForAdmin(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionComplaintDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.transactionComplaintsService.updateByAdmin(
      id,
      dto,
      req.user.userId,
    );
  }
}
