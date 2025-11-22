# Deployment Guide - EV Trading Platform

Hướng dẫn chi tiết để deploy ứng dụng EV Trading Platform lên Vercel.

## 📋 Yêu cầu tiên quyết

1. **Tài khoản Vercel**: Đăng ký tại [vercel.com](https://vercel.com)
2. **Git Repository**: Code đã được push lên GitHub/GitLab/Bitbucket
3. **Backend API**: Backend đã được deploy và có thể truy cập từ internet

## 🚀 Các bước deploy

### Bước 1: Chuẩn bị Backend

1. **Deploy Backend** lên server (VPS, Heroku, Railway, Render, v.v.)
2. **Lấy URL Backend Production**:
   - Ví dụ: `https://api.yourdomain.com/api`
   - Hoặc: `https://your-backend.herokuapp.com/api`
3. **Cấu hình CORS** trên backend để cho phép domain Vercel:
   ```javascript
   // Backend CORS config
   origin: [
     'https://your-vercel-app.vercel.app',
     'https://your-custom-domain.com'
   ]
   ```

### Bước 2: Push code lên Git

```bash
# Đảm bảo tất cả thay đổi đã được commit
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Bước 3: Deploy lên Vercel

#### 3.1. Import Project

1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Chọn repository từ GitHub/GitLab/Bitbucket
4. Click **"Import"**

#### 3.2. Cấu hình Project

Vercel sẽ tự động phát hiện:
- **Framework Preset**: Vite
- **Root Directory**: `./` (project root)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

Kiểm tra các settings này phù hợp, hoặc sử dụng file `vercel.json` đã có sẵn.

#### 3.3. Cấu hình Environment Variables

**QUAN TRỌNG**: Đây là bước bắt buộc!

1. Trong màn hình cấu hình project, scroll xuống phần **"Environment Variables"**
2. Click **"Add"** và thêm biến sau:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `VITE_API_BASE_URL` | `https://your-backend-url.com/api` | Production, Preview, Development |

   **Ví dụ:**
   ```
   VITE_API_BASE_URL = https://api.yourdomain.com/api
   ```

3. Lặp lại cho cả 3 môi trường:
   - **Production**: Môi trường production
   - **Preview**: Môi trường preview (pull requests)
   - **Development**: Môi trường development

#### 3.4. Deploy

1. Click **"Deploy"**
2. Chờ quá trình build hoàn tất (thường 2-5 phút)
3. Kiểm tra build logs để đảm bảo không có lỗi

### Bước 4: Kiểm tra sau khi deploy

1. **Truy cập URL**: Vercel sẽ cung cấp URL như `https://your-project.vercel.app`
2. **Test các chức năng**:
   - ✅ Trang chủ load được
   - ✅ Login/Register hoạt động
   - ✅ API calls thành công (kiểm tra Network tab trong DevTools)
   - ✅ Navigation giữa các pages
   - ✅ Admin routes hoạt động (nếu có)
   - ✅ Authentication flow hoạt động đúng

### Bước 5: Cấu hình Custom Domain (Tùy chọn)

1. Vào **Settings** → **Domains**
2. Thêm domain của bạn
3. Cấu hình DNS theo hướng dẫn của Vercel
4. Chờ DNS propagate (thường 5-30 phút)

## 🔧 Troubleshooting

### Lỗi Build

**Problem**: Build fails với TypeScript errors
**Solution**: 
```bash
# Test build locally trước
npm run build
# Fix tất cả TypeScript errors
```

**Problem**: Build fails vì thiếu dependencies
**Solution**:
- Kiểm tra `package.json` có đầy đủ dependencies
- Xóa `node_modules` và `package-lock.json`, chạy lại `npm install`

### Lỗi Runtime

**Problem**: API calls failed với CORS error
**Solution**:
- Đảm bảo backend CORS config cho phép domain Vercel
- Kiểm tra `VITE_API_BASE_URL` đã được set đúng trong Vercel dashboard

**Problem**: 404 errors khi refresh page
**Solution**:
- File `vercel.json` đã có rewrites config
- Đảm bảo rewrites đang hoạt động: tất cả routes → `/index.html`

**Problem**: Environment variables không hoạt động
**Solution**:
- Environment variables phải bắt đầu với `VITE_` để Vite nhận diện
- Sau khi thêm env vars mới, cần **Redeploy** project
- Kiểm tra build logs để xác nhận env vars được load

**Problem**: Assets không load (images, fonts, v.v.)
**Solution**:
- Kiểm tra paths trong code phải là relative paths
- Assets trong `src/assets/` sẽ được Vite tự động optimize
- Sử dụng `import` cho assets thay vì hardcode paths

### Lỗi Performance

**Problem**: Build size quá lớn
**Solution**:
- `vite.config.ts` đã được optimize với chunk splitting
- Kiểm tra bundle analyzer để tìm dependencies lớn
- Consider lazy loading cho routes lớn

## 📝 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL (required) | `https://api.example.com/api` |

### Optional Variables

Không có optional variables hiện tại, nhưng có thể thêm trong tương lai.

**Lưu ý**: 
- Tất cả Vite environment variables phải bắt đầu với `VITE_`
- Variables được embed vào code khi build, không thể thay đổi runtime
- Cần redeploy sau khi thay đổi environment variables

## 🔄 CI/CD với Git

Vercel tự động deploy khi:
- Push code lên branch `main` → Deploy Production
- Push code lên branch khác → Deploy Preview
- Open Pull Request → Deploy Preview

### Preview Deployments

Mỗi PR sẽ có preview URL riêng để test trước khi merge:
- URL format: `https://your-project-git-branch-name.vercel.app`
- Environment variables từ "Preview" environment sẽ được sử dụng

## 📚 Tài liệu tham khảo

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## 🆘 Support

Nếu gặp vấn đề không giải quyết được:
1. Kiểm tra [Vercel Status](https://www.vercel-status.com)
2. Xem build logs trong Vercel dashboard
3. Kiểm tra console logs trong browser DevTools
4. Review code changes gần đây

---

**Last Updated**: Generated by deployment setup
**Project**: EV Trading Platform
**Framework**: React + TypeScript + Vite

