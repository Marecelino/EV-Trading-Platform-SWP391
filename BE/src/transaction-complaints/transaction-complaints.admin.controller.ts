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
import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { TransactionComplaintsService } from './transaction-complaints.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../model/users.schema';
import { FilterTransactionComplaintsDto } from './dto/filter-transaction-complaints.dto';
import { HandleTransactionComplaintDto } from './dto/handle-transaction-complaint.dto';
import {
  TransactionComplaintStatus,
  TransactionComplaintResolution,
} from '../model/transactioncomplaints';
import type { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; role?: UserRole };
}

@ApiTags('admin-transaction-complaints')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/transaction-complaints')
export class TransactionComplaintsAdminController {
  constructor(
    private readonly transactionComplaintsService: TransactionComplaintsService,
  ) { }

  @Get()
  findAll(@Query() filters: FilterTransactionComplaintsDto) {
    return this.transactionComplaintsService.findAllForAdmin(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionComplaintsService.findOneForAdmin(id);
  }


  @Patch(':id/handle')
  @ApiOperation({ summary: 'Mark complaint as handled (RESOLVED) and provide admin feedback' })
  @ApiBody({
    type: HandleTransactionComplaintDto,
    examples: {
      resolved_with_refund: {
        summary: 'Resolved - full refund',
        value: {
          resolution: TransactionComplaintResolution.REFUND,
          admin_notes: 'We reviewed the evidence and issued a full refund to the buyer.',
        },
      },
      resolved_no_action: {
        summary: 'Resolved - no action',
        value: {
          resolution: TransactionComplaintResolution.NO_ACTION,
          admin_notes: 'After review, no action is necessary at this time.',
        },
      },
    },
  })
  handle(
    @Param('id') id: string,
    @Body() dto: HandleTransactionComplaintDto,
    @Request() req: AuthenticatedRequest,
  ) {
    // Convenience endpoint: mark complaint as RESOLVED and store admin feedback
    const updatePayload = {
      status: TransactionComplaintStatus.RESOLVED,
      resolution: dto.resolution,
      admin_notes: dto.admin_notes,
    } as any;

    return this.transactionComplaintsService.updateByAdmin(
      id,
      updatePayload,
      req.user.userId,
    );
  }
}
