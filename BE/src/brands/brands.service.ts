import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand } from '../model/brands';
import { CreateBrandDto, UpdateBrandDto } from './dto';

@Injectable()
export class BrandsService {
  constructor(@InjectModel(Brand.name) private brandModel: Model<Brand>) {}

  async create(createBrandDto: CreateBrandDto): Promise<Brand> {
    try {
      const brand = new this.brandModel(createBrandDto);
      return await brand.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Brand name already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<Brand[]> {
    return this.brandModel.find().exec();
  }

  async findActive(): Promise<Brand[]> {
    return this.brandModel.find({ is_active: true }).exec();
  }

  async findOne(id: string): Promise<Brand> {
    const brand = await this.brandModel.findById(id).exec();
    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }
    return brand;
  }

  async findByName(name: string): Promise<Brand> {
    const brand = await this.brandModel.findOne({ name }).exec();
    if (!brand) {
      throw new NotFoundException(`Brand with name ${name} not found`);
    }
    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto): Promise<Brand> {
    try {
      const brand = await this.brandModel
        .findByIdAndUpdate(id, updateBrandDto, {
          new: true,
          runValidators: true,
        })
        .exec();

      if (!brand) {
        throw new NotFoundException(`Brand with ID ${id} not found`);
      }
      return brand;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Brand name already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.brandModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }
  }

  async incrementListingCount(id: string): Promise<Brand> {
    const brand = await this.brandModel
      .findByIdAndUpdate(id, { $inc: { listing_count: 1 } }, { new: true })
      .exec();

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }
    return brand;
  }

  async decrementListingCount(id: string): Promise<Brand> {
    const brand = await this.brandModel
      .findByIdAndUpdate(id, { $inc: { listing_count: -1 } }, { new: true })
      .exec();

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }
    return brand;
  }

  async toggleActive(id: string): Promise<Brand> {
    const brand = await this.brandModel.findById(id).exec();
    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    brand.is_active = !brand.is_active;
    return brand.save();
  }
}
