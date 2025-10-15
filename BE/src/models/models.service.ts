import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model as MongooseModel } from 'mongoose';
import { Model, ModelDocument } from '../model/models';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { FilterModelsDto } from './dto/filter-models.dto';

@Injectable()
export class ModelsService {
  constructor(
    @InjectModel(Model.name)
    private readonly modelModel: MongooseModel<ModelDocument>,
  ) {}

  async create(createModelDto: CreateModelDto): Promise<ModelDocument> {
    const model = new this.modelModel(createModelDto);
    return model.save();
  }

  async findAll(filter: FilterModelsDto = {}, page = 1, limit = 20) {
    const query: FilterQuery<Model> = {};

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

    const [data, total] = await Promise.all([
      this.modelModel
        .find(query)
        .populate('brand_id')
        .sort({ listing_count: -1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.modelModel.countDocuments(query),
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