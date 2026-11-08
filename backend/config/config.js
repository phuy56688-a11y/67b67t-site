/**
 * 67B67T — Application Configuration Loader
 * Handles environment variables, authentication, admin roles, and payment settings
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'https://67b67t.site',

  // Email quản trị viên duy nhất được cấp quyền ADMIN tự động
  adminEmail: (process.env.ADMIN_EMAIL || 'phuy56688@gmail.com').toLowerCase().trim(),

  // JWT Secret cho phiên đăng nhập người dùng & quản trị
  jwtSecret: process.env.JWT_SECRET || '67b67t_titanium_jwt_auth_secret_key_2026',

  // Cấu hình thanh toán thủ công (Chuyển khoản / Quét QR)
  manualPayment: {
    bankName: process.env.MANUAL_PAY_BANK || 'MB Bank (Quân Đội)',
    accountNo: process.env.MANUAL_PAY_ACCOUNT || '0367676767',
    accountName: process.env.MANUAL_PAY_NAME || 'PHAM HUY',
    qrTemplate: process.env.MANUAL_PAY_QR_TEMPLATE || 'https://api.vietqr.io/image/970422-0367676767-print.jpg?amount=5000&addInfo=67B67T%20{orderId}&accountName=PHAM%20HUY'
  },

  zalopay: {
    env: process.env.ZALOPAY_ENV === 'production' ? 'production' : 'sandbox',
    appId: process.env.ZALOPAY_APP_ID ? process.env.ZALOPAY_APP_ID.trim() : '',
    key1: process.env.ZALOPAY_KEY1 ? process.env.ZALOPAY_KEY1.trim() : '',
    key2: process.env.ZALOPAY_KEY2 ? process.env.ZALOPAY_KEY2.trim() : '',
    callbackUrl: process.env.ZALOPAY_CALLBACK_URL || 'http://localhost:5000/api/payment/callback',
    endpoints: {
      create: process.env.ZALOPAY_ENV === 'production'
        ? (process.env.ZALOPAY_ENDPOINT_CREATE_PROD || 'https://openapi.zalopay.vn/v2/create')
        : (process.env.ZALOPAY_ENDPOINT_CREATE_SANDBOX || 'https://sb-openapi.zalopay.vn/v2/create'),
      query: process.env.ZALOPAY_ENV === 'production'
        ? (process.env.ZALOPAY_ENDPOINT_QUERY_PROD || 'https://openapi.zalopay.vn/v2/query')
        : (process.env.ZALOPAY_ENDPOINT_QUERY_SANDBOX || 'https://sb-openapi.zalopay.vn/v2/query')
    }
  },

  rank: {
    name: process.env.RANK_PLUS_NAME || 'Rank Plus (4 Home + 5 Ender Chest)',
    // Giá mới: 5.000 VNĐ | Giá cũ: 50.000 VNĐ (Giảm giá 90%)
    price: parseInt(process.env.RANK_PLUS_PRICE, 10) || 5000,
    oldPrice: 50000,
    currency: 'VND'
  },

  minecraft: {
    host: process.env.RCON_HOST || '127.0.0.1',
    port: parseInt(process.env.RCON_PORT, 10) || 25575,
    password: process.env.RCON_PASSWORD || '',
    rankCommand: process.env.RCON_RANK_COMMAND || 'giverank {username} plus {orderId}',
    retryIntervalMs: parseInt(process.env.RETRY_WORKER_INTERVAL_MS, 10) || 60000
  },

  database: {
    filename: path.join(__dirname, '..', 'database', 'store.db')
  }
};

/**
 * Kiểm tra xem ZaloPay Merchant credentials đã được cấu hình hay chưa
 * @returns {boolean}
 */
config.isZaloPayConfigured = function () {
  const { appId, key1, key2 } = config.zalopay;
  return Boolean(
    appId &&
    key1 &&
    key2 &&
    appId !== 'your_app_id' &&
    key1 !== 'your_key1' &&
    key2 !== 'your_key2'
  );
};

module.exports = config;
