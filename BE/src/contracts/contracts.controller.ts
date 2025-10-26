import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { UpdateContractStatusDto } from './dto/update-contract-status.dto';
import { ContractWebhookDto } from './dto/contract-webhook.dto';
import { FilterContractsDto } from './dto/filter-contracts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@ApiTags('Contracts')
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List contracts with related transaction details' })
  findAll(@Query() filters: FilterContractsDto) {
    return this.contractsService.findAllDetailed(filters);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List contracts belonging to the authenticated user',
  })
  findMine(@Req() req: Request, @Query() filters: FilterContractsDto) {
    const authReq = req as Request & { user?: { userId?: string } };
    const userId = authReq.user?.userId;

    if (!userId) {
      throw new BadRequestException('Missing authenticated user context');
    }

    return this.contractsService.findForUser(userId, filters);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get contract by id' })
  findById(@Param('id') id: string) {
    return this.contractsService.findById(id);
  }

  @Get('by-number/:contractNo')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get contract by contract_no' })
  findByNumber(@Param('contractNo') contractNo: string) {
    return this.contractsService.findByContractNo(contractNo);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update contract status manually' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateContractStatusDto) {
    return this.contractsService.updateStatus(id, dto);
  }

  @Post('webhook')
  @ApiOperation({
    summary: 'Webhook endpoint used by external e-sign provider',
  })
  handleWebhook(@Body() dto: ContractWebhookDto) {
    return this.contractsService.handleWebhook(dto);
  }
}
