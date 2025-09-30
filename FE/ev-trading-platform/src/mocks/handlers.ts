// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import type { Product, User } from '../types'; // Import interface đã được cập nhật

const mockSellers: Record<string, User> = {
  user01: { _id: 'user01', full_name: 'Lê Minh Tuấn', avatar_url: 'https://i.pravatar.cc/150?u=user01', role: 'member', status: 'active', email: 'tuan@demo.com' },
  user02: { _id: 'user02', full_name: 'Trần Thị Bích', avatar_url: 'https://i.pravatar.cc/150?u=user02', role: 'member', status: 'active', email: 'bich@demo.com' },
  user03: { _id: 'user03', full_name: 'Nguyễn Văn Hùng', avatar_url: 'https://i.pravatar.cc/150?u=user03', role: 'member', status: 'active', email: 'hung@demo.com' },
};

let mockProducts: Product[] = [
  // Mẫu 1: Xe điện (EV)
  {
    _id: '6515a8b5e7c8a5b8e4e6b1c1',
    seller_id: 'user01',
    brand_id: 'brand_vinfast',
    model_id: 'model_vf8',
    title: 'Vinfast VF8 Eco 2023 còn như mới, ODO siêu lướt',
    description: 'Xe gia đình sử dụng kỹ, còn mới 99%. Bảo hành chính hãng còn dài đến 2030.',
    price: 850000000,
    condition: 'like_new',
    status: 'active',
    location: { city: 'TP. Hồ Chí Minh', district: 'Quận 1' },
    images: [
      'https://storage.googleapis.com/vinfast-data-01/Xe-SUV-VinFast-VF-8-so-huu-ngoai-that-sang-trong-thiet-ke-hop-voi-noi-thanh_1663170557.jpg',  // ảnh ngoại thất
      'https://storage.googleapis.com/vinfast-data-01/Ngo%E1%BA%A1i%20th%E1%BA%A5t%20VF%208_1642069586.jpg',
      'https://th.bing.com/th/id/R.c14328fc2b9e090942e72e8268d9f50c?rik=CTXsOEB33fglsg&pid=ImgRaw&r=0',
      'https://images2.thanhnien.vn/Uploaded/chicuong/2022_09_20/307648302-5401989936547901-8526041155941997652-n-8186.jpg'  // ảnh nội thất
    ],
    is_verified: true,
    is_featured: true,
    views: 1250,
    created_at: new Date().toISOString(),
    ev_details: { mileage: 15000, year_of_manufacture: 2023, battery_capacity: 82, range: 420, color: 'Trắng', seats: 5 },
  },
  {
    _id: '6515a8b5e7c8a5b8e4e6b1c2',
    seller_id: 'user02',
    brand_id: 'brand_lg',
    model_id: 'model_lg_chem',
    title: 'Pin Lithium-ion LG Chem 48V - 50Ah cho xe máy điện',
    description: 'Pin thay thế cho các dòng xe Vinfast Klara, Ludo. Dùng 3 tháng còn bảo hành.',
    price: 5500000,
    condition: 'good',
    status: 'active',
    location: { city: 'Hà Nội', district: 'Cầu Giấy' },
    images: ['https://xexangchaydien.com/wp-content/uploads/2022/08/Anh-pin-1-e1689859791621.jpg'],
    is_verified: false,
    is_featured: false,
    views: 890,
    created_at: new Date().toISOString(),
    battery_details: { capacity: 50, state_of_health: 95, cycle_count: 150 },
  },
  {
    _id: '6515a8b5e7c8a5b8e4e6b1c3',
    seller_id: 'user03',
    brand_id: 'brand_kia',
    model_id: 'model_ev6',
    title: 'Kia EV6 GT-Line 2022 màu đỏ',
    description: 'Bản full option, xe nhập khẩu nguyên chiếc.',
    price: 1250000000,
    condition: 'good',
    status: 'active',
    location: { city: 'Đà Nẵng', district: 'Hải Châu' },
    images: ['https://th.bing.com/th/id/R.e505dd6c93b12b76ab942078c3746cfc?rik=gE8uAbq5e2WDLw&pid=ImgRaw&r=0'],
    is_verified: true,
    is_featured: false,
    views: 2300,
    created_at: new Date().toISOString(),
    ev_details: { mileage: 22000, year_of_manufacture: 2022, battery_capacity: 77.4, range: 510, color: 'Đỏ', seats: 5 },
  },

  // Thêm mới
  {
    _id: 'prod004',
    seller_id: 'user04',
    brand_id: 'brand_tesla',
    model_id: 'model_model3',
    title: 'Tesla Model 3 Standard Range 2021',
    description: 'Xe nhập Mỹ, đã qua sử dụng 2 năm, pin zin chưa thay.',
    price: 950000000,
    condition: 'good',
    status: 'active',
    location: { city: 'TP. Hồ Chí Minh', district: 'Bình Thạnh' },
    images: [
      'https://cdn-bodfj.nitrocdn.com/PkAzgiiWmWHBbfSpqeQLrEoLMQsjWQTV/assets/images/optimized/rev-08e74e5/wp-content/uploads/2023/01/tesla-model-3.jpg',

    ],
    is_verified: true,
    is_featured: true,
    views: 3100,
    created_at: new Date().toISOString(),
    ev_details: { mileage: 30000, year_of_manufacture: 2021, battery_capacity: 60, range: 410, color: 'Đen', seats: 5 },
  },
  {
    _id: 'prod005',
    seller_id: 'user05',
    brand_id: 'brand_hyundai',
    model_id: 'model_ioniq5',
    title: 'Hyundai Ioniq 5 bản tiêu chuẩn 2022',
    description: 'Xe gia đình, bảo dưỡng định kỳ, màu bạc thời trang.',
    price: 890000000,
    condition: 'like_new',
    status: 'active',
    location: { city: 'Hà Nội', district: 'Ba Đình' },
    images: [
      'https://greencarscompare.com/upload/iblock/dcd/9ba848mebia59ui6w1gc6s3t2q5ots1i.jpg',

    ],
    is_verified: true,
    is_featured: false,
    views: 1900,
    created_at: new Date().toISOString(),
    ev_details: { mileage: 18000, year_of_manufacture: 2022, battery_capacity: 72, range: 480, color: 'Bạc', seats: 5 },
  },
  {
    _id: 'prod006',
    seller_id: 'user01',
    brand_id: 'brand_vines',
    model_id: 'model_vines_pin',
    title: 'Pin VinES 42Ah cho Vinfast Feliz S',
    description: 'Pin tháo xe mới, tình trạng như mới, còn bảo hành 11 tháng.',
    price: 4500000,
    condition: 'like_new',
    status: 'active',
    location: { city: 'Hải Phòng', district: 'Lê Chân' },
    images: ['https://tse4.mm.bing.net/th/id/OIP.Ys8Ifyb_H7O2bzVUKuNM_wHaE8?rs=1&pid=ImgDetMain&o=7&rm=3'],
    is_verified: true,
    is_featured: false,
    views: 750,
    created_at: new Date().toISOString(),
    battery_details: { capacity: 42, state_of_health: 98, cycle_count: 60 },
  },
  {
    _id: 'prod007',
    seller_id: 'user02',
    brand_id: 'brand_nissan',
    model_id: 'model_leaf',
    title: 'Nissan Leaf 2019 đã qua sử dụng',
    description: 'Xe chạy gia đình, pin thay mới 2023.',
    price: 520000000,
    condition: 'fair',
    status: 'active',
    location: { city: 'TP. Hồ Chí Minh', district: 'Thủ Đức' },
    images: ['https://via.placeholder.com/800x600.png/9B59B6/FFFFFF?text=Nissan+Leaf'],
    is_verified: false,
    is_featured: false,
    views: 1100,
    created_at: new Date().toISOString(),
    ev_details: { mileage: 60000, year_of_manufacture: 2019, battery_capacity: 40, range: 270, color: 'Tím', seats: 5 },
  },
  {
    _id: 'prod008',
    seller_id: 'user03',
    brand_id: 'brand_catl',
    model_id: 'model_catl_ev',
    title: 'Pin CATL 60Ah tháo xe điện cũ',
    description: 'Pin tháo từ xe tải điện, dung lượng chuẩn.',
    price: 8000000,
    condition: 'good',
    status: 'active',
    location: { city: 'Bình Dương', district: 'Dĩ An' },
    images: ['https://via.placeholder.com/800x600.png/34495E/FFFFFF?text=CATL+Battery'],
    is_verified: false,
    is_featured: false,
    views: 560,
    created_at: new Date().toISOString(),
    battery_details: { capacity: 60, state_of_health: 92, cycle_count: 200 },
  },
  {
    _id: 'prod009',
    seller_id: 'user05',
    brand_id: 'brand_mg',
    model_id: 'model_zsev',
    title: 'MG ZS EV 2020 màu trắng',
    description: 'Xe nhập Thái Lan, sử dụng gia đình.',
    price: 630000000,
    condition: 'good',
    status: 'active',
    location: { city: 'Cần Thơ', district: 'Ninh Kiều' },
    images: ['https://truonghungcar.com/wp-content/uploads/2022/12/z3992388723576_0e26f4ff853af0c2592e3e3f130dd04e.webp', 'https://tse2.mm.bing.net/th/id/OIP.Fn3dvxZl3paopHZfg6UxKQHaFj?pid=ImgDet&w=474&h=355&rs=1&o=7&rm=3', 'https://tse3.mm.bing.net/th/id/OIP.JDVZsg_dyY0YNMsTqRVRIAHaFj?pid=ImgDet&w=474&h=355&rs=1&o=7&rm=3', 'https://tse4.mm.bing.net/th/id/OIP.ZLZNcqgXo_xvRnQAF7-fdAHaFj?pid=ImgDet&w=474&h=355&rs=1&o=7&rm=3'],
    is_verified: true,
    is_featured: false,
    views: 870,
    created_at: new Date().toISOString(),
    ev_details: { mileage: 40000, year_of_manufacture: 2020, battery_capacity: 44.5, range: 263, color: 'Trắng', seats: 5 },
  },
  {
    _id: 'prod010',
    seller_id: 'user04',
    brand_id: 'brand_panasonic',
    model_id: 'model_panasonic_pack',
    title: 'Pack pin Panasonic 2170 cells',
    description: 'Pin tháo Tesla Model S, dung lượng lớn, thích hợp tái sử dụng.',
    price: 15000000,
    condition: 'fair',
    status: 'active',
    location: { city: 'Hà Nội', district: 'Hoàn Kiếm' },
    images: [
      'https://energy.panasonic.com/na/business/products/lithium-ion'  
    ],
    is_verified: false,
    is_featured: false,
    views: 430,
    created_at: new Date().toISOString(),
    battery_details: { capacity: 75, state_of_health: 85, cycle_count: 400 },
  },
  {
    _id: '6515a8b5e7c8a5b8e4e6b1c4',
    seller_id: 'user01',
    brand_id: 'brand_tesla',
    model_id: 'model_y',
    title: 'Tesla Model Y 2022 màu đen còn mới',
    description: 'Cần bán gấp Tesla Model Y, xe ít đi, chủ yếu trùm mền. ODO chỉ 5000km.',
    price: 1450000000,
    condition: 'like_new',
    status: 'pending', // <-- TIN CHỜ DUYỆT
    location: { city: 'Hà Nội', district: 'Tây Hồ' },
    images: ['https://via.placeholder.com/800x600.png/34495E/FFFFFF?text=Tesla+Y'],
    is_verified: false, is_featured: false, views: 0,
    created_at: new Date().toISOString(),
    ev_details: { mileage: 5000, year_of_manufacture: 2022, battery_capacity: 75, range: 530 },
  },
   {
    _id: '6515a8b5e7c8a5b8e4e6b1c5',
    seller_id: 'user02',
    brand_id: 'brand_byd',
    model_id: 'model_atto3',
    title: 'BYD Atto 3 2023',
    description: 'Thông tin không rõ ràng, giá quá thấp',
    price: 200000000,
    condition: 'good',
    status: 'rejected', // <-- TIN BỊ TỪ CHỐI
    location: { city: 'Hải Phòng', district: 'Lê Chân' },
    images: ['https://via.placeholder.com/800x600.png/95A5A6/FFFFFF?text=BYD'],
    is_verified: false, is_featured: false, views: 10,
    created_at: new Date().toISOString(),
    ev_details: { mileage: 10000, year_of_manufacture: 2023, battery_capacity: 60, range: 480 },
  },
];
let mockUsers: User[] = [
   { _id: 'user01', full_name: 'Lê Minh Tuấn', avatar_url: 'https://i.pravatar.cc/150?u=user01', role: 'member', status: 'active', email: 'tuan@demo.com' },
   { _id: 'user02', full_name: 'Trần Thị Bích', avatar_url: 'https://i.pravatar.cc/150?u=user02', role: 'member', status: 'active', email: 'bich@demo.com' },
   { _id: 'user03', full_name: 'Nguyễn Văn Hùng', avatar_url: 'https://i.pravatar.cc/150?u=user03', role: 'member', status: 'active', email: 'hung@demo.com' },
  { _id: 'user04', full_name: 'Phạm Văn Đồng', email: 'dong.pv@example.com', role: 'member', status: 'suspended', avatar_url: 'https://i.pravatar.cc/150?u=user04' },
  { _id: 'user05', full_name: 'Hồ Thị Mai', email: 'mai.ht@example.com', role: 'member', status: 'active', avatar_url: 'https://i.pravatar.cc/150?u=user05' },
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
    
    if (email === 'admin@example.com' && password === 'admin123') {
      return HttpResponse.json({
        success: true,
        message: 'Admin đăng nhập thành công',
        data: {
          user: {
            _id: 'admin001', email: 'admin@example.com', full_name: 'Quản trị viên', role: 'admin', status: 'active', avatar_url: 'https://i.pravatar.cc/150?u=admin'
          },
          token: 'fake-admin-jwt-token'
        }
      });
    }
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
        seller_id: sellerInfo, 
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
  http.get('http://localhost:5000/api/admin/dashboard/stats', () => {
    return HttpResponse.json({
      success: true,
      message: 'Lấy dữ liệu thống kê thành công',
      data: {
        totalUsers: 150,
        pendingListings: 12,
        totalTransactions: 340,
        totalRevenue: 56700000
      }
    })
  }),
  http.get('http://localhost:5000/api/admin/users', () => {
    return HttpResponse.json({
      success: true,
      message: 'Lấy danh sách người dùng thành công',
      data: mockUsers,
    });
  }),

  
  http.put('http://localhost:5000/api/admin/users/:id/status', async ({ request, params }) => {
    const { id } = params;
    const { status } = await request.json() as { status: 'active' | 'suspended' };

    
    let updatedUser: User | undefined;
    mockUsers = mockUsers.map(user => {
      if (user._id === id) {
        updatedUser = { ...user, status };
        return updatedUser;
      }
      return user;
    });

    if (updatedUser) {
      return HttpResponse.json({
        success: true,
        message: `Cập nhật trạng thái người dùng thành công!`,
        data: updatedUser,
      });
    }

    return HttpResponse.json({ success: false, message: 'Không tìm thấy người dùng' }, { status: 404 });
  }),
  http.get('http://localhost:5000/api/admin/listings', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as ListingStatus | null;
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const filteredData = status ? mockProducts.filter(p => p.status === status) : mockProducts;
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return HttpResponse.json({
      success: true,
      message: 'Lấy danh sách tin đăng thành công',
      data: paginatedData,
      pagination: { 
        page,
        limit,
        total: filteredData.length,
        pages: Math.ceil(filteredData.length / limit),
      }
    });
  }),
  
  http.put('http://localhost:5000/api/admin/listings/:id/status', async ({ request, params }) => {
    const { id } = params;
    const { status } = await request.json() as { status: 'active' | 'rejected' };

    let updatedListing: Product | undefined;
    
    mockProducts = mockProducts.map(p => {
        if (p._id === id) {
            updatedListing = { ...p, status };
            return updatedListing;
        }
        return p;
    });

    if (updatedListing) return HttpResponse.json({ success: true, data: updatedListing });
    return HttpResponse.json({ success: false, message: 'Không tìm thấy' }, { status: 404 });
  }),

  http.put('http://localhost:5000/api/admin/listings/:id/verify', async ({ request, params }) => {
    const { id } = params;
    const { is_verified } = await request.json() as { is_verified: boolean };

    let updatedListing: Product | undefined;

    // Gán lại kết quả của .map() cho mảng mockProducts để lưu thay đổi
    mockProducts = mockProducts.map(p => {
        if (p._id === id) {
            updatedListing = { ...p, is_verified };
            return updatedListing;
        }
        return p;
    });

    if (updatedListing) return HttpResponse.json({ success: true, data: updatedListing });
    return HttpResponse.json({ success: false, message: 'Không tìm thấy' }, { status: 404 });
  }),

];