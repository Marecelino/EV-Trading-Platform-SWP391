import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BatteryDetail } from '../model/batterydetails';
import { CreateBatteryDetailDto, UpdateBatteryDetailDto } from './dto';

@Injectable()
export class BatteryDetailsService {
  constructor(
    @InjectModel(BatteryDetail.name)
    private batteryDetailModel: Model<BatteryDetail>,
  ) {}

  async create(
    createBatteryDetailDto: CreateBatteryDetailDto,
  ): Promise<BatteryDetail> {
    const batteryDetail = new this.batteryDetailModel(createBatteryDetailDto);
    return batteryDetail.save();
  }

  async findAll(): Promise<BatteryDetail[]> {
    return this.batteryDetailModel.find().populate('listing_id').exec();
  }

  async findOne(id: string): Promise<BatteryDetail> {
    const batteryDetail = await this.batteryDetailModel
      .findById(id)
      .populate('listing_id')
      .exec();
    if (!batteryDetail) {
      throw new NotFoundException(`Battery detail with ID ${id} not found`);
    }
    return batteryDetail;
  }

  async findByListingId(listingId: string): Promise<BatteryDetail> {
    const batteryDetail = await this.batteryDetailModel
      .findOne({ listing_id: listingId })
      .populate('listing_id')
      .exec();
    if (!batteryDetail) {
      throw new NotFoundException(
        `Battery detail for listing ${listingId} not found`,
      );
    }
    return batteryDetail;
  }

  async update(
    id: string,
    updateBatteryDetailDto: UpdateBatteryDetailDto,
  ): Promise<BatteryDetail> {
    const batteryDetail = await this.batteryDetailModel
      .findByIdAndUpdate(id, updateBatteryDetailDto, {
        new: true,
        runValidators: true,
      })
      .populate('listing_id')
      .exec();

    if (!batteryDetail) {
      throw new NotFoundException(`Battery detail with ID ${id} not found`);
    }
    return batteryDetail;
  }

  async remove(id: string): Promise<void> {
    const result = await this.batteryDetailModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Battery detail with ID ${id} not found`);
    }
  }

  async findByChemistry(chemistry: string): Promise<BatteryDetail[]> {
    return this.batteryDetailModel
      .find({ chemistry })
      .populate('listing_id')
      .exec();
  }

  async findByCapacityRange(
    minCapacity: number,
    maxCapacity: number,
  ): Promise<BatteryDetail[]> {
    return this.batteryDetailModel
      .find({
        capacity_kwh: { $gte: minCapacity, $lte: maxCapacity },
      })
      .populate('listing_id')
      .exec();
  }

  async findByHealthRange(
    minHealth: number,
    maxHealth: number,
  ): Promise<BatteryDetail[]> {
    return this.batteryDetailModel
      .find({
        soh_percent: { $gte: minHealth, $lte: maxHealth },
      })
      .populate('listing_id')
      .exec();
  }
}
