-- ==============================================================================
-- 67B67T — BẢNG QUẢN LÝ TÀI KHOẢN, ĐƠN HÀNG & LỊCH SỬ DUYỆT RANK
-- ==============================================================================

-- 1. BẢNG TÀI KHOẢN NGƯỜI DÙNG (USERS)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,                        -- Băm bảo mật bằng bcryptjs (NULL nếu đăng nhập bằng Google)
    google_id TEXT UNIQUE,                     -- ID từ tài khoản Google
    role TEXT NOT NULL DEFAULT 'USER',         -- 'USER' hoặc 'ADMIN' (Chỉ duy nhất phuy56688@gmail.com được cấp ADMIN)
    name TEXT,                                 -- Tên hiển thị
    avatar TEXT,                               -- Ảnh đại diện
    reset_token TEXT,                          -- Token khôi phục mật khẩu
    reset_token_expires TEXT,                  -- Thời gian hết hạn token
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. BẢNG QUẢN LÝ ĐƠN HÀNG (ORDERS)
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,             -- Mã đơn hàng chuẩn: yyMMdd_XXXXXX
    user_id INTEGER,                           -- ID tài khoản người mua (liên kết bảng users)
    buyer_email TEXT,                          -- Email người mua
    username TEXT NOT NULL,                     -- Tên nhân vật Minecraft (3-16 ký tự)
    rank_name TEXT NOT NULL DEFAULT 'plus',    -- Tên gói rank ('plus')
    amount INTEGER NOT NULL DEFAULT 5000,      -- Giá gói: 5.000 VNĐ (giá cũ 50.000đ gạch ngang, giảm 90%)
    status TEXT NOT NULL DEFAULT 'PENDING',    -- PENDING, AWAITING_REVIEW, APPROVED, APPROVED_PENDING_DELIVERY, REJECTED, PAID, DELIVERED, FAILED
    receipt_url TEXT,                          -- Đường dẫn ảnh biên lai thanh toán do khách tải lên
    receipt_note TEXT,                         -- Ghi chú thanh toán / mã giao dịch ngân hàng do khách nhập
    receipt_submitted_at TEXT,                 -- Thời điểm khách gửi biên lai chờ duyệt
    reviewed_by TEXT,                          -- Email Admin duyệt đơn (phuy56688@gmail.com)
    reviewed_at TEXT,                          -- Thời điểm Admin duyệt hoặc từ chối
    rejection_reason TEXT,                     -- Lý do từ chối nếu không hợp lệ
    zp_trans_id TEXT,                          -- Mã giao dịch ZaloPay (nếu sau này kích hoạt ZaloPay)
    zp_trans_token TEXT,                       -- Token phiên thanh toán
    order_url TEXT,                            -- Link thanh toán
    qr_code TEXT,                              -- Chuỗi dữ liệu QR
    rcon_attempts INTEGER DEFAULT 0,           -- Số lần đã thử gửi lệnh RCON
    rcon_last_error TEXT,                      -- Lỗi RCON nếu server Minecraft offline
    rcon_delivered_at TEXT,                    -- Thời điểm server Minecraft cấp rank thành công
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_username ON orders(username);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON orders(buyer_email);

-- 3. BẢNG GHI NHẬN KIỂM TOÁN GIAO DỊCH (ORDER_LOGS)
CREATE TABLE IF NOT EXISTS order_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    action TEXT NOT NULL,                      -- CREATED, RECEIPT_SUBMITTED, APPROVED, REJECTED, RCON_SENT, RCON_SUCCESS, RCON_FAILED
    details TEXT,                              -- Chi tiết sự kiện
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_order_logs_order_id ON order_logs(order_id);

-- 4. BẢNG NHẬT KÝ THAO TÁC CỦA ADMIN (ADMIN_LOGS)
CREATE TABLE IF NOT EXISTS admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,                      -- APPROVE_ORDER, REJECT_ORDER, SYSTEM_SETTING
    order_id TEXT,
    details TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_email ON admin_logs(admin_email);
CREATE INDEX IF NOT EXISTS idx_admin_logs_order_id ON admin_logs(order_id);
