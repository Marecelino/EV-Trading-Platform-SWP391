import axiosClient from './axiosClient';

export interface PlatformSettings {
  _id: string;
  listing_fee_amount: number;
  commission_default_rate: number;
  commission_threshold: number;
  updated_by?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface UpdatePlatformSettingsDto {
  listing_fee_amount?: number;
  commission_default_rate?: number;
  commission_threshold?: number;
}

const platformSettingsApi = {
  // Lấy cấu hình hiện tại
  getSettings: async (): Promise<PlatformSettings> => {
    const response = await axiosClient.get<PlatformSettings>('/admin/platform-settings');
    return response.data;
  },

  // Cập nhật cấu hình
  updateSettings: async (
    data: UpdatePlatformSettingsDto
  ): Promise<PlatformSettings> => {
    const response = await axiosClient.patch<PlatformSettings>(
      '/admin/platform-settings',
      data
    );
    return response.data;
  },
};

export default platformSettingsApi;

