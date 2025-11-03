import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ParseEnumPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuctionsService } from './auctions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../model/users.schema';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { CreateBidDto } from './dto/create-bid.dto';
import { EVAuctionService } from './ev-auction.service';
import { BatteryAuctionService } from './battery-auction.service';
import { CreateBatteryAuctionDto } from './dto/create-battery-auction';
import { CreateEVAuctionDto } from './dto/create-ev-auction';
import { AuctionStatus } from '../model/auctions';
import { UpdateAuctionStatusDto } from './dto/update-auction-status.dto';

@ApiTags('Auctions')
@ApiBearerAuth()
@Controller('auctions')
export class AuctionsController {
  constructor(
    private readonly auctionsService: AuctionsService,
    private readonly evAuctionService: EVAuctionService,
    private readonly batteryAuctionService: BatteryAuctionService,
  ) { }

  @Get()
  @ApiOperation({
    summary: 'Get all auctions with pagination',
    description:
      'Retrieves all auctions with pagination and optional filtering. Results include populated listing and seller information.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (starts from 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (max 50)',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: 'Filter by auction status',
    enum: ['scheduled', 'live', 'ended', 'cancelled'],
    example: 'live',
  })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const filter = status ? { status } : {};

    const result = await this.auctionsService.findAll(
      pageNum,
      limitNum,
      filter,
    );

    return {
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    };
  }

  @Post('ev')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create EV auction' })
  @ApiBody({ type: CreateEVAuctionDto })
  @HttpCode(HttpStatus.CREATED)
  async createEvAuction(@Body() dto: CreateEVAuctionDto, @Request() req: any) {
    const userId = req.user?.userId ?? req.user?.id;
    const ip = req.ip || '127.0.0.1';
    const result = await this.evAuctionService.create(dto, userId, ip);
    return result;
  }

  @Post('battery')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create Battery auction' })
  @ApiBody({ type: CreateBatteryAuctionDto })
  @HttpCode(HttpStatus.CREATED)
  async createBatteryAuction(@Body() dto: CreateBatteryAuctionDto, @Request() req: any) {
    const userId = req.user?.userId ?? req.user?.id;
    const ip = req.ip || '127.0.0.1';
    const result = await this.batteryAuctionService.create(dto, userId, ip);
    return result;
  }

  @Get('live')
  @ApiOperation({
    summary: 'Get live auctions',
    description:
      'Retrieves only auctions with "live" status - currently active and accepting bids.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async findLiveAuctions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    const result = await this.auctionsService.findLiveAuctions(
      pageNum,
      limitNum,
    );

    return {
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    };
  }

  @Get('seller/:sellerId')
  @ApiOperation({
    summary: 'Get auctions by seller',
    description: 'Retrieves all auctions created by a specific seller.',
  })
  @ApiParam({
    name: 'sellerId',
    description: 'Seller MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Seller auctions retrieved successfully',
  })
  async findBySeller(
    @Param('sellerId') sellerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    const result = await this.auctionsService.findBySeller(
      sellerId,
      pageNum,
      limitNum,
    );

    return {
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get auction by ID',
    description:
      'Retrieves detailed information about a specific auction including all bids and populated references.',
  })
  @ApiParam({
    name: 'id',
    description: 'Auction MongoDB ObjectId',
    example: '672f8b5e7c8a5b8e4e6b1c2a',
  })
  async findOne(@Param('id') id: string) {
    return {
      data: await this.auctionsService.findOne(id),
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update auction',
    description:
      'Updates auction information. Cannot update ended or cancelled auctions.',
  })
  @ApiParam({
    name: 'id',
    description: 'Auction MongoDB ObjectId',
    example: '672f8b5e7c8a5b8e4e6b1c2a',
  })
  @ApiBody({
    type: UpdateAuctionDto,
    examples: {
      'Extend End Time': {
        summary: 'Extend auction duration',
        value: {
          end_time: '2025-10-28T20:00:00Z',
        },
      },
      'Update Buy Now Price': {
        summary: 'Change buy now price',
        value: {
          buy_now_price: 1500000000,
        },
      },
      'Multiple Updates': {
        summary: 'Update multiple fields',
        value: {
          end_time: '2025-10-28T18:00:00Z',
          min_increment: 10000000,
          buy_now_price: 1800000000,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Auction updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Auction not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot update ended/cancelled auctions',
  })
  @ApiBearerAuth()
  async update(
    @Param('id') id: string,
    @Body() updateAuctionDto: UpdateAuctionDto,
  ) {
    return {
      data: await this.auctionsService.update(id, updateAuctionDto),
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete auction',
    description:
      'Deletes an auction. Cannot delete auctions with bids or live auctions.',
  })
  @ApiParam({
    name: 'id',
    description: 'Auction MongoDB ObjectId',
    example: '672f8b5e7c8a5b8e4e6b1c2a',
  })
  @ApiResponse({
    status: 200,
    description: 'Auction deleted successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Auction deleted successfully' },
        deletedId: { type: 'string', example: '672f8b5e7c8a5b8e4e6b1c2a' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Auction not found' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete auction with bids or live auctions',
  })
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    const result = await this.auctionsService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
      deletedId: result.deletedId,
    };
  }

  @Post(':id/bids')
  @ApiOperation({
    summary: 'Place bid on auction',
    description:
      'Places a bid on a live auction. Bid amount must meet minimum requirements and auction must be active.',
  })
  @ApiParam({
    name: 'id',
    description: 'Auction MongoDB ObjectId',
    example: '672f8b5e7c8a5b8e4e6b1c2a',
  })
  @ApiBody({
    type: CreateBidDto,
    examples: {
      'Regular Bid': {
        summary: 'Normal bid increment',
        value: {
          user_id: '507f1f77bcf86cd799439013',
          amount: 925000000,
        },
      },
      'Buy Now Bid': {
        summary: 'Bid matching buy now price',
        value: {
          user_id: '507f1f77bcf86cd799439014',
          amount: 1200000000,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Bid placed successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 201 },
        message: { type: 'string', example: 'Bid placed successfully' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            current_price: { type: 'number', example: 925000000 },
            status: { type: 'string', example: 'live' },
            bids: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  user_id: { type: 'object' },
                  amount: { type: 'number', example: 925000000 },
                  created_at: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Auction not found' })
  @ApiResponse({
    status: 400,
    description:
      'Invalid bid - auction not live, amount too low, or seller bidding on own auction',
  })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  async placeBid(
    @Param('id') auctionId: string,
    @Body() createBidDto: CreateBidDto,
    @Request() req: any, // In production, extract userId from JWT token
  ) {
    // Note: In production, get userId from JWT token in request
    const userId = req.user?.id || createBidDto.user_id; // Fallback for demo

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Bid placed successfully',
      data: await this.auctionsService.placeBid(
        auctionId,
        userId,
        createBidDto,
      ),
    };
  }

  @Patch(':id/end')
  @ApiOperation({
    summary: 'End auction manually',
    description:
      'Manually ends a live or scheduled auction. Admin function to force-end auctions.',
  })
  @ApiParam({
    name: 'id',
    description: 'Auction MongoDB ObjectId',
    example: '672f8b5e7c8a5b8e4e6b1c2a',
  })
  @ApiResponse({
    status: 200,
    description: 'Auction ended successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Auction ended successfully' },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            status: { type: 'string', example: 'ended' },
            end_time: { type: 'string', example: '2025-10-24T15:45:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Auction not found' })
  @ApiResponse({
    status: 400,
    description: 'Only live or scheduled auctions can be ended',
  })
  @ApiBearerAuth()
  async endAuction(@Param('id') id: string) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Auction ended successfully',
      data: await this.auctionsService.endAuction(id),
    };
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate auction (set live now) - admin only' })
  @ApiParam({ name: 'id', description: 'Auction ID' })
  @ApiResponse({ status: 200, description: 'Auction activated successfully' })
  async activateAuction(@Param('id') id: string) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Auction activated',
      data: await this.auctionsService.activateAuction(id),
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update auction status' })
  @ApiParam({ name: 'id', description: 'Auction ID' })
  @ApiBody({
    type: UpdateAuctionStatusDto,
    examples: {
      Scheduled: { summary: 'Mark auction scheduled', value: { status: AuctionStatus.SCHEDULED } },
      Live: { summary: 'Mark auction live', value: { status: AuctionStatus.LIVE } },
      Ended: { summary: 'Mark auction ended', value: { status: AuctionStatus.ENDED } },
      Cancelled: { summary: 'Cancel auction', value: { status: AuctionStatus.CANCELLED } },
    },
  })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateAuctionStatusDto) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Auction status updated',
      data: await this.auctionsService.updateStatus(id, dto.status),
    };
  }
}
