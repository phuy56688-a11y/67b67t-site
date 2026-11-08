# Backend Máy Chủ Thanh Toán ZaloPay & Cấp Rank Tự Động 67B67T

Hệ thống backend xử lý thanh toán ZaloPay Merchant API chính thức và tự động cấp quyền Rank Plus cho máy chủ Minecraft Paper 1.21.11 thông qua giao thức RCON và Skript.

---

## 🌟 Tính Năng Nổi Bật

1. **Chuẩn ZaloPay Merchant V2 API:**
   - Tạo đơn hàng động mã hóa HMAC-SHA256 (`app_id|app_trans_id|app_user|amount|app_time|embed_data|item`).
   - Webhook Callback bảo mật chữ ký HMAC-SHA256 với `key2` (dùng `crypto.timingSafeEqual` chống tấn công timing).
   - Tự động fallback và cảnh báo "Chờ cấu hình" khi chưa nhập App ID hoặc Key ZaloPay, **tuyệt đối không giả lập thanh toán ảo**.

2. **Cấp Rank Tự Động & Chống Cấp Trùng (Idempotency):**
   - Đơn hàng được quản lý theo trạng thái: `PENDING` ➔ `PAID` ➔ `DELIVERED`.
   - Cơ chế khóa trạng thái đơn hàng đảm bảo mỗi giao dịch chỉ được cấp rank **đúng 1 lần duy nhất**.

3. **Cơ Chế Hàng Đợi Bù (Offline Retry Worker):**
   - Nếu máy chủ Minecraft đang bảo trì hoặc offline khi người chơi thanh toán, đơn hàng sẽ chuyển sang trạng thái `DELIVERY_PENDING`.
   - Worker chạy ngầm định kỳ mỗi 15 giây sẽ tự động kết nối lại RCON và cấp rank ngay khi server Paper online trở lại.

4. **Bảo Mật Cao Cấp:**
   - Không lưu trữ hoặc để lộ RCON password, ZaloPay Secret Keys ra frontend.
   - Kiểm tra tên Minecraft bằng Regular Expression hợp lệ (`^[a-zA-Z0-9_]{3,16}$`).
   - Giới hạn tần suất gọi API (Rate Limiting) chống spam và DDoS.
   - Ghi log kiểm toán (`order_logs`) mọi hoạt động thanh toán và RCON.

---

## 📁 Cấu Trúc Thư Mục Backend

```
backend/
├── config/
│   └── config.js          # Nạp biến môi trường & kiểm tra cấu hình
├── database/
│   ├── db.js              # Wrapper SQLite3 với Promise
│   └── schema.sql         # Cấu trúc bảng orders & order_logs
├── routes/
│   ├── payment.js         # API tạo đơn, callback, trạng thái cấu hình
│   └── order.js           # API tra cứu trạng thái đơn hàng
├── services/
│   ├── zalopay.js         # Module tích hợp ZaloPay Merchant SDK V2
│   ├── minecraft.js       # Kết nối Paper RCON & cấp rank
│   └── orderService.js    # Quản lý vòng đời đơn hàng & idempotency
├── .env.example           # Mẫu file cấu hình môi trường
├── .env                   # File cấu hình thực tế (không commit git)
├── package.json           # Danh sách thư viện Node.js
├── README.md              # Tài liệu kỹ thuật
└── server.js              # Điểm khởi chạy Express Server
```

---

## 🛠️ Hướng Dẫn Cài Đặt Nhanh

### 1. Cài đặt thư viện:
```bash
cd backend
npm install
```

### 2. Cấu hình file `.env`:
Sao chép từ `.env.example`:
```bash
cp .env.example .env
```
Mở file `.env` và cập nhật thông tin:
- **ZaloPay:** Nhập `ZALOPAY_APP_ID`, `ZALOPAY_KEY1`, `ZALOPAY_KEY2` từ cổng ZaloPay Merchant Portal.
- **Callback URL:** Điền domain công khai (ví dụ `https://api.67b67t.site/api/payment/callback` hoặc domain Ngrok khi test).
- **Minecraft RCON:** Điền IP, Port (mặc định 25575) và Password trùng với `server.properties` của Minecraft.

### 3. Chạy máy chủ:
- **Chế độ phát triển (Dev):**
  ```bash
  npm run dev
  ```
- **Chế độ chạy nền chính thức (Production):**
  ```bash
  npm start
  # Hoặc dùng PM2:
  # npm install -g pm2
  # pm2 start server.js --name "67b67t-backend"
  ```

---

## 📡 Danh Sách API Endpoints

| Phương thức | Đường dẫn | Chức năng |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Kiểm tra tình trạng máy chủ & kết nối RCON |
| `GET` | `/api/payment/config-status` | Kiểm tra ZaloPay đã được cấu hình hay chưa |
| `POST` | `/api/payment/create` | Tạo đơn hàng mới & nhận mã QR / link thanh toán ZaloPay |
| `POST` | `/api/payment/callback` | Webhook nhận thông báo thanh toán thành công từ ZaloPay |
| `GET` | `/api/order/status/:orderId` | Kiểm tra trạng thái đơn hàng (Polling từ frontend) |
| `GET` | `/api/order/lookup?q=...` | Tra cứu lịch sử đơn hàng theo tên nhân vật hoặc mã đơn |
