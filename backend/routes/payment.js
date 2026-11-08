/**
 * 67B67T — Payment API Routes (ZaloPay)
 */

const express = require('express');
const router = express.Router();
const config = require('../config/config');
const orderService = require('../services/orderService');
const { optionalAuth } = require('../middleware/auth');

/**
 * GET /api/payment/config-status
 * Check whether ZaloPay Merchant credentials have been configured
 */
router.get('/config-status', (req, res) => {
  const isConfigured = config.isZaloPayConfigured();

  res.json({
    success: true,
    configured: isConfigured,
    env: config.zalopay.env,
    rank: {
      name: config.rank.name,
      price: config.rank.price,          // 5.000 VNĐ
      old_price: config.rank.oldPrice,   // 50.000 VNĐ
      discount_percent: 90,
      currency: config.rank.currency
    },
    manual_payment: {
      bank_name: config.manualPayment.bankName,
      account_no: config.manualPayment.accountNo,
      account_name: config.manualPayment.accountName
    },
    message: isConfigured
      ? 'Cổng thanh toán ZaloPay Merchant đã sẵn sàng nhận giao dịch.'
      : 'Hệ thống đang sử dụng quy trình chuyển khoản và duyệt đơn thủ công trong khi chờ ZaloPay Merchant.'
  });
});

/**
 * POST /api/payment/create
 * Initiate a new Rank Plus order
 * Body: { username: string }
 */
router.post('/create', optionalAuth, async (req, res) => {
  try {
    const { username } = req.body;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp tên nhân vật Minecraft hợp lệ.'
      });
    }

    const userId = req.user ? req.user.id : null;
    const buyerEmail = req.user ? req.user.email : null;

    const orderData = await orderService.createOrder(username, userId, buyerEmail);

    res.json({
      success: true,
      configured: orderData.configured !== false,
      order_id: orderData.orderId,
      username: orderData.username,
      amount: orderData.amount,             // 5000 VNĐ
      old_amount: orderData.oldAmount,      // 50000 VNĐ
      discount_percent: orderData.discountPercent || 90,
      manual_payment: orderData.manualPayment || null,
      status: orderData.status,
      order_url: orderData.orderUrl,
      zp_trans_token: orderData.zpTransToken,
      qr_code: orderData.qrCode || (orderData.manualPayment ? orderData.manualPayment.qrUrl : null),
      message: orderData.message
    });
  } catch (err) {
    console.error('❌ [API /payment/create] Lỗi:', err.message);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/payment/callback
 * ZaloPay Webhook Callback endpoint
 * Accepts: { data: string (JSON), mac: string, type: number }
 * Returns: { return_code: number, return_message: string }
 */
router.post('/callback', async (req, res) => {
  try {
    const { data, mac } = req.body;

    if (!data || !mac) {
      return res.json({
        return_code: -1,
        return_message: 'Missing data or mac signature'
      });
    }

    const callbackResponse = await orderService.processZaloPayCallback(data, mac);
    return res.json(callbackResponse);
  } catch (err) {
    console.error('❌ [API /payment/callback] Lỗi xử lý callback:', err.message);
    return res.json({
      return_code: 0,
      return_message: `Internal processing error: ${err.message}`
    });
  }
});

module.exports = router;
