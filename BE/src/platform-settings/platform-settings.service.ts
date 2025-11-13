import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PlatformSettings } from '../model/platformsettings';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';

@Injectable()
export class PlatformSettingsService {
  constructor(
    @InjectModel(PlatformSettings.name)
    private readonly platformSettingsModel: Model<PlatformSettings>,
  ) {}

  /**
   * Get current platform settings, create default if not exists
   */
  async getCurrentSettings(): Promise<PlatformSettings> {
    let settings: any = await this.platformSettingsModel.findOne().lean();
    
    if (!settings) {
      // Create default settings
      const defaultSettings = new this.platformSettingsModel({
        listing_fee_amount: 15000,
        commission_default_rate: 0.02,
        commission_threshold: 100000000,
      });
      const saved = await defaultSettings.save();
      settings = saved.toObject();
    }

    return settings as PlatformSettings;
  }

  /**
   * Update platform settings
   */
  async updateSettings(
    dto: UpdatePlatformSettingsDto,
    adminId: string,
  ): Promise<PlatformSettings> {
    const currentSettings = await this.getCurrentSettings();
    
    const updateData: any = {
      ...dto,
      updated_by: adminId,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    const updated = await this.platformSettingsModel
      .findByIdAndUpdate(
        (currentSettings as any)._id,
        { $set: updateData },
        { new: true, upsert: true },
      )
      .lean();

    if (!updated) {
      throw new Error('Failed to update platform settings');
    }

    return updated as unknown as PlatformSettings;
  }

  /**
   * Get listing fee amount
   */
  async getListingFeeAmount(): Promise<number> {
    const settings = await this.getCurrentSettings();
    return settings.listing_fee_amount;
  }

  /**
   * Get commission default rate
   */
  async getCommissionDefaultRate(): Promise<number> {
    const settings = await this.getCurrentSettings();
    return settings.commission_default_rate;
  }

  /**
   * Get commission threshold
   */
  async getCommissionThreshold(): Promise<number> {
    const settings = await this.getCurrentSettings();
    return settings.commission_threshold;
  }
}

