import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { PriceSuggestion, PriceSuggestionDocument } from '../model/pricesuggestions';
import { CreatePriceSuggestionDto } from './dto/create-pricesuggestion.dto';
import { UpdatePriceSuggestionDto } from './dto/update-pricesuggestion.dto';
import { FilterPriceSuggestionsDto } from './dto/filter-pricesuggestions.dto';

@Injectable()
export class PriceSuggestionsService {
  constructor(
    @InjectModel(PriceSuggestion.name)
    private readonly priceSuggestionModel: Model<PriceSuggestionDocument>,
  ) {}

  async create(createPriceSuggestionDto: CreatePriceSuggestionDto): Promise<PriceSuggestionDocument> {
    const priceSuggestion = new this.priceSuggestionModel(createPriceSuggestionDto);
    return priceSuggestion.save();
  }

  async findAll(filter: FilterPriceSuggestionsDto = {}, page = 1, limit = 20) {
    const query: FilterQuery<PriceSuggestion> = {};

    if (filter.listing_id) {
      query.listing_id = filter.listing_id;
    }

    if (filter.model_name) {
      query.model_name = new RegExp(filter.model_name, 'i');
    }

    if (filter.minConfidence !== undefined) {
      query.model_confidence = { $gte: filter.minConfidence };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.priceSuggestionModel
        .find(query)
        .populate('listing_id')
        .sort({ model_confidence: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.priceSuggestionModel.countDocuments(query),
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

  async findOne(id: string): Promise<PriceSuggestionDocument> {
    const priceSuggestion = await this.priceSuggestionModel
      .findById(id)
      .populate('listing_id')
      .exec();

    if (!priceSuggestion) {
      throw new NotFoundException('Price Suggestion not found');
    }

    return priceSuggestion;
  }

  async findByListing(listingId: string): Promise<PriceSuggestionDocument[]> {
    return this.priceSuggestionModel
      .find({ listing_id: listingId })
      .populate('listing_id')
      .sort({ model_confidence: -1, createdAt: -1 })
      .exec();
  }

  async findLatestByListing(listingId: string): Promise<PriceSuggestionDocument | null> {
    return this.priceSuggestionModel
      .findOne({ listing_id: listingId })
      .populate('listing_id')
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, updatePriceSuggestionDto: UpdatePriceSuggestionDto): Promise<PriceSuggestionDocument> {
    const priceSuggestion = await this.priceSuggestionModel
      .findByIdAndUpdate(id, updatePriceSuggestionDto, { new: true, runValidators: true })
      .populate('listing_id')
      .exec();

    if (!priceSuggestion) {
      throw new NotFoundException('Price Suggestion not found');
    }

    return priceSuggestion;
  }

  async remove(id: string): Promise<PriceSuggestionDocument> {
    const priceSuggestion = await this.priceSuggestionModel.findByIdAndDelete(id).exec();

    if (!priceSuggestion) {
      throw new NotFoundException('Price Suggestion not found');
    }

    return priceSuggestion;
  }

  async removeByListing(listingId: string): Promise<void> {
    await this.priceSuggestionModel.deleteMany({ listing_id: listingId }).exec();
  }
}