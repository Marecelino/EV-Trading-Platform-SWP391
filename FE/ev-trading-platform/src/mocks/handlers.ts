// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import type { Product, User, ITransaction, Auction, Bid, Review } from '../types';


let mockUsers: User[] = [
    { _id: 'user01', full_name: 'Lê Minh Tuấn', avatar_url: 'https://i.pravatar.cc/150?u=user01', role: 'member', status: 'active', email: 'tuan@demo.com' },
    { _id: 'user02', full_name: 'Trần Thị Bích', avatar_url: 'https://i.pravatar.cc/150?u=user02', role: 'member', status: 'active', email: 'bich@demo.com' },
    { _id: 'user03', full_name: 'Nguyễn Văn Hùng', avatar_url: 'https://i.pravatar.cc/150?u=user03', role: 'member', status: 'active', email: 'hung@demo.com' },
    { _id: 'user04', full_name: 'Phạm Văn Đồng', email: 'dong.pv@example.com', role: 'member', status: 'suspended', avatar_url: 'https://i.pravatar.cc/150?u=user04' },
    { _id: 'user05', full_name: 'Hồ Thị Mai', email: 'mai.ht@example.com', role: 'member', status: 'active', avatar_url: 'https://i.pravatar.cc/150?u=user05' },
    { _id: 'admin001', full_name: 'Quản trị viên', email: 'admin@example.com', role: 'admin', status: 'active', avatar_url: 'https://i.pravatar.cc/150?u=admin' },
    { _id: 'user06', full_name: 'Đặng Thị Lan', email: 'lan.dt@example.com', role: 'member', status: 'active', avatar_url: 'https://i.pravatar.cc/150?u=user06' },
    { _id: 'user07', full_name: 'Võ Thành Trung', email: 'trung.vt@example.com', role: 'member', status: 'active', avatar_url: 'https://i.pravatar.cc/150?u=user07' },
    { _id: 'user08', full_name: 'Bùi Minh Anh', email: 'anh.bm@example.com', role: 'member', status: 'active', avatar_url: 'https://i.pravatar.cc/150?u=user08' },
    { _id: 'user09', full_name: 'Lý Hoàng Phúc', email: 'phuc.lh@example.com', role: 'member', status: 'suspended', avatar_url: 'https://i.pravatar.cc/150?u=user09' },
    { _id: 'user10', full_name: 'Mai Thị Thảo', email: 'thao.mt@example.com', role: 'member', status: 'active', avatar_url: 'https://i.pravatar.cc/150?u=user10' },
];

let mockProducts: Product[] = [
  // CẬP NHẬT: Thêm listing_type và auction_id cho tất cả sản phẩm
  {
    _id: '6515a8b5e7c8a5b8e4e6b1c1',
    seller_id: 'user01',
    brand_id: 'brand_vinfast',
    model_id: 'model_vf8',
    title: 'Vinfast VF8 Eco 2023 còn như mới, ODO siêu lướt',
    description: 'Xe gia đình sử dụng kỹ, còn mới 99%. Bảo hành chính hãng còn dài đến 2030.',
    price: 850000000,
    listing_type: 'direct_sale', // Bán trực tiếp
    auction_id: undefined,
    condition: 'like_new',
    status: 'active',
    location: { city: 'TP. Hồ Chí Minh', district: 'Quận 1' },
    images: [ 'https://storage.googleapis.com/vinfast-data-01/Xe-SUV-VinFast-VF-8-so-huu-ngoai-that-sang-trong-thiet-ke-hop-voi-noi-thanh_1663170557.jpg', 'https://storage.googleapis.com/vinfast-data-01/Ngo%E1%BA%A1i%20th%E1%BA%A5t%20VF%208_1642069586.jpg', 'https://th.bing.com/th/id/R.c14328fc2b9e090942e72e8268d9f50c?rik=CTXsOEB33fglsg&pid=ImgRaw&r=0', 'https://images2.thanhnien.vn/Uploaded/chicuong/2022_09_20/307648302-5401989936547901-8526041155941997652-n-8186.jpg' ],
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
    listing_type: 'direct_sale',
    auction_id: undefined,
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
    listing_type: 'direct_sale',
    auction_id: undefined,
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
  {
    _id: 'prod004',
    seller_id: 'user04',
    brand_id: 'brand_tesla',
    model_id: 'model_model3',
    title: 'Tesla Model 3 Standard Range 2021',
    description: 'Xe nhập Mỹ, đã qua sử dụng 2 năm, pin zin chưa thay.',
    price: 950000000,
    listing_type: 'direct_sale',
    auction_id: undefined,
    condition: 'good',
    status: 'active',
    location: { city: 'TP. Hồ Chí Minh', district: 'Bình Thạnh' },
    images: [ 'https://cdn-bodfj.nitrocdn.com/PkAzgiiWmWHBbfSpqeQLrEoLMQsjWQTV/assets/images/optimized/rev-08e74e5/wp-content/uploads/2023/01/tesla-model-3.jpg' ],
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
    listing_type: 'direct_sale',
    auction_id: undefined,
    condition: 'like_new',
    status: 'active',
    location: { city: 'Hà Nội', district: 'Ba Đình' },
    images: [ 'https://greencarscompare.com/upload/iblock/dcd/9ba848mebia59ui6w1gc6s3t2q5ots1i.jpg' ],
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
    listing_type: 'direct_sale',
    auction_id: undefined,
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
    listing_type: 'direct_sale',
    auction_id: undefined,
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
    listing_type: 'direct_sale',
    auction_id: undefined,
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
    listing_type: 'direct_sale',
    auction_id: undefined,
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
    listing_type: 'direct_sale',
    auction_id: undefined,
    condition: 'fair',
    status: 'active',
    location: { city: 'Hà Nội', district: 'Hoàn Kiếm' },
    images: [ 'https://energy.panasonic.com/na/business/products/lithium-ion' ],
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
    listing_type: 'direct_sale',
    auction_id: undefined,
    condition: 'like_new',
    status: 'pending',
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
    listing_type: 'direct_sale',
    auction_id: undefined,
    condition: 'good',
    status: 'rejected',
    location: { city: 'Hải Phòng', district: 'Lê Chân' },
    images: ['https://via.placeholder.com/800x600.png/95A5A6/FFFFFF?text=BYD'],
    is_verified: false, is_featured: false, views: 10,
    created_at: new Date().toISOString(),
    ev_details: { mileage: 10000, year_of_manufacture: 2023, battery_capacity: 60, range: 480 },
  },
  { _id: 'prod011', seller_id: 'user06', brand_id: 'brand_vinfast', model_id: 'model_vf9', title: 'Vinfast VF9 6 chỗ bản Plus', description: 'Bản cao cấp nhất, nội thất da, ODO 8000km.', price: 1850000000, listing_type: 'direct_sale', auction_id: undefined, condition: 'like_new', status: 'pending', location: { city: 'TP. Hồ Chí Minh', district: 'Quận 7' }, images: ['https://via.placeholder.com/800x600.png/16A085/FFFFFF?text=VF9'], is_verified: false, is_featured: true, views: 20, created_at: new Date('2025-09-18T22:00:00Z').toISOString(), ev_details: { mileage: 8000, year_of_manufacture: 2023, battery_capacity: 92, range: 438, color: 'Xanh rêu', seats: 6 }, },
  { _id: 'prod012', seller_id: 'user07', brand_id: 'brand_porsche', model_id: 'model_taycan', title: 'Porsche Taycan 4S 2021', description: 'Xe thể thao điện hiệu năng cao, màu xanh Gentian.', price: 4100000000, listing_type: 'direct_sale', auction_id: undefined, condition: 'good', status: 'active', location: { city: 'TP. Hồ Chí Minh', district: 'Quận 2' }, images: ['https://via.placeholder.com/800x600.png/2980B9/FFFFFF?text=Taycan'], is_verified: true, is_featured: true, views: 5500, created_at: new Date('2025-09-17T14:00:00Z').toISOString(), ev_details: { mileage: 28000, year_of_manufacture: 2021, battery_capacity: 93.4, range: 463, color: 'Xanh Gentian', seats: 4 }, },
  { _id: 'prod013', seller_id: 'user08', brand_id: 'brand_mercedes', model_id: 'model_eqs', title: 'Mercedes EQS 580 4MATIC 2023', description: 'Sedan điện hạng sang, nội thất Hyperscreen, ODO 3000km.', price: 4900000000, listing_type: 'direct_sale', auction_id: undefined, condition: 'like_new', status: 'active', location: { city: 'Hà Nội', district: 'Long Biên' }, images: ['https://via.placeholder.com/800x600.png/2C3E50/FFFFFF?text=EQS'], is_verified: true, is_featured: false, views: 2800, created_at: new Date('2025-09-16T19:00:00Z').toISOString(), ev_details: { mileage: 3000, year_of_manufacture: 2023, battery_capacity: 107.8, range: 676, color: 'Đen', seats: 5 }, },
  { _id: 'prod014', seller_id: 'user10', brand_id: 'brand_byd', model_id: 'model_dolphin', title: 'BYD Dolphin 2023 giá tốt', description: 'Xe nhỏ gọn cho đô thị, tiết kiệm năng lượng.', price: 550000000, listing_type: 'direct_sale', auction_id: undefined, condition: 'like_new', status: 'pending', location: { city: 'Bình Dương', district: 'Thủ Dầu Một' }, images: ['https://via.placeholder.com/800x600.png/E67E22/FFFFFF?text=Dolphin'], is_verified: false, is_featured: false, views: 5, created_at: new Date('2025-09-15T09:00:00Z').toISOString(), ev_details: { mileage: 9000, year_of_manufacture: 2023, battery_capacity: 44.9, range: 405, color: 'Hồng', seats: 5 }, },
];

let mockTransactions: ITransaction[] = [
  {
    _id: 'txn_001',
    listing_id: mockProducts[0],
    buyer_id: mockUsers[1],
    seller_id: mockUsers[0],
    amount: 850000000,
    status: 'pending',
    created_at: new Date('2025-09-29T10:00:00Z').toISOString(),
  },
  {
    _id: 'txn_002',
    listing_id: mockProducts[2], // Kia EV6
    buyer_id: mockUsers[0],
    seller_id: mockUsers[2],
    amount: 1250000000,
    status: 'completed',
    created_at: new Date('2025-09-28T14:30:00Z').toISOString(),
    transaction_date: new Date('2025-09-29T18:00:00Z').toISOString(),
  },
  {
    _id: 'txn_003',
    listing_id: mockProducts[1], // Pin LG
    buyer_id: mockUsers[2],
    seller_id: mockUsers[1],
    amount: 5500000,
    status: 'cancelled',
    created_at: new Date('2025-09-27T08:00:00Z').toISOString(),
  },
  { _id: 'txn_004', listing_id: mockProducts[3], buyer_id: mockUsers[5], seller_id: mockUsers[3], amount: 950000000, status: 'completed', created_at: new Date('2025-09-26T11:00:00Z').toISOString(), transaction_date: new Date('2025-09-27T10:00:00Z').toISOString() },
  { _id: 'txn_005', listing_id: mockProducts[4], buyer_id: mockUsers[6], seller_id: mockUsers[4], amount: 890000000, status: 'pending', created_at: new Date('2025-09-25T16:00:00Z').toISOString() },
  { _id: 'txn_006', listing_id: mockProducts[5], buyer_id: mockUsers[7], seller_id: mockUsers[0], amount: 4500000, status: 'completed', created_at: new Date('2025-09-24T13:00:00Z').toISOString(), transaction_date: new Date('2025-09-25T09:00:00Z').toISOString() },
  { _id: 'txn_007', listing_id: mockProducts[6], buyer_id: mockUsers[8], seller_id: mockUsers[1], amount: 520000000, status: 'cancelled', created_at: new Date('2025-09-23T19:00:00Z').toISOString() },
  { _id: 'txn_008', listing_id: mockProducts[8], buyer_id: mockUsers[9], seller_id: mockUsers[4], amount: 630000000, status: 'completed', created_at: new Date('2025-09-22T21:00:00Z').toISOString(), transaction_date: new Date('2025-09-23T15:00:00Z').toISOString() },
  { _id: 'txn_009', listing_id: mockProducts[13], buyer_id: mockUsers[0], seller_id: mockUsers[7], amount: 4100000000, status: 'pending', created_at: new Date('2025-09-21T15:00:00Z').toISOString() },
  { _id: 'txn_010', listing_id: mockProducts[14], buyer_id: mockUsers[1], seller_id: mockUsers[8], amount: 4900000000, status: 'completed', created_at: new Date('2025-09-20T20:00:00Z').toISOString(), transaction_date: new Date('2025-09-21T18:00:00Z').toISOString() },
];
let mockReviews: Review[] = [
  { _id: 'rev001', reviewer_id: 'user02', reviewee_id: 'user01', rating: 5, comment: 'Người bán nhiệt tình, xe đúng mô tả.', created_at: new Date().toISOString() },
  { _id: 'rev002', reviewer_id: 'user03', reviewee_id: 'user01', rating: 4, comment: 'Giao dịch nhanh, tuy nhiên xe có vài vết xước nhỏ không báo trước.', created_at: new Date().toISOString() },
  { _id: 'rev003', reviewer_id: 'user01', reviewee_id: 'user02', rating: 5, comment: 'Người mua nhanh gọn, uy tín!', created_at: new Date().toISOString() },
  { _id: 'rev004', reviewer_id: 'user04', reviewee_id: 'user03', rating: 5, comment: 'Sản phẩm tốt, đóng gói cẩn thận.', created_at: new Date().toISOString() },
];
let mockFavorites = [
    { _id: 'fav001', user_id: 'user01', listing_id: '6515a8b5e7c8a5b8e4e6b1c3' }, // User Lê Minh Tuấn thích Kia EV6
];
let mockAuctions: Auction[] = [
  {
    _id: 'auction001',
    listing_id: '6515a8b5e7c8a5b8e4e6b1c1', // Vinfast VF8
    seller_id: 'user01',
    start_time: new Date('2025-10-08T10:00:00Z').toISOString(),
    end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Kết thúc sau 2 ngày
    starting_price: 800000000,
    current_price: 815000000,
    min_increment: 5000000,
    buy_now_price: 900000000,
    status: 'live',
    bids: [
      { _id: 'bid01', user_id: 'user02', amount: 815000000, created_at: new Date().toISOString() },
      { _id: 'bid02', user_id: 'user03', amount: 810000000, created_at: new Date().toISOString() },
    ]
  },
];
// Cập nhật mockProducts để có tin đấu giá
mockProducts[0].listing_type = 'auction';
mockProducts[0].auction_id = 'auction001';
const getUserIdFromToken = (request: Request): string | null => {
  const authorization = request.headers.get('Authorization');
  if (authorization && authorization.startsWith('Bearer fake-jwt-token-for-')) {
    return authorization.replace('Bearer fake-jwt-token-for-', '');
  }
  return null;
}
const getAverageRating = (userId: string) => {
  const userReviews = mockReviews.filter(r => r.reviewee_id === userId);
  if (userReviews.length === 0) return undefined; // Trả về undefined nếu chưa có đánh giá

  const totalRating = userReviews.reduce((sum, review) => sum + review.rating, 0);
  return {
    average: totalRating / userReviews.length,
    count: userReviews.length,
  };
};
const populateSeller = (product: Product): Product => {
  const seller = mockUsers.find(u => u._id === product.seller_id);
  if (seller) {
    // Gắn thêm thông tin rating đã tính toán vào object seller
    const rating = getAverageRating(seller._id);
    const populatedSeller = { ...seller, rating };
    return { ...product, seller_id: populatedSeller };
  }
  return product;
};
export const handlers = [
  // GET /api/listings
  http.get('http://localhost:5000/api/listings', () => {
    console.log('MSW: Handling request for all listings');
    const activeProducts = mockProducts.filter(p => p.status === 'active');
    const populatedProducts = activeProducts.map(populateSeller);
    return HttpResponse.json({
      success: true,
      message: 'Lấy danh sách tin đăng thành công!',
      data: populatedProducts,
      pagination: {
        page: 1, limit: 10, total: mockProducts.length, pages: 1,
      }
    });
  }),
  // POST /api/auth/login
  http.post('http://localhost:5000/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as Record<string, unknown>;
    const user = mockUsers.find(u => u.email === email);

    if (!user) {
      return HttpResponse.json({ success: false, message: 'Email hoặc mật khẩu không chính xác.' }, { status: 401 });
    }

    const isAdminLogin = user.role === 'admin' && password === 'admin123';
    const isMemberLogin = user.role === 'member' && password === '123456';

    if (isAdminLogin || isMemberLogin) {
      if (user.status === 'suspended') {
        return HttpResponse.json({ success: false, message: 'Tài khoản của bạn đã bị khóa.' }, { status: 403 });
      }
      return HttpResponse.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          user: user,
          token: `fake-jwt-token-for-${user._id}`
        }
      });
    } else {
      return HttpResponse.json({ success: false, message: 'Email hoặc mật khẩu không chính xác.' }, { status: 401 });
    }
  }),
  http.get('http://localhost:5000/api/listings/my*', ({ request }) => {
    // Lấy ID người dùng từ token một cách linh hoạt
    const currentUserId = getUserIdFromToken(request);

    // Nếu không có token hợp lệ, trả về lỗi
    if (!currentUserId) {
      return HttpResponse.json(
        { success: false, message: 'Yêu cầu không hợp lệ, thiếu thông tin xác thực.' },
        { status: 401 }
      );
    }

    // Lấy tham số `status` từ URL (ví dụ: ?status=active)
    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    // Lọc các tin đăng thuộc về đúng người dùng đã xác thực
    let userListings = mockProducts.filter(p => p.seller_id === currentUserId);

    // Nếu có tham số status, tiếp tục lọc theo status
    if (status) {
      userListings = userListings.filter(p => p.status === status);
    }

    // Trả về dữ liệu đã lọc với status 200 OK
    return HttpResponse.json({
      success: true,
      message: 'Lấy tin đăng cá nhân thành công',
      data: userListings,
    });
  }),
  http.get('http://localhost:5000/api/listings/:id', ({ params }) => {
    const { id } = params;
    console.log('MSW: Handling request for product ID:', id);
    const product = mockProducts.find(p => p._id === id);

    if (product) {
      const populatedProduct = populateSeller(product);
      return HttpResponse.json({
        success: true,
        message: 'Lấy chi tiết tin đăng thành công!',
        data: populatedProduct,
      });
    } else {
      return HttpResponse.json({
        success: false,
        message: 'Không tìm thấy tin đăng',
      }, { status: 404 });
    }
  }),

  http.get('http://localhost:5000/api/admin/dashboard/stats', () => {
    const totalUsers = mockUsers.length;
    const pendingListings = mockProducts.filter(p => p.status === 'pending').length;
    const totalTransactions = mockTransactions.length;
    const totalRevenue = mockTransactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    return HttpResponse.json({
      success: true,
      message: 'Lấy dữ liệu thống kê thành công',
      data: {
        totalUsers,
        pendingListings,
        totalTransactions,
        totalRevenue,
      }
    });
  }),

  http.get('http://localhost:5000/api/admin/dashboard/trends', () => {
    return HttpResponse.json({
      success: true,
      data: {
        labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'],
        datasets: [
          {
            label: 'Lượng tin đăng mới',
            data: [65, 59, 80, 81, 56, 55],
            borderColor: 'rgb(39, 174, 96)',
            backgroundColor: 'rgba(39, 174, 96, 0.2)',
            yAxisID: 'y',
          },
          {
            label: 'Giá trung bình (Triệu VND)',
            data: [850, 870, 865, 890, 910, 900],
            borderColor: 'rgb(52, 152, 219)',
            backgroundColor: 'rgba(52, 152, 219, 0.2)',
            yAxisID: 'y1',
          },
        ],
      }
    });
  }),

  http.get('http://localhost:5000/api/admin/users', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '5');

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = mockUsers.slice(startIndex, endIndex);

    return HttpResponse.json({
      success: true,
      message: 'Lấy danh sách người dùng thành công',
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: mockUsers.length,
        pages: Math.ceil(mockUsers.length / limit),
      }
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
    const status = url.searchParams.get('status') as 'pending' | 'active' | 'sold' | 'rejected' | null;
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

  http.get('http://localhost:5000/api/admin/transactions', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 3;

    const filteredData = status ? mockTransactions.filter(t => t.status === status) : mockTransactions;

    const paginatedData = filteredData.slice((page - 1) * limit, page * limit);

    return HttpResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        page, limit, total: filteredData.length, pages: Math.ceil(filteredData.length / limit),
      }
    });
  }),
  //post product for seller 
  // CẬP NHẬT HANDLER TẠO TIN ĐĂNG
  http.post('http://localhost:5000/api/listings', async ({ request }) => {
    const newListingData = await request.json() as Partial<Product>;

    // Sử dụng helper function để lấy ID người bán từ token
    const sellerId = getUserIdFromToken(request);

    if (!sellerId) {
      return HttpResponse.json({ success: false, message: 'Yêu cầu không hợp lệ, thiếu thông tin xác thực.' }, { status: 401 });
    }

    const createdListing: Product = {
      _id: `prod_${Date.now()}`,
      brand_id: newListingData.brand_id || '',
      model_id: newListingData.model_id || '',
      title: newListingData.title || '',
      description: newListingData.description || '',
      price: newListingData.price || 0,
      condition: newListingData.condition || 'good',
      location: newListingData.location || { city: '', district: '' },
      images: newListingData.images || [],
      ev_details: newListingData.ev_details,
      battery_details: newListingData.battery_details,
      seller_id: sellerId, // Gán ID người bán đã xác thực
      status: 'pending',
      views: 0,
      is_verified: false,
      is_featured: false,
      created_at: new Date().toISOString(),
    };
    mockProducts.unshift(createdListing);
    return HttpResponse.json({ success: true, message: 'Đăng tin thành công!', data: createdListing }, { status: 201 });
  }),
  // HANDLER MỚI: Đăng ký tài khoản
  http.post('http://localhost:5000/api/auth/register', async ({ request }) => {
    const { fullName, email } = await request.json() as { fullName: string; email: string };
    // Giả lập kiểm tra email tồn tại
    if (email === 'member@example.com') {
      return HttpResponse.json({ success: false, message: 'Email đã được sử dụng.' }, { status: 400 });
    }
    return HttpResponse.json({
      success: true,
      message: 'Đăng ký thành công!',
      data: {
        user: { _id: `user_${Date.now()}`, email, full_name: fullName, role: 'member', status: 'active' },
        token: 'fake-new-user-jwt-token'
      }
    }, { status: 201 });
  }),
  // HANDLER MỚI: Lấy thông tin cá nhân của người dùng đang đăng nhập
  http.get('http://localhost:5000/api/auth/profile', ({ request }) => {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return HttpResponse.json({ success: false, message: 'Xác thực thất bại' }, { status: 401 });
    }
    const user = mockUsers.find(u => u._id === userId);
    return HttpResponse.json({ success: true, data: user });
  }),

  // HANDLER MỚI: Lấy lịch sử giao dịch của người dùng đang đăng nhập
  http.get('http://localhost:5000/api/transactions/my', ({ request }) => {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return HttpResponse.json({ success: false, message: 'Xác thực thất bại' }, { status: 401 });
    }
    const userTransactions = mockTransactions.filter(t => t.buyer_id._id === userId || t.seller_id._id === userId);
    return HttpResponse.json({ success: true, data: userTransactions });
  }),
  // HANDLER MỚI: Cập nhật thông tin cá nhân
  http.put('http://localhost:5000/api/auth/profile', async ({ request }) => {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return HttpResponse.json({ success: false, message: 'Xác thực thất bại' }, { status: 401 });
    }

    const updatedData = await request.json() as Partial<User> & { newPassword?: string };

    // Giả lập việc backend xử lý mật khẩu
    if (updatedData.newPassword) {
      console.log(`[Mock API] Nhận được yêu cầu đổi mật khẩu cho user ${userId}. Mật khẩu mới: ${updatedData.newPassword}`);
      // Xóa trường mật khẩu đi để không lưu vào user object
      delete updatedData.newPassword;
    }

    let updatedUser: User | undefined;

    mockUsers = mockUsers.map(user => {
      if (user._id === userId) {
        // Cập nhật các trường còn lại như full_name, phone, avatar_url
        updatedUser = { ...user, ...updatedData };
        return updatedUser;
      }
      return user;
    });

    if (updatedUser) {
      return HttpResponse.json({ success: true, message: 'Cập nhật thông tin thành công!', data: updatedUser });
    }

    return HttpResponse.json({ success: false, message: 'Không tìm thấy người dùng' }, { status: 404 });
  }),
  // HANDLER MỚI: Lấy danh sách yêu thích
  http.get('http://localhost:5000/api/favorites', ({ request }) => {
    const userId = getUserIdFromToken(request);
    if (!userId) return HttpResponse.json({ success: false }, { status: 401 });
    const userFavorites = mockFavorites.filter(fav => fav.user_id === userId);
    return HttpResponse.json({ success: true, data: userFavorites });
  }),

  // HANDLER MỚI: Thêm vào yêu thích
  http.post('http://localhost:5000/api/favorites', async ({ request }) => {
    const userId = getUserIdFromToken(request);
    const { listing_id } = await request.json() as { listing_id: string };
    if (!userId) return HttpResponse.json({ success: false }, { status: 401 });
    
    const newFavorite = { _id: `fav_${Date.now()}`, user_id: userId, listing_id };
    mockFavorites.push(newFavorite);
    return HttpResponse.json({ success: true, data: newFavorite }, { status: 201 });
  }),

  // HANDLER MỚI: Xóa khỏi yêu thích
  http.delete('http://localhost:5000/api/favorites/:listing_id', ({ request, params }) => {
    const userId = getUserIdFromToken(request);
    const { listing_id } = params;
    if (!userId) return HttpResponse.json({ success: false }, { status: 401 });

    mockFavorites = mockFavorites.filter(fav => !(fav.user_id === userId && fav.listing_id === listing_id));
    return HttpResponse.json({ success: true, message: 'Đã xóa khỏi danh sách yêu thích' });
  }),
  // HANDLER MỚI: Lấy chi tiết một phiên đấu giá
  http.get('http://localhost:5000/api/auctions/:id', ({ params }) => {
    const auction = mockAuctions.find(a => a._id === params.id);
    if (auction) {
      // Đính kèm thông tin sản phẩm
      const listing = mockProducts.find(p => p._id === auction.listing_id);
      return HttpResponse.json({ success: true, data: { ...auction, listing } });
    }
    return HttpResponse.json({ success: false, message: 'Not Found' }, { status: 404 });
  }),

  // HANDLER MỚI: Đặt giá
  http.post('http://localhost:5000/api/auctions/:id/bids', async ({ request, params }) => {
    const { amount } = await request.json() as { amount: number };
    const auction = mockAuctions.find(a => a._id === params.id);
    const userId = getUserIdFromToken(request) || 'user_anonymous';

    if (auction && amount > auction.current_price) {
      auction.current_price = amount;
      const newBid = { _id: `bid_${Date.now()}`, user_id: userId, amount, created_at: new Date().toISOString() };
      auction.bids.unshift(newBid);
      return HttpResponse.json({ success: true, message: 'Đặt giá thành công!', data: newBid });
    }
    return HttpResponse.json({ success: false, message: 'Giá đặt không hợp lệ' }, { status: 400 });
  }),
];