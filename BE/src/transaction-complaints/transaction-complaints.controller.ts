import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TransactionComplaintsService } from './transaction-complaints.service';
import { CreateTransactionComplaintDto } from './dto/create-transaction-complaint.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string };
}

@ApiTags('transaction-complaints')
@ApiBearerAuth()
@Controller('transactions/:transactionId/complaints')
export class TransactionComplaintsController {
  constructor(
    private readonly transactionComplaintsService: TransactionComplaintsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Param('transactionId') transactionId: string,
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateTransactionComplaintDto,
  ) {
    return this.transactionComplaintsService.create(
      req.user.userId,
      transactionId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findMine(
    @Param('transactionId') transactionId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.transactionComplaintsService.findForParticipant(
      req.user.userId,
      transactionId,
    );
  }

  
}
