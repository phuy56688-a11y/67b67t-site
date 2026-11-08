/**
 * Router Tra Cứu & Quản Lý Đơn Hàng (Order Routes)
 * 67B67T Minecraft Platform
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const orderService = require('../services/orderService');
const db = require('../database/db');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Cấu hình Multer lưu ảnh biên lai thanh toán
const uploadDir = path.join(__dirname, '..', 'uploads', 'receipts');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.png';
        const cleanOrderId = (req.params.orderId || 'receipt').replace(/[^a-zA-Z0-9_]/g, '');
        cb(null, `${cleanOrderId}_${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Tối đa 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận tải lên file ảnh (PNG, JPG, WEBP)'));
        }
    }
});

/**
 * GET /api/order/status/:orderId
 * Kiểm tra trạng thái đơn hàng thời gian thực
 */
router.get('/status/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        if (!orderId || typeof orderId !== 'string') {
            return res.status(400).json({ success: false, message: 'Mã đơn hàng không hợp lệ' });
        }

        const order = await orderService.getOrderStatus(orderId.trim());
        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        let userFacingMessage = 'Đang chờ thanh toán và gửi biên lai xác nhận.';
        if (order.status === 'AWAITING_REVIEW') {
            userFacingMessage = 'Thanh toán của bạn đã được ghi nhận và đang chờ quản trị viên kiểm tra. Rank Plus của bạn sẽ được xét duyệt trong vòng 24 giờ. Vui lòng giữ lại biên lai thanh toán.';
        } else if (order.status === 'APPROVED' || order.status === 'DELIVERED') {
            userFacingMessage = 'Chúc mừng! Đơn hàng của bạn đã được duyệt. Rank Plus đã được cấp cho tài khoản Minecraft của bạn.';
        } else if (order.status === 'APPROVED_PENDING_DELIVERY') {
            userFacingMessage = 'Đơn hàng của bạn đã được duyệt! Server Minecraft đang khởi động lại và sẽ tự động cấp rank ngay khi online.';
        } else if (order.status === 'REJECTED') {
            userFacingMessage = `Đơn hàng đã bị từ chối. Lý do: ${order.rejection_reason || 'Thông tin thanh toán không hợp lệ'}`;
        }

        return res.json({
            success: true,
            order: order,
            user_message: userFacingMessage
        });
    } catch (err) {
        console.error('[API Order Status Error]', err);
        return res.status(500).json({ success: false, message: 'Lỗi kiểm tra trạng thái đơn hàng' });
    }
});

/**
 * POST /api/order/:orderId/submit-receipt
 * Người mua gửi biên lai chuyển khoản / mã giao dịch để Admin duyệt thủ công
 */
router.post('/:orderId/submit-receipt', upload.single('receipt_image'), async (req, res) => {
    try {
        const { orderId } = req.params;
        const receiptNote = (req.body.receipt_note || req.body.note || '').trim();

        const order = await db.get('SELECT * FROM orders WHERE order_id = ?', [orderId]);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        if (order.status === 'APPROVED' || order.status === 'DELIVERED') {
            return res.status(400).json({
                success: false,
                message: 'Đơn hàng này đã được duyệt và cấp Rank Plus thành công!'
            });
        }

        let receiptUrl = order.receipt_url;
        if (req.file) {
            // Lưu đường dẫn công khai tải file
            receiptUrl = `/uploads/receipts/${req.file.filename}`;
        }

        if (!receiptUrl && !receiptNote) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng tải lên ảnh chụp biên lai hoặc nhập mã giao dịch/ghi chú chuyển khoản.'
            });
        }

        // Cập nhật trạng thái đơn hàng thành AWAITING_REVIEW (CHỜ DUYỆT)
        await db.run(
            `UPDATE orders 
             SET status = 'AWAITING_REVIEW',
                 receipt_url = ?,
                 receipt_note = ?,
                 receipt_submitted_at = datetime('now', 'localtime'),
                 updated_at = datetime('now', 'localtime')
             WHERE id = ?`,
            [receiptUrl, receiptNote, order.id]
        );

        await db.run(
            `INSERT INTO order_logs (order_id, action, details) VALUES (?, 'RECEIPT_SUBMITTED', ?)`,
            [orderId, `Người mua đã nộp biên lai thanh toán (Ghi chú: ${receiptNote || 'Đã đính kèm ảnh'})`]
        );

        console.log(`📄 [Receipt Submitted] Đơn hàng #${orderId} đã nộp biên lai và chuyển sang CHỜ DUYỆT.`);

        // THÔNG BÁO CHUẨN XÁC THEO YÊU CẦU CỦA ĐỀ BÀI:
        return res.json({
            success: true,
            status: 'AWAITING_REVIEW',
            message: 'Thanh toán của bạn đã được ghi nhận và đang chờ quản trị viên kiểm tra. Rank Plus của bạn sẽ được xét duyệt trong vòng 24 giờ. Vui lòng giữ lại biên lai thanh toán.'
        });

    } catch (err) {
        console.error('[Submit Receipt Error]', err);
        return res.status(500).json({ success: false, message: 'Lỗi gửi biên lai: ' + err.message });
    }
});

/**
 * GET /api/order/my-orders
 * Người dùng xem lịch sử đơn hàng của CHÍNH MÌNH (Bảo mật - Không xem của người khác)
 */
router.get('/my-orders', authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = (req.user.email || '').toLowerCase().trim();

        const orders = await db.all(
            `SELECT id, order_id, user_id, buyer_email, username, rank_name, amount, status, 
                    receipt_url, receipt_note, receipt_submitted_at, reviewed_at, rejection_reason, 
                    rcon_delivered_at, created_at
             FROM orders 
             WHERE user_id = ? OR LOWER(buyer_email) = ?
             ORDER BY id DESC`,
            [userId, userEmail]
        );

        return res.json({
            success: true,
            total: orders.length,
            orders
        });
    } catch (err) {
        console.error('[My Orders Error]', err);
        return res.status(500).json({ success: false, message: 'Lỗi tải lịch sử đơn hàng' });
    }
});

/**
 * GET /api/order/lookup?q=username_or_orderid
 * Tra cứu công khai nhanh theo Tên người chơi hoặc Mã đơn hàng
 */
router.get('/lookup', async (req, res) => {
    try {
        const query = (req.query.q || '').trim();
        if (!query) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên người chơi hoặc mã đơn hàng' });
        }

        if (query.length < 3 || query.length > 50) {
            return res.status(400).json({ success: false, message: 'Độ dài tìm kiếm không hợp lệ (3 - 50 ký tự)' });
        }

        const orders = await orderService.lookupOrders(query);

        return res.json({
            success: true,
            total: orders.length,
            orders: orders
        });
    } catch (err) {
        console.error('[API Order Lookup Error]', err);
        return res.status(500).json({ success: false, message: 'Lỗi tra cứu đơn hàng' });
    }
});

module.exports = router;
