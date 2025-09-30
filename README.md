# Nền tảng Giao dịch Xe điện & Pin cũ (Second-hand EV & Battery Trading Platform)

Dự án này được phát triển trong khuôn khổ môn học **SWP391** kỳ **FALL25**. Đây là một nền tảng website full-stack cho phép người dùng đăng tin mua bán, trao đổi xe điện và pin xe điện đã qua sử dụng một cách an toàn và tiện lợi.

-----

## ℹ️ Thông tin Môn học & Nhóm

  * **Môn học:** SWP391 
  * **Kỳ học:** FALL25
  * **Thành viên thực hiện:**
      * **Nguyễn Trọng Thứ** - *Frontend Developer*
      * **Mai Khả Minh Duy** - *Backend Developer*
      * **Đoàn Nguyễn Nhật Quang** - *Backend Developer*

-----

## ✨ Tính năng chính

Nền tảng cung cấp các chức năng cốt lõi cho hai nhóm người dùng chính: **Thành viên** và **Quản trị viên**.

### 👤 Dành cho Thành viên (Member)

  * **Quản lý tài khoản:** Đăng ký, đăng nhập, quản lý hồ sơ cá nhân.
  * **Đăng tin:** Tạo, chỉnh sửa, xóa các tin đăng bán xe hoặc pin với đầy đủ thông số kỹ thuật, hình ảnh và mô tả.
  * **Gợi ý giá AI:** Hệ thống tự động gợi ý giá bán hợp lý dựa trên các thông số của sản phẩm.
  * **Tìm kiếm & Lọc:** Tìm kiếm sản phẩm mạnh mẽ theo hãng, dòng xe, năm sản xuất, tình trạng pin, khoảng giá, và nhiều tiêu chí khác.
  * **Yêu thích:** Lưu lại các tin đăng quan tâm để xem lại sau.
  * **Đánh giá:** Để lại đánh giá cho người dùng khác sau khi hoàn tất giao dịch.

### 🛠️ Dành cho Quản trị viên (Admin)

  * **Dashboard:** Bảng điều khiển tổng quan với các số liệu thống kê chính về người dùng, tin đăng, và doanh thu.
  * **Quản lý người dùng:** Xem danh sách, khóa hoặc mở khóa tài khoản thành viên.
  * **Kiểm duyệt nội dung:** Phê duyệt, từ chối các tin đăng mới, và gắn nhãn "Đã kiểm định" cho các sản phẩm uy tín.
  * **Quản lý giao dịch:** Theo dõi và hỗ trợ giải quyết các vấn đề phát sinh trong quá trình giao dịch.

-----

## 🚀 Công nghệ sử dụng

Dự án được xây dựng dựa trên các công nghệ hiện đại và phổ biến:

  * **Backend:**

      * **Next.js:** Nền tảng thực thi JavaScript phía server.
      * **TypeScript:** Tăng cường tính an toàn và chặt chẽ cho mã nguồn.
      * **MongoDB:** Cơ sở dữ liệu NoSQL linh hoạt, lưu trữ dữ liệu dưới dạng document JSON.
      * **JSON Web Token (JWT):** Dùng cho việc xác thực và phân quyền người dùng.

  * **Frontend:**

      * **React + Vite:** Thư viện JavaScript mạnh mẽ để xây dựng giao diện người dùng.
      * **TypeScript:** Đảm bảo code frontend an toàn và dễ bảo trì.

-----

## 📦 Cài đặt & Khởi chạy (Fontend)
1.  **Clone a repository về máy:**
    git clone https://github.com/Marecelino/EV-Trading-Platform-SWP391.git
2.  **Cài đặt các dependencies và chạy dự án:**
    npm install
   npm run dev 
## 📋 API Endpoints
  - **`/api/auth`**: Các API liên quan đến xác thực (đăng ký, đăng nhập, hồ sơ).
  - **`/api/listings`**: Các API cho việc quản lý tin đăng (CRUD, tìm kiếm).
  - **`/api/transactions`**: Các API xử lý quy trình giao dịch.
  - **`/api/favorites`**: Các API quản lý danh sách yêu thích.
  - **`/api/admin`**: Các API dành riêng cho quản trị viên (quản lý người dùng, duyệt tin,...).
Một vài  screen dự án 
  <img width="955" height="452" alt="image" src="https://github.com/user-attachments/assets/327b6280-738a-43c1-be16-0d0f4016aca8" />
  
  <img width="948" height="385" alt="image" src="https://github.com/user-attachments/assets/22bedc1d-c305-4696-958f-bc702481abfc" />
  
  <img width="946" height="449" alt="image" src="https://github.com/user-attachments/assets/31c54e7f-3575-4f50-a14f-a668c81c463b" />
  
  <img width="952" height="448" alt="image" src="https://github.com/user-attachments/assets/20a9b4af-d02c-439f-8613-de00615c74da" />





© 2025 - SWP391\_FALL25 Project Team
