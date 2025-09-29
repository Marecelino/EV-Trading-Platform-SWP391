// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import type { Product , User} from '../types'; // Import interface đã được cập nhật

const mockSellers: Record<string, User> = {
  user01: { _id: 'user01', full_name: 'Lê Minh Tuấn', avatar_url: 'https://i.pravatar.cc/150?u=user01', role: 'member', status: 'active', email: 'tuan@demo.com' },
  user02: { _id: 'user02', full_name: 'Trần Thị Bích', avatar_url: 'https://i.pravatar.cc/150?u=user02', role: 'member', status: 'active', email: 'bich@demo.com' },
  user03: { _id: 'user03', full_name: 'Nguyễn Văn Hùng', avatar_url: 'https://i.pravatar.cc/150?u=user03', role: 'member', status: 'active', email: 'hung@demo.com' },
};

const mockProducts: Product[] = [
  // Mẫu 1: Xe điện (EV)
  {
    _id: '6515a8b5e7c8a5b8e4e6b1c1',
    seller_id: 'user01',
    brand_id: 'brand_vinfast',
    model_id: 'model_vf8',
    title: 'Vinfast VF8 Eco 2023 còn như mới, ODO siêu lướt',
    description: 'Xe gia đình sử dụng kỹ, còn mới 99%. Bảo hành chính hãng còn dài đến 2030. Cam kết không đâm đụng, ngập nước. Bao test hãng thoải mái.',
    price: 850000000,
    condition: 'like_new',
    status: 'active',
    location: {
      city: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
    },
    images: [
      'https://via.placeholder.com/800x600.png/27AE60/FFFFFF?text=VF8+Mat+Truoc',
      'https://via.placeholder.com/800x600.png/2C3E50/FFFFFF?text=VF8+Ben+Hong',
      'https://via.placeholder.com/800x600.png/3498DB/FFFFFF?text=VF8+Noi+That'
    ],
    is_verified: true,
    is_featured: true,
    views: 1250,
    created_at: new Date().toISOString(),
    ev_details: {
      mileage: 15000,
      year_of_manufacture: 2023,
      battery_capacity: 82,
      range: 420,
      color: 'Trắng',
      seats: 5,
      features: ['Cửa sổ trời', 'Camera 360', 'Sạc nhanh']
    },
  },
  // Mẫu 2: Pin (Battery)
  {
    _id: '6515a8b5e7c8a5b8e4e6b1c2',
    seller_id: 'user02',
    brand_id: 'brand_lg',
    model_id: 'model_lg_chem',
    title: 'Pin Lithium-ion LG Chem 48V - 50Ah cho xe máy điện',
    description: 'Pin thay thế cho các dòng xe Vinfast Klara, Ludo. Dung lượng chuẩn, mới sử dụng 3 tháng, còn bảo hành 9 tháng. Hiệu suất cao, an toàn.',
    price: 5500000,
    condition: 'good',
    status: 'active',
    location: {
      city: 'Hà Nội',
      district: 'Cầu Giấy',
    },
    images: ['https://via.placeholder.com/800x600.png/F1C40F/2C3E50?text=LG+Battery'],
    is_verified: false,
    is_featured: false,
    views: 890,
    created_at: new Date().toISOString(),
    battery_details: {
      capacity: 50, // Ah
      state_of_health: 95,
      cycle_count: 150,
    },
  },
  // Mẫu 3: Xe điện khác
  {
    _id: '6515a8b5e7c8a5b8e4e6b1c3',
    seller_id: 'user03',
    brand_id: 'brand_kia',
    model_id: 'model_ev6',
    title: 'Kia EV6 GT-Line 2022 màu đỏ',
    description: 'Bản full option, nóc trời toàn cảnh. Xe nhập khẩu nguyên chiếc. Giá có thương lượng cho người thiện chí.',
    price: 1250000000,
    condition: 'good',
    status: 'active',
    location: {
      city: 'Đà Nẵng',
      district: 'Hải Châu'
    },
    images: ['https://via.placeholder.com/800x600.png/E74C3C/FFFFFF?text=Kia+EV6'],
    is_verified: true,
    is_featured: false,
    views: 2300,
    created_at: new Date().toISOString(),
    ev_details: {
      mileage: 22000,
      year_of_manufacture: 2022,
      battery_capacity: 77.4,
      range: 510,
      color: 'Đỏ',
      seats: 5
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
              _id: 'user123', email: 'member@example.com', full_name: 'Thành viên Demo', role: 'member', status: 'active', avatar_url: 'https://i.pravatar.cc/150'
            },
            token: 'fake-jwt-token-string-updated'
          }
      });
    } else {
      return HttpResponse.json({
          success: false, message: 'Email hoặc mật khẩu không chính xác.',
      }, { status: 401 });
    }
  }),
  http.get('http://localhost:5000/api/listings/:id', ({ params }) => {
    const { id } = params;
    const product = mockProducts.find(p => p._id === id);

    if (product) {
       const sellerInfo = mockSellers[product.seller_id];
      const productWithSeller = {
        ...product,
        seller_id: sellerInfo, // Thay thế seller_id bằng object User đầy đủ
      };
      return HttpResponse.json({
        success: true,
        message: 'Lấy chi tiết tin đăng thành công!',
        data: productWithSeller,
      });
    } else {
      return HttpResponse.json({
        success: false,
        message: 'Không tìm thấy tin đăng',
      }, { status: 404 });
    }
  }),
];