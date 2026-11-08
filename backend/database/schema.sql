-- ==============================================================================
-- 67B67T — BẢNG QUẢN LÝ ĐƠN HÀNG & LỊCH SỬ GIAO DỊCH
-- ==============================================================================

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT UNIQUE NOT NULL,             -- Mã đơn hàng chuẩn ZaloPay (app_trans_id: yyMMdd_XXXXXX)
    username TEXT NOT NULL,                     -- Tên nhân vật Minecraft (3-16 ký tự)
    rank_name TEXT NOT NULL DEFAULT 'plus',    -- Tên gói rank (mặc định: 'plus')
    amount INTEGER NOT NULL,                   -- Số tiền thanh toán (VNĐ)
    status TEXT NOT NULL DEFAULT 'PENDING',    -- PENDING, PAID, DELIVERED, DELIVERY_PENDING, FAILED, EXPIRED
    zp_trans_id TEXT,                          -- Mã giao dịch ZaloPay (trả về qua webhook callback)
    zp_trans_token TEXT,                       -- Token phiên thanh toán ZaloPay
    order_url TEXT,                            -- Đường dẫn mở cổng thanh toán ZaloPay
    qr_code TEXT,                              -- Chuỗi dữ liệu QR Code
    rcon_attempts INTEGER DEFAULT 0,           -- Số lần đã thử gửi lệnh RCON
    rcon_last_error TEXT,                      -- Chi tiết lỗi RCON gần nhất nếu máy chủ offline
    rcon_delivered_at TEXT,                    -- Thời điểm máy chủ Minecraft cấp rank thành công
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_orders_order_id ON orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_username ON orders(username);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Bảng ghi nhận vết kiểm toán giao dịch (Audit Logs)
CREATE TABLE IF NOT EXISTS order_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    action TEXT NOT NULL,                      -- CREATED, CALLBACK_RECEIVED, MAC_VERIFIED, RCON_SENT, RCON_SUCCESS, RCON_FAILED
    details TEXT,                              -- Dữ liệu JSON hoặc thông điệp mô tả
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_order_logs_order_id ON order_logs(order_id);
