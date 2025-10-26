import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SignnowService } from './signnow.service';
import { CreateSignnowContractDto } from './dto/create-signnow-contract.dto';
import { SignnowWebhookDto } from './dto/signnow-webhook.dto';

@ApiTags('SignNow')
@Controller('signnow')
export class SignnowController {
  constructor(private readonly signnowService: SignnowService) {}

  @Post('contracts')
  @ApiOperation({
    summary: 'Generate contract PDF and send SignNow invitation',
  })
  createContract(@Body() dto: CreateSignnowContractDto) {
    return this.signnowService.createContractAndInvite(dto);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'SignNow webhook to update contract status' })
  handleWebhook(
    @Body() payload: SignnowWebhookDto,
    @Headers('x-signnow-signature') signature?: string,
  ) {
    return this.signnowService.handleWebhook(payload, signature);
  }
}
