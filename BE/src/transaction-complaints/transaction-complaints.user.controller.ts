import {
    Controller,
    Get,
    Param,
    Query,
    Request,
    UseGuards,
    ForbiddenException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransactionComplaintsService } from './transaction-complaints.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';
import { UserRole } from '../model/users.schema';

interface AuthenticatedRequest extends ExpressRequest {
    user: { userId: string; role?: UserRole };
}

@ApiTags('transaction-complaints-user')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transaction-complaints')
export class TransactionComplaintsUserController {
    constructor(
        private readonly transactionComplaintsService: TransactionComplaintsService,
    ) { }

    @Get('sender/:id')
    @ApiOperation({ summary: 'Get complaints filed by a specific sender (admin or owner)' })
    async findBySender(
        @Param('id') id: string,
        @Query('limit') limit = '20',
        @Query('page') page = '1',
        @Request() req: AuthenticatedRequest,
    ) {
        // allow admin to query any sender; regular users only their own
        if (req.user.userId !== id && req.user.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Not allowed to view other users complaints');
        }

        const l = parseInt(limit as any, 10) || 20;
        const p = parseInt(page as any, 10) || 1;
        return this.transactionComplaintsService.findBySender(id, l, p);
    }
}
