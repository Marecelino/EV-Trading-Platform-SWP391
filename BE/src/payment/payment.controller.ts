import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import type { Request } from 'express';
import { PaymentService } from './payment.service';
import {
  CreatePaymentDto,
  VNPayIPNDto,
  CreateAuctionPaymentDto,
} from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Payment')
@ApiBearerAuth()
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post('create-payment-url')
  @ApiOperation({ summary: 'Create VNPay payment URL' })
  async createPaymentUrl(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: Request,
  ) {
    const authReq = req as Request & { user?: { userId?: string } };
    const buyerId = authReq.user?.userId;

    if (!buyerId) {
      throw new BadRequestException('Missing authenticated user context');
    }

    return this.paymentService.createVNPayUrl(
      createPaymentDto,
      buyerId,
      req.ip || '127.0.0.1',
    );
  }

  @Post('auction/create-payment-url')
  @ApiOperation({ summary: 'Create VNPay payment URL for auction' })
  async createAuctionPaymentUrl(
    @Body() createAuctionPaymentDto: CreateAuctionPaymentDto,
    @Req() req: Request,
  ) {
    const authReq = req as Request & { user?: { userId?: string } };
    // Prefer explicit user_id from body if provided; otherwise use authenticated userId
    const buyerId = createAuctionPaymentDto.user_id ?? authReq.user?.userId;

    if (!buyerId) {
      throw new BadRequestException(
        'Missing authenticated user context or user_id in request body',
      );
    }

    return this.paymentService.createVNPayUrlForAuction(
      createAuctionPaymentDto,
      buyerId,
      req.ip || '127.0.0.1',
    );
  }

  @Post('vnpay-ipn')
  @Public()
  @ApiOperation({ summary: 'Handle VNPay IPN' })
  async handleVNPayIPN(@Body() vnpayData: VNPayIPNDto) {
    return this.paymentService.handleVNPayIPN(vnpayData);
  }

  // VNPay redirects the browser to this URL using GET with query params.
  // Support GET so browser redirects (and manual testing via browser) work.
  @Get('vnpay-return')
  @ApiOperation({ summary: 'Handle VNPay return (GET)' })
  @Public()
  async handleVNPayReturnGet(
    @Query() vnpayData: Record<string, any>,
    @Req() req: Request,
  ) {
    // Log raw URL for debugging (includes original query string encoding)
    try {
      console.log(
        '[VNPay Return GET] originalUrl:',
        (req as any).originalUrl || req.url,
      );
    } catch {
      // ignore
    }
    return this.paymentService.verifyReturnUrl(vnpayData);
  }

  // Also keep POST handler (some integrations may POST)
  @Post('vnpay-return')
  @ApiOperation({ summary: 'Handle VNPay return (POST)' })
  @Public()
  async handleVNPayReturn(@Body() vnpayData: Record<string, any>) {
    return this.paymentService.verifyReturnUrl(vnpayData);
  }
}
