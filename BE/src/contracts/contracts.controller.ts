import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { UpdateContractStatusDto } from './dto/update-contract-status.dto';
import { ContractWebhookDto } from './dto/contract-webhook.dto';

@ApiTags('Contracts')
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

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
