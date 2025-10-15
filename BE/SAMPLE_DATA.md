# Sample Data for Testing CRUD APIs in Swagger

## 1. Battery Details

### POST /battery-details
```json
{
  "listing_id": "507f1f77bcf86cd799439011",
  "chemistry": "lithium_ion",
  "capacity_kwh": 75.5,
  "soh_percent": 85,
  "cycle_count": 450,
  "voltage_v": 400,
  "weight_kg": 450.5,
  "origin": "China",
  "warranty_remaining_months": 24,
  "last_health_check": "2024-10-15T00:00:00.000Z",
  "temperature_range_min": -20,
  "temperature_range_max": 60,
  "charging_cycles_warranty": 3000,
  "degradation_rate_annual": 2.5
}
```

## 2. Brands

### POST /brands
```json
{
  "name": "Tesla",
  "description": "Thương hiệu xe điện hàng đầu thế giới",
  "logo_url": "https://example.com/tesla-logo.png",
  "website": "https://www.tesla.com",
  "country": "United States",
  "is_active": true,
  "listing_count": 0
}
```

### POST /brands (Example 2)
```json
{
  "name": "BYD",
  "description": "Hãng xe điện và pin hàng đầu Trung Quốc",
  "logo_url": "https://example.com/byd-logo.png",
  "website": "https://www.byd.com",
  "country": "China",
  "is_active": true
}
```

## 3. Categories

### POST /categories
```json
{
  "name": "Pin xe điện",
  "description": "Danh mục cho các loại pin xe điện và phụ kiện",
  "icon_url": "https://example.com/battery-icon.png",
  "is_active": true,
  "sort_order": 1
}
```

### POST /categories (Subcategory)
```json
{
  "name": "Pin Lithium Ion",
  "description": "Pin Lithium Ion cho xe điện",
  "icon_url": "https://example.com/lithium-icon.png",
  "parent_category": "507f1f77bcf86cd799439011",
  "is_active": true,
  "sort_order": 1
}
```

## 4. Commission Configs

### POST /commission-configs
```json
{
  "percentage": 5.5,
  "min_fee": 10000,
  "max_fee": 1000000,
  "effective_from": "2024-10-15T00:00:00.000Z",
  "effective_to": "2024-12-31T23:59:59.999Z",
  "is_active": true,
  "description": "Cấu hình hoa hồng cho giao dịch pin xe điện",
  "created_by": "admin001"
}
```

### POST /commission-configs/calculate
```json
{
  "transactionAmount": 10000000
}
```

## 5. Commissions

### POST /commissions
```json
{
  "transaction_id": "507f1f77bcf86cd799439011",
  "config_id": "507f1f77bcf86cd799439012",
  "percentage": 5.5,
  "amount": 500000,
  "status": "pending"
}
```

## Test Scenarios

### 1. Create a complete battery listing flow:
1. Create a brand (POST /brands)
2. Create a category (POST /categories)
3. Create a listing (existing endpoint)
4. Create battery details for the listing (POST /battery-details)

### 2. Commission calculation flow:
1. Create commission config (POST /commission-configs)
2. Calculate commission for a transaction (POST /commission-configs/calculate)
3. Create actual commission record (POST /commissions)
4. Mark commission as paid (PATCH /commissions/:id/mark-paid)

### 3. Test search and filter endpoints:
- GET /battery-details/by-chemistry/lithium_ion
- GET /battery-details/by-capacity?min=50&max=100
- GET /brands/active
- GET /categories/parent
- GET /commissions/pending
