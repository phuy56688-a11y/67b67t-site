/**
 * Router Tra Cứu Đơn Hàng (Order Routes)
 * 67B67T Minecraft Store
 */

const express = require('express');
const router = express.Router();
const orderService = require('../services/orderService');
const db = require('../database/db');

/**
 * GET /api/order/status/:orderId
 * Kiểm tra trạng thái đơn hàng thời gian thực (Frontend poll định kỳ khi đang ở màn hình thanh toán)
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

        return res.json({
            success: true,
            order: order
        });
    } catch (err) {
        console.error('[API Order Status Error]', err);
        return res.status(500).json({ success: false, message: 'Lỗi kiểm tra trạng thái đơn hàng' });
    }
});

/**
 * GET /api/order/lookup?q=username_or_orderid
 * Tra cứu lịch sử đơn hàng theo Tên người chơi hoặc Mã đơn hàng
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
