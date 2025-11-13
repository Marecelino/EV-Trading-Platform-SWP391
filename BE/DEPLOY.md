# Hướng dẫn Deploy EV Trading Platform Backend lên Fly.io

Hướng dẫn chi tiết để deploy NestJS backend lên Fly.io (free tier) - luôn chạy, không sleep.

## 📋 Mục lục

1. [Yêu cầu](#yêu-cầu)
2. [Setup MongoDB Atlas (Free)](#setup-mongodb-atlas-free)
3. [Setup Fly.io](#setup-flyio)
4. [Cấu hình Environment Variables](#cấu-hình-environment-variables)
5. [Deploy](#deploy)
6. [Verify và Test](#verify-và-test)
7. [Troubleshooting](#troubleshooting)
8. [Frontend Configuration](#frontend-configuration)

---

## Yêu cầu

- GitHub account
- Email để đăng ký MongoDB Atlas và Fly.io
- Node.js 18+ (để test local trước khi deploy)

---

## Setup MongoDB Atlas (Free)

### Bước 1: Tạo Account MongoDB Atlas

1. Truy cập: https://www.mongodb.com/cloud/atlas/register
2. Đăng ký bằng email hoặc Google/GitHub
3. Xác thực email

### Bước 2: Tạo Cluster Free

1. Sau khi login, chọn **Build a Database**
2. Chọn **M0 FREE** (512MB storage - đủ cho dự án sinh viên)
3. Chọn **Cloud Provider**: AWS
4. Chọn **Region**: **Singapore (ap-southeast-1)** - gần VN nhất
5. Đặt tên cluster: `ev-trading-platform` (hoặc tên khác)
6. Click **Create**

### Bước 3: Tạo Database User

1. Trong màn hình **Security Quickstart**, tạo username và password
   - **Username**: `ev-platform-user` (hoặc tên khác)
   - **Password**: Tạo password mạnh (lưu lại để dùng sau)
2. Click **Create Database User**

### Bước 4: Whitelist IP Address

1. Trong phần **Network Access**, click **Add IP Address**
2. Chọn **Allow Access from Anywhere** (0.0.0.0/0)
   - Hoặc thêm IP cụ thể nếu muốn bảo mật hơn
3. Click **Confirm**

### Bước 5: Lấy Connection String

1. Click **Connect** trên cluster
2. Chọn **Connect your application**
3. Chọn **Driver**: Node.js, **Version**: 5.5 or later
4. Copy connection string, ví dụ:
   ```
   mongodb+srv://ev-platform-user:<password>@ev-trading-platform.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **Thay thế `<password>`** bằng password bạn đã tạo ở Bước 3
6. **Thêm database name** vào cuối URL:
   ```
   mongodb+srv://ev-platform-user:your-password@ev-trading-platform.xxxxx.mongodb.net/ev_battery_platform?retryWrites=true&w=majority
   ```
7. **Lưu connection string này** - sẽ dùng cho Fly.io

---

## Setup Fly.io

### Bước 1: Cài đặt Fly CLI

#### Windows (PowerShell - chạy với quyền Admin):

```powershell
# Mở PowerShell với quyền Administrator
iwr https://fly.io/install.ps1 -useb | iex
```

#### Mac/Linux:

```bash
curl -L https://fly.io/install.sh | sh
```

#### Verify installation:

```bash
fly version
```

### Bước 2: Đăng ký/Login Fly.io

1. Truy cập: https://fly.io/app/sign-up
2. Đăng ký bằng GitHub (khuyến nghị) hoặc email
3. Xác thực email nếu cần

### Bước 3: Login từ CLI

```bash
fly auth login
```

- Sẽ mở browser để xác thực
- Hoặc dùng token nếu có

---

## Cấu hình Environment Variables

### Bước 1: Tạo JWT Secret

Tạo một JWT secret mạnh (tối thiểu 32 ký tự):

```bash
# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Mac/Linux
openssl rand -base64 32
```

Hoặc dùng online generator: https://www.random.org/strings/

### Bước 2: Chuẩn bị các giá trị Environment Variables

| Variable | Giá trị | Mô tả |
|----------|---------|-------|
| `MONGODB_URL` | `mongodb+srv://...` | Connection string từ MongoDB Atlas |
| `JWT_SECRET` | `your-32-char-secret` | Secret key cho JWT (min 32 chars) |
| `JWT_EXPIRES_IN` | `604800` | Token expiration (7 days) |
| `NODE_ENV` | `production` | Environment |
| `PORT` | `3000` | Port (Fly.io sẽ tự set) |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | URL frontend (cho CORS) |
| `DEFAULT_ADMIN_EMAIL` | `admin@ev-platform.com` | Email admin (optional) |
| `DEFAULT_ADMIN_PASSWORD` | `SecurePassword123!` | Password admin (optional) |

**Lưu ý**: Nếu dùng VNPay hoặc OAuth, thêm các biến tương ứng.

---

## Deploy

### Bước 1: Tạo Fly.io App

```bash
# Di chuyển vào thư mục project
cd /path/to/EV-Trading-Platform-SWP391/BE

# Tạo app (chỉ lần đầu)
fly launch
```

**Khi được hỏi**:
- **App name**: `ev-trading-platform-be` (hoặc để mặc định)
- **Region**: `sin` (Singapore) - chọn số tương ứng
- **Postgres/Redis**: Chọn `No` (không cần)
- **Deploy now**: Chọn `No` (sẽ deploy sau khi set secrets)

### Bước 2: Set Environment Variables (Secrets)

```bash
# Set MongoDB connection string
fly secrets set MONGODB_URL="mongodb+srv://username:password@cluster.mongodb.net/ev_battery_platform?retryWrites=true&w=majority"

# Set JWT Secret
fly secrets set JWT_SECRET="your-32-character-secret-key-here"

# Set Frontend URL (thay bằng URL frontend của bạn)
fly secrets set FRONTEND_URL="https://your-frontend.vercel.app"

# Set Node Environment
fly secrets set NODE_ENV="production"

# Set JWT Expiration (optional - có default)
fly secrets set JWT_EXPIRES_IN="604800"

# Set Admin Account (optional)
fly secrets set DEFAULT_ADMIN_EMAIL="admin@ev-platform.com"
fly secrets set DEFAULT_ADMIN_PASSWORD="SecurePassword123!"

# Nếu dùng VNPay (optional)
fly secrets set VNPAY_TMN_CODE="your-tmn-code"
fly secrets set VNPAY_HASH_SECRET="your-hash-secret"
fly secrets set VNPAY_URL="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
fly secrets set VNPAY_RETURN_URL="https://ev-trading-platform-be.fly.dev/api/payment/vnpay-return"
fly secrets set VNPAY_IPN_URL="https://ev-trading-platform-be.fly.dev/api/payment/vnpay-ipn"

# Nếu dùng OAuth (optional)
fly secrets set GOOGLE_CLIENT_ID="your-google-client-id"
fly secrets set GOOGLE_CLIENT_SECRET="your-google-client-secret"
fly secrets set FACEBOOK_APP_ID="your-facebook-app-id"
fly secrets set FACEBOOK_APP_SECRET="your-facebook-app-secret"
```

**Lưu ý**: 
- Thay các giá trị trong dấu ngoặc kép bằng giá trị thực của bạn
- Không có khoảng trắng sau dấu `=` trong lệnh `fly secrets set`

### Bước 3: Deploy

```bash
# Deploy app
fly deploy
```

Quá trình deploy sẽ:
1. Build Docker image từ Dockerfile
2. Push image lên Fly.io
3. Start container
4. Health check

**Thời gian**: Khoảng 3-5 phút lần đầu.

### Bước 4: Xem Logs

```bash
# Xem logs real-time
fly logs

# Xem logs của một instance cụ thể
fly logs -a ev-trading-platform-be
```

### Bước 5: Lấy App URL

```bash
# Xem thông tin app
fly status

# Hoặc xem trong dashboard: https://fly.io/apps/ev-trading-platform-be
```

App URL sẽ có dạng: `https://ev-trading-platform-be.fly.dev`

---

## Verify và Test

### Bước 1: Test Health Check

```bash
# Test bằng curl
curl https://ev-trading-platform-be.fly.dev/api

# Hoặc mở browser
# https://ev-trading-platform-be.fly.dev/api
```

**Kết quả mong đợi**: Response 200 OK hoặc JSON response.

### Bước 2: Test Swagger Documentation

Mở browser:
```
https://ev-trading-platform-be.fly.dev/api/docs
```

Bạn sẽ thấy Swagger UI với tất cả API endpoints.

### Bước 3: Test API Endpoints

#### Test Register:

```bash
curl -X POST https://ev-trading-platform-be.fly.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "name": "Test User"
  }'
```

#### Test Login:

```bash
curl -X POST https://ev-trading-platform-be.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

### Bước 4: Test từ Frontend

1. Cấu hình frontend với API URL: `https://ev-trading-platform-be.fly.dev/api`
2. Test các chức năng: login, register, fetch listings, etc.

---

## Troubleshooting

### Lỗi: "Cannot connect to MongoDB"

**Nguyên nhân**: 
- MongoDB Atlas chưa whitelist IP
- Connection string sai
- Password có ký tự đặc biệt chưa encode

**Giải pháp**:
1. Kiểm tra Network Access trong MongoDB Atlas
2. Kiểm tra connection string (đã thay `<password>` chưa)
3. Encode password nếu có ký tự đặc biệt:
   ```bash
   # Ví dụ: password có @ thì encode thành %40
   ```

### Lỗi: "CORS error" từ frontend

**Nguyên nhân**: 
- `FRONTEND_URL` chưa set đúng
- Frontend URL không match với allowed origins

**Giải pháp**:
1. Kiểm tra `FRONTEND_URL` trong Fly.io secrets:
   ```bash
   fly secrets list
   ```
2. Update `FRONTEND_URL` nếu cần:
   ```bash
   fly secrets set FRONTEND_URL="https://your-actual-frontend-url.com"
   ```
3. Redeploy:
   ```bash
   fly deploy
   ```

### Lỗi: "App failed to start"

**Nguyên nhân**: 
- Thiếu environment variables
- Build error
- Port conflict

**Giải pháp**:
1. Xem logs:
   ```bash
   fly logs
   ```
2. Kiểm tra secrets:
   ```bash
   fly secrets list
   ```
3. Kiểm tra Dockerfile và fly.toml

### Lỗi: "Out of memory" hoặc "App crashed"

**Nguyên nhân**: 
- Free tier có giới hạn RAM

**Giải pháp**:
1. Kiểm tra resource usage:
   ```bash
   fly status
   ```
2. Scale up nếu cần (sẽ tốn phí):
   ```bash
   fly scale vm shared-cpu-1x --memory 512
   ```

### Xem thông tin chi tiết app

```bash
# Xem status
fly status

# Xem metrics
fly metrics

# Xem IP addresses
fly ips list

# SSH vào container (nếu cần debug)
fly ssh console
```

---

## Frontend Configuration

### 1. Tạo file `.env.production` trong frontend:

```env
VITE_API_URL=https://ev-trading-platform-be.fly.dev/api
VITE_FRONTEND_URL=https://your-frontend.vercel.app
```

### 2. Cấu hình API Client (React/Vue):

```typescript
// src/config/api.ts hoặc tương tự
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor để thêm token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 3. Deploy Frontend lên Vercel/Netlify:

- **Vercel**: https://vercel.com
- **Netlify**: https://netlify.com

Cả hai đều free và tự động deploy từ GitHub.

---

## Các lệnh Fly.io hữu ích

```bash
# Xem danh sách apps
fly apps list

# Xem logs
fly logs

# Xem status
fly status

# Restart app
fly apps restart ev-trading-platform-be

# Scale app (nếu cần)
fly scale count 1
fly scale vm shared-cpu-1x --memory 256

# Xem secrets
fly secrets list

# Set secret
fly secrets set KEY=value

# Unset secret
fly secrets unset KEY

# SSH vào container
fly ssh console

# Xem metrics
fly metrics

# Xem IP addresses
fly ips list
```

---

## Checklist trước khi deploy

- [ ] Đã tạo MongoDB Atlas cluster free
- [ ] Đã whitelist IP (0.0.0.0/0 hoặc IP cụ thể)
- [ ] Đã tạo database user
- [ ] Đã copy connection string và thay password
- [ ] Đã cài đặt Fly CLI
- [ ] Đã login Fly.io
- [ ] Đã tạo JWT secret (32+ ký tự)
- [ ] Đã test build local: `npm run build`
- [ ] Đã test production local: `npm run start:prod`
- [ ] Đã set tất cả environment variables
- [ ] Đã deploy thành công
- [ ] Đã test API endpoints
- [ ] Đã cấu hình frontend với API URL

---

## Lưu ý quan trọng

1. **Free Tier Limits**:
   - Fly.io: 3 shared-cpu-1x VMs, 3GB storage, 160GB bandwidth/tháng
   - MongoDB Atlas: 512MB storage, 1 cluster
   - Đủ cho dự án sinh viên/demo

2. **Security**:
   - Không commit `.env` files
   - Sử dụng secrets trong Fly.io
   - JWT secret phải mạnh (32+ ký tự)
   - MongoDB password phải mạnh

3. **Performance**:
   - Free tier có thể chậm hơn paid tier
   - Cold start có thể mất vài giây
   - Database connection có thể timeout nếu không dùng lâu

4. **Monitoring**:
   - Xem logs: `fly logs`
   - Xem metrics: `fly metrics`
   - Dashboard: https://fly.io/apps/ev-trading-platform-be

---

## Hỗ trợ

- Fly.io Docs: https://fly.io/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- NestJS Docs: https://docs.nestjs.com

---

**Chúc bạn deploy thành công! 🚀**

