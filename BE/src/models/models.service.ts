import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model as MongooseModel } from 'mongoose';
import { Models, ModelDocument } from '../model/models';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { FilterModelsDto } from './dto/filter-models.dto';
import { Brand } from 'src/model/brands';

@Injectable()
export class ModelsService {
  constructor(
    @InjectModel(Models.name)
    private readonly modelModel: MongooseModel<ModelDocument>,
    @InjectModel(Brand.name)
    private readonly brandModel: MongooseModel<Brand>,
  ) {}

  async create(createModelDto: CreateModelDto): Promise<ModelDocument> {
    // Resolve brand_name -> brand_id
    const brandName = (createModelDto as any).brand_name?.toString().trim();
    if (!brandName) {
      throw new NotFoundException('brand_name is required');
    }

    const brand = await this.brandModel.findOne({ name: { $regex: `^${brandName}$`, $options: 'i' } }).exec();
    if (!brand) {
      throw new NotFoundException(`Brand not found: ${brandName}`);
    }

    const payload = {
      ...createModelDto,
      brand_id: brand._id,
    } as any;

    const model = new this.modelModel(payload);
    return model.save();
  }

  async findAll(filter: FilterModelsDto = {}, page = 1, limit = 20) {
    const query: FilterQuery<Models> = {};

    if (filter.brand_id) {
      query.brand_id = filter.brand_id;
    }

    if (filter.body_type) {
      query.body_type = new RegExp(filter.body_type, 'i');
    }

    if (filter.drivetrain) {
      query.drivetrain = new RegExp(filter.drivetrain, 'i');
    }

    if (filter.is_active !== undefined) {
      query.is_active = filter.is_active;
    }

    if (filter.search) {
      query.$text = { $search: filter.search };
    }

    const skip = (page - 1) * limit;

    // ...existing code...
    const [data, total] = await Promise.all([
      this.modelModel
        .find(query)
        .populate({ path: 'brand_id', select: '_id name' })
        .sort({ listing_count: -1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.modelModel.countDocuments(query),
    ]);
// ...existing code...

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

  async findOne(id: string): Promise<ModelDocument> {
    const model = await this.modelModel
      .findById(id)
      .populate('brand_id')
      .exec();

    if (!model) {
      throw new NotFoundException('Model not found');
    }

    return model;
  }

  async findByBrand(brandId: string): Promise<ModelDocument[]> {
    return this.modelModel
      .find({ brand_id: brandId, is_active: true })
      .sort({ name: 1 })
      .exec();
  }

  async update(id: string, updateModelDto: UpdateModelDto): Promise<ModelDocument> {
    const model = await this.modelModel
      .findByIdAndUpdate(id, updateModelDto, { new: true, runValidators: true })
      .populate('brand_id')
      .exec();

    if (!model) {
      throw new NotFoundException('Model not found');
    }

    return model;
  }

  async remove(id: string): Promise<ModelDocument> {
    const model = await this.modelModel.findByIdAndDelete(id).exec();

    if (!model) {
      throw new NotFoundException('Model not found');
    }

    return model;
  }

  async incrementListingCount(id: string, count = 1): Promise<void> {
    await this.modelModel
      .findByIdAndUpdate(id, { $inc: { listing_count: count } })
      .exec();
  }

  async decrementListingCount(id: string, count = 1): Promise<void> {
    await this.modelModel
      .findByIdAndUpdate(id, { $inc: { listing_count: -count } })
      .exec();
  }
}