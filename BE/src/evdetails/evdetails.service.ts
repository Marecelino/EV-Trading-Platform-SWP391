import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { EVDetail, EVDetailDocument } from '../model/evdetails';
import { CreateEVDetailDto } from './dto/create-evdetail.dto';
import { UpdateEVDetailDto } from './dto/update-evdetail.dto';
import { FilterEVDetailsDto } from './dto/filter-evdetails.dto';

@Injectable()
export class EvdetailsService {
  constructor(
    @InjectModel(EVDetail.name)
    private readonly evDetailModel: Model<EVDetailDocument>,
  ) {}

  async create(
    createEVDetailDto: CreateEVDetailDto,
  ): Promise<EVDetailDocument> {
    const evDetail = new this.evDetailModel(createEVDetailDto);
    return evDetail.save();
  }

  async findAll(filter: FilterEVDetailsDto = {}, page = 1, limit = 20) {
    const query: FilterQuery<EVDetail> = {};

    if (filter.minYear || filter.maxYear) {
      query.year = {};
      if (filter.minYear) query.year.$gte = filter.minYear;
      if (filter.maxYear) query.year.$lte = filter.maxYear;
    }

    if (filter.maxMileage) {
      query.mileage_km = { $lte: filter.maxMileage };
    }

    if (filter.minBatteryCapacity) {
      query.battery_capacity_kwh = { $gte: filter.minBatteryCapacity };
    }

    if (filter.minRange) {
      query.range_km = { $gte: filter.minRange };
    }

    if (filter.color) {
      query.color = new RegExp(filter.color, 'i');
    }

    if (filter.driveType) {
      query.drive_type = new RegExp(filter.driveType, 'i');
    }

    if (filter.seats) {
      query.seats = filter.seats;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.evDetailModel
        .find(query)
        .populate('listing_id')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.evDetailModel.countDocuments(query),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<EVDetailDocument> {
    const evDetail = await this.evDetailModel
      .findById(id)
      .populate('listing_id')
      .exec();

    if (!evDetail) {
      throw new NotFoundException('EV Detail not found');
    }

    return evDetail;
  }

  async findByListing(listingId: string): Promise<EVDetailDocument | null> {
    return this.evDetailModel
      .findOne({ listing_id: listingId })
      .populate('listing_id')
      .exec();
  }

  async update(
    id: string,
    updateEVDetailDto: UpdateEVDetailDto,
  ): Promise<EVDetailDocument> {
    const evDetail = await this.evDetailModel
      .findByIdAndUpdate(id, updateEVDetailDto, {
        new: true,
        runValidators: true,
      })
      .populate('listing_id')
      .exec();

    if (!evDetail) {
      throw new NotFoundException('EV Detail not found');
    }

    return evDetail;
  }

  async remove(id: string): Promise<EVDetailDocument> {
    const evDetail = await this.evDetailModel.findByIdAndDelete(id).exec();

    if (!evDetail) {
      throw new NotFoundException('EV Detail not found');
    }

    return evDetail;
  }
}
