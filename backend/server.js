/**
 * Backend Máy Chủ Thanh Toán ZaloPay & Cấp Rank Tự Động 67B67T
 * Node.js Express + SQLite + RCON Minecraft Paper 1.21.11
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const config = require('./config/config');
const db = require('./database/db');
const minecraft = require('./services/minecraft');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const orderRoutes = require('./routes/order');

const app = express();

// Trust reverse proxy (Nginx / Cloudflare / Ngrok)
app.set('trust proxy', 1);

// Middleware CORS
const allowedOrigins = [
    'https://67b67t.site',
    'http://67b67t.site',
    'http://localhost',
    'http://127.0.0.1'
];
app.use(cors({
    origin: (origin, callback) => {
        // Cho phép request không có origin (curl, mobile app, postman, backend callback)
        if (!origin) return callback(null, true);
        if (allowedOrigins.some(o => origin.startsWith(o)) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return callback(null, true);
        }
        // Cho phép dev và sandbox
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiter cho API công khai chống spam
const generalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 phút
    max: 120, // tối đa 120 requests mỗi IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Bạn đang gửi yêu cầu quá nhanh, vui lòng chờ trong giây lát.' }
});

const createOrderLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15, // Tối đa 15 lần tạo đơn / phút
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Đã tạo quá nhiều đơn hàng trong thời gian ngắn. Vui lòng chờ 1 phút.' }
});

app.use('/api/', generalLimiter);
app.use('/api/payment/create', createOrderLimiter);

// Log request đơn giản
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (req.originalUrl.startsWith('/api/')) {
            console.log(`[HTTP] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
        }
    });
    next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    return res.json({
        status: 'UP',
        service: '67b67t-store-backend',
        version: '1.1.0',
        timestamp: new Date().toISOString(),
        zalopay_configured: config.isZaloPayConfigured(),
        gachcard_configured: config.isGachCardConfigured(),
        minecraft_rcon: {
            host: config.minecraft.host,
            port: config.minecraft.port
        }
    });
});

// Serve static uploaded receipts
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/order', orderRoutes);

// Fallback 404 cho API
app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint không tồn tại' });
});

// Phục vụ giao diện website tĩnh trực tiếp trên cùng cổng Port 5000
app.use(express.static(path.join(__dirname, '..')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[Unhandled Server Error]', err);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.' });
});

// Khởi chạy hệ thống
async function bootstrap() {
    try {
        console.log('----------------------------------------------------');
        console.log('🚀 Đang khởi động Backend 67B67T Minecraft Store...');
        console.log('----------------------------------------------------');

        // 1. Khởi tạo cơ sở dữ liệu SQLite
        await db.init();

        // 2. Kiểm tra cấu hình ZaloPay
        const isZaloReady = config.isZaloPayConfigured();
        if (isZaloReady) {
            console.log('✅ ZaloPay Merchant API: ĐÃ CẤU HÌNH (App ID: ' + config.zalopay.app_id + ')');
        } else {
            console.log('⚠️  ZaloPay Merchant API: CHƯA CẤU HÌNH (Thiếu App ID hoặc Key bí mật)');
            console.log('👉 Website sẽ tự động hiển thị trạng thái chờ cấu hình thông minh.');
        }

        // 3. Khởi động background worker kiểm tra và cấp rank bù nếu Minecraft server offline
        console.log(`🔄 Khởi động worker thử lại RCON (chu kỳ ${config.minecraft.retryIntervalMs / 1000}s)...`);
        setInterval(async () => {
            try {
                await minecraft.processPendingDeliveries();
            } catch (err) {
                console.error('[Worker Error] Lỗi kiểm tra đơn pending:', err.message);
            }
        }, config.minecraft.retryIntervalMs);

        // 4. Lắng nghe HTTP Port
        app.listen(config.port, () => {
            console.log(`🌐 Server backend đang chạy tại: http://localhost:${config.port}`);
            console.log(`📡 Endpoint Health Check: http://localhost:${config.port}/api/health`);
            console.log(`💳 Endpoint Cấu hình Thanh toán: http://localhost:${config.port}/api/payment/config-status`);
            console.log('----------------------------------------------------');
        });

    } catch (err) {
        console.error('❌ Khởi động thất bại:', err);
        process.exit(1);
    }
}

bootstrap();
