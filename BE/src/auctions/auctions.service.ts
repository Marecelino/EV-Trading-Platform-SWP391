import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as mongoose from 'mongoose';
import { Auction, AuctionStatus } from '../model/auctions';
import { CreateAuctionDto } from './dto/create-auction.dto';
import { UpdateAuctionDto } from './dto/update-auction.dto';
import { CreateBidDto } from './dto/create-bid.dto';

@Injectable()
export class AuctionsService {
  constructor(
    @InjectModel(Auction.name) private auctionModel: Model<Auction>,
  ) {}

  /**
   * CREATE - Create new auction
   */
  async create(dto: CreateAuctionDto) {
    // Validate dates
    const now = new Date();
    const start = new Date(dto.start_time);
    const end = new Date(dto.end_time);

    if (end <= start) {
      throw new BadRequestException('End time must be after start time');
    }
    if (end <= now) {
      throw new BadRequestException('End time must be in the future');
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(dto.listing_id)) {
      throw new BadRequestException('Invalid listing ID format');
    }
    if (!mongoose.Types.ObjectId.isValid(dto.seller_id)) {
      throw new BadRequestException('Invalid user ID format (seller must be a user)');
    }

    try {
      // Create auction data (seller_id references User model)
      const auctionData = {
        listing_id: new mongoose.Types.ObjectId(dto.listing_id),
        seller_id: new mongoose.Types.ObjectId(dto.seller_id), // This is a user ID (role: user)
        start_time: start,
        end_time: end,
        starting_price: dto.starting_price,
        current_price: dto.starting_price,
        min_increment: dto.min_increment,
        buy_now_price: dto.buy_now_price,
        status: start <= now ? AuctionStatus.LIVE : AuctionStatus.SCHEDULED,
        bids: [],
      };

      // Create auction
      const auction = await this.auctionModel.create(auctionData);
      
      // Return populated auction
      return await this.auctionModel
        .findById(auction._id)
        .populate('listing_id')
        .populate('seller_id', 'name email phone')
        .exec();

    } catch (error) {
      console.error('Auction creation error:', error);
      
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err: any) => err.message);
        throw new BadRequestException(`Validation failed: ${messages.join(', ')}`);
      }
      
      if (error.code === 11000) {
        throw new BadRequestException('Duplicate auction - may already exist');
      }

      throw new BadRequestException(`Failed to create auction: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * READ - Get all auctions with pagination
   */
  async findAll(page = 1, limit = 10, filter = {}) {
    try {
      const skip = (page - 1) * limit;
      
      const [auctions, total] = await Promise.all([
        this.auctionModel
          .find(filter)
          .populate('listing_id')
          .populate('seller_id', 'name email phone')
          .populate('bids.user_id', 'name email phone')
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.auctionModel.countDocuments(filter)
      ]);

      return {
        data: auctions,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch auctions: ' + error.message);
    }
  }

  /**
   * READ - Get auction by ID
   */
  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid auction ID');
    }

    try {
      const auction = await this.auctionModel
        .findById(id)
        .populate('listing_id')
        .populate('seller_id', 'name email phone')
        .populate('bids.user_id', 'name email phone')
        .exec();

      if (!auction) {
        throw new NotFoundException('Auction not found');
      }

      return auction;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch auction: ' + error.message);
    }
  }

  /**
   * READ - Get auctions by user (seller)
   */
  async findBySeller(userId: string, page = 1, limit = 10) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.findAll(page, limit, { seller_id: userId });
  }

  /**
   * READ - Get live auctions
   */
  async findLiveAuctions(page = 1, limit = 10) {
    return this.findAll(page, limit, { status: AuctionStatus.LIVE });
  }

  /**
   * UPDATE - Update auction
   */
  async update(id: string, dto: UpdateAuctionDto) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid auction ID');
    }

    try {
      const auction = await this.auctionModel.findById(id);
      if (!auction) {
        throw new NotFoundException('Auction not found');
      }

      // Prevent updates to ended or cancelled auctions
      if ([AuctionStatus.ENDED, AuctionStatus.CANCELLED].includes(auction.status)) {
        throw new BadRequestException('Cannot update ended or cancelled auctions');
      }

      // Prepare update data
      const updateData: any = { ...dto };
      if (dto.start_time) updateData.start_time = new Date(dto.start_time);
      if (dto.end_time) updateData.end_time = new Date(dto.end_time);

      // Validate dates if updating both
      if (updateData.start_time && updateData.end_time) {
        if (updateData.end_time <= updateData.start_time) {
          throw new BadRequestException('End time must be after start time');
        }
      }

      const updatedAuction = await this.auctionModel
        .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .populate('listing_id')
        .populate('seller_id', 'name email phone')
        .populate('bids.user_id', 'name email phone')
        .exec();

      return updatedAuction;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update auction: ' + error.message);
    }
  }

  /**
   * DELETE - Delete auction
   */
  async remove(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid auction ID');
    }

    try {
      const auction = await this.auctionModel.findById(id);
      if (!auction) {
        throw new NotFoundException('Auction not found');
      }

      // Business rules for deletion
      if (auction.bids && auction.bids.length > 0) {
        throw new BadRequestException('Cannot delete auction with existing bids');
      }

      if (auction.status === AuctionStatus.LIVE) {
        throw new BadRequestException('Cannot delete live auctions');
      }

      await this.auctionModel.findByIdAndDelete(id);
      
      return { 
        message: 'Auction deleted successfully',
        deletedId: id 
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete auction: ' + error.message);
    }
  }

  /**
   * PLACE BID - Place bid on auction (without transaction for now)
   */
  async placeBid(auctionId: string, userId: string, dto: CreateBidDto) {
    if (!mongoose.Types.ObjectId.isValid(auctionId)) {
      throw new BadRequestException('Invalid auction ID');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    try {
      const auction = await this.auctionModel.findById(auctionId);
      if (!auction) {
        throw new NotFoundException('Auction not found');
      }

      // Validate auction state
      const now = new Date();
      if (auction.status !== AuctionStatus.LIVE) {
        throw new BadRequestException('Auction is not live');
      }
      if (auction.end_time <= now) {
        throw new BadRequestException('Auction has ended');
      }
      if (auction.seller_id.toString() === userId) {
        throw new BadRequestException('User cannot bid on their own auction');
      }

      // Validate bid amount
      const minBid = auction.current_price + auction.min_increment;
      if (dto.amount < minBid) {
        throw new BadRequestException(`Minimum bid is ${minBid}`);
      }

      // Create bid record
      const bidRecord = {
        user_id: new mongoose.Types.ObjectId(userId),
        amount: dto.amount,
        created_at: now,
      };

      // Update auction
      auction.bids.unshift(bidRecord);
      auction.current_price = dto.amount;

      // Check buy now price
      if (auction.buy_now_price && dto.amount >= auction.buy_now_price) {
        auction.status = AuctionStatus.ENDED;
        auction.end_time = now;
      }

      await auction.save();

      // Return updated auction with populated fields
      return await this.auctionModel
        .findById(auctionId)
        .populate('listing_id')
        .populate('seller_id', 'name email phone')
        .populate('bids.user_id', 'name email phone')
        .exec();

    } catch (error) {
      console.error('Place bid error:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to place bid: ' + error.message);
    }
  }

  /**
   * END AUCTION - End auction manually
   */
  async endAuction(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid auction ID');
    }

    try {
      const auction = await this.auctionModel.findById(id);
      if (!auction) {
        throw new NotFoundException('Auction not found');
      }

      if (auction.status === AuctionStatus.ENDED) {
        return auction;
      }

      if (![AuctionStatus.LIVE, AuctionStatus.SCHEDULED].includes(auction.status)) {
        throw new BadRequestException('Only live or scheduled auctions can be ended');
      }

      auction.status = AuctionStatus.ENDED;
      auction.end_time = new Date();

      return await auction.save();
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to end auction: ' + error.message);
    }
  }

  /**
   * TEST CONNECTION - Simple test to check database connection
   */
  async testConnection() {
    try {
      const count = await this.auctionModel.countDocuments();
      return {
        status: 'connected',
        message: `Database connection successful. Found ${count} auctions.`,
        timestamp: new Date()
      };
    } catch (error) {
      throw new BadRequestException('Database connection failed: ' + error.message);
    }
  }
}
