// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import type { Product } from '../types';

const mockProducts: Product[] = [
  // Mẫu cho Xe điện (EV)
  {
    _id: '6515a8b5e7c8a5b8e4e6b1c1',
    seller_id: 'user1',
    category_id: 'electric_vehicle',
    title: 'Vinfast VF8 Eco 2022',
    description: 'Xe gia đình sử dụng kỹ, còn mới 99%. Bảo hành chính hãng còn dài. Cam kết không đâm đụng, ngập nước.',
    price: 850000000,
    condition: 'excellent',
    status: 'published',
    city: 'Quận 1, TP.HCM',
    images: [{ url: 'https://via.placeholder.com/600x400.png/27AE60/FFFFFF?text=VF8+Front' }, { url: 'https://via.placeholder.com/600x400.png/2C3E50/FFFFFF?text=VF8+Side' }],
    is_verified: true,
    view_count: 1250,
    created_at: new Date().toISOString(),
    ev_details: {
      manufacturing_year: 2022,
      mileage_km: 15000,
      battery_capacity_kwh: 82,
      battery_health_percent: 98,
    },
  },
  // Mẫu cho Pin (Battery)
  {
    _id: '6515a8b5e7c8a5b8e4e6b1c2',
    seller_id: 'user2',
    category_id: 'battery',
    title: 'Pin Lithium-ion cho xe máy điện',
    description: 'Pin thay thế cho các dòng xe Vinfast Klara, Ludo. Dung lượng chuẩn, mới sử dụng 3 tháng.',
    price: 5500000,
    condition: 'good',
    status: 'published',
    city: 'Cầu Giấy, Hà Nội',
    images: [{ url: 'https://via.placeholder.com/600x400.png/3498DB/FFFFFF?text=Battery' }],
    is_verified: false,
    view_count: 890,
    created_at: new Date().toISOString(),
    battery_details: {
      capacity_kwh: 1.5,
      health_percent: 95,
      cycle_count: 150,
    },
  },
  // Thêm một mẫu xe khác
  {
    _id: '6515a8b5e7c8a5b8e4e6b1c3',
    seller_id: 'user3',
    title: 'Kia EV6 GT-Line 2022',
    description: 'Bản full option, nóc trời toàn cảnh. Xe nhập khẩu nguyên chiếc. Giá có thương lượng cho người thiện chí.',
    price: 1250000000,
    condition: 'good',
    status: 'published',
    city: 'Hải Châu, Đà Nẵng',
    images: [{ url: 'https://via.placeholder.com/600x400.png/F1C40F/2C3E50?text=EV6' }],
    is_verified: true,
    view_count: 2300,
    created_at: new Date().toISOString(),
    ev_details: {
      manufacturing_year: 2022,
      mileage_km: 22000,
      battery_capacity_kwh: 77.4,
      battery_health_percent: 97,
    },
  },
];

export const handlers = [
  http.get('http://localhost:5000/api/listings', () => {
    return HttpResponse.json({
        success: true,
        message: 'Lấy danh sách tin đăng thành công!',
        data: mockProducts,
        pagination: {
            page: 1, limit: 10, total: mockProducts.length, pages: 1,
        }
    });
  }),

  http.post('http://localhost:5000/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as Record<string, unknown>;
    if (email === 'member@example.com' && password === '123456') {
      return HttpResponse.json({
          success: true,
          message: 'Đăng nhập thành công',
          data: {
            user: {
              _id: 'user123', email: 'member@example.com', full_name: 'Thành viên Demo', role: 'member', status: 'active',
            },
            token: 'fake-jwt-token-string'
          }
      });
    } else {
      return HttpResponse.json({
          success: false, message: 'Email hoặc mật khẩu không chính xác.',
      }, { status: 401 });
    }
  }),
];