import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../model/categories';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      const category = new this.categoryModel(createCategoryDto);
      return await category.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Category name already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<Category[]> {
    return this.categoryModel.find().populate('parent_category').exec();
  }

  async findActive(): Promise<Category[]> {
    return this.categoryModel.find({ is_active: true }).populate('parent_category').exec();
  }

  async findParentCategories(): Promise<Category[]> {
    return this.categoryModel.find({ parent_category: null }).populate('parent_category').exec();
  }

  async findSubCategories(parentId: string): Promise<Category[]> {
    return this.categoryModel.find({ parent_category: parentId }).populate('parent_category').exec();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).populate('parent_category').exec();
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async findByName(name: string): Promise<Category> {
    const category = await this.categoryModel.findOne({ name }).populate('parent_category').exec();
    if (!category) {
      throw new NotFoundException(`Category with name ${name} not found`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    try {
      const category = await this.categoryModel.findByIdAndUpdate(
        id,
        updateCategoryDto,
        { new: true, runValidators: true }
      ).populate('parent_category').exec();
      
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      return category;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Category name already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    // Check if category has subcategories
    const hasSubCategories = await this.categoryModel.findOne({ parent_category: id }).exec();
    if (hasSubCategories) {
      throw new ConflictException('Cannot delete category with subcategories');
    }

    const result = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }

  async incrementListingCount(id: string): Promise<Category> {
    const category = await this.categoryModel.findByIdAndUpdate(
      id,
      { $inc: { listing_count: 1 } },
      { new: true }
    ).populate('parent_category').exec();
    
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async decrementListingCount(id: string): Promise<Category> {
    const category = await this.categoryModel.findByIdAndUpdate(
      id,
      { $inc: { listing_count: -1 } },
      { new: true }
    ).populate('parent_category').exec();
    
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async toggleActive(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    
    category.is_active = !category.is_active;
    await category.save();
    const updatedCategory = await this.categoryModel.findById(id).populate('parent_category').exec();
    if (!updatedCategory) {
      throw new NotFoundException(`Category with ID ${id} not found after update`);
    }
    return updatedCategory;
  }

  async reorderCategories(categoryIds: string[]): Promise<Category[]> {
    const updatePromises = categoryIds.map(async (id, index) => {
      const category = await this.categoryModel.findByIdAndUpdate(
        id,
        { sort_order: index },
        { new: true }
      ).populate('parent_category').exec();
      
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      return category;
    });
    
    return Promise.all(updatePromises);
  }
}