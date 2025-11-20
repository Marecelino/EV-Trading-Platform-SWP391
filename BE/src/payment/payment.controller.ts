import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  Query,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import type { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import {
  CreatePaymentDto,
  VNPayIPNDto,
  CreateAuctionPaymentDto,
} from './dto/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../model/users.schema';

@ApiTags('Payment')
@ApiBearerAuth()
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) { }

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
  @ApiOperation({ summary: 'Handle VNPay return (GET) - Redirects to frontend' })
  @Public()
  async handleVNPayReturnGet(
    @Query() vnpayData: Record<string, any>,
    @Req() req: Request,
    @Res() res: Response,
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

    // Process payment verification
    let paymentResult;
    try {
      paymentResult = await this.paymentService.verifyReturnUrl(vnpayData);
    } catch (error) {
      // If verification fails, still redirect to frontend with error info
      paymentResult = {
        orderId: vnpayData.vnp_TxnRef || '',
        rspCode: vnpayData.vnp_ResponseCode || '99',
        message: error instanceof Error ? error.message : 'Payment verification failed',
      };
    }

    // Get frontend URL from config
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'http://localhost:5173';
    const baseUrl = frontendUrl.replace(/\/$/, '');

    // Build redirect URL with payment result as query params
    const redirectUrl = new URL(`${baseUrl}/payment/callback`);
    redirectUrl.searchParams.set('orderId', paymentResult.orderId || '');
    redirectUrl.searchParams.set('rspCode', paymentResult.rspCode || '99');
    redirectUrl.searchParams.set('message', paymentResult.message || '');

    // Redirect to frontend
    return res.redirect(redirectUrl.toString());
  }

  // Also keep POST handler (some integrations may POST)
  @Post('vnpay-return')
  @ApiOperation({ summary: 'Handle VNPay return (POST)' })
  @Public()
  async handleVNPayReturn(@Body() vnpayData: Record<string, any>) {
    return this.paymentService.verifyReturnUrl(vnpayData);
  }

  @Get('stats/listing-fees')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thống kê phí đăng tin' })
  async getListingFeesStats() {
    return this.paymentService.getListingFeesStats();
  }
}
