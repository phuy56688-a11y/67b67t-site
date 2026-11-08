/**
 * 67B67T — Order Management & Fulfillment Service
 * Handles transactional state transitions, idempotency, and audit logging
 */

const db = require('../database/db');
const config = require('../config/config');
const zalopay = require('./zalopay');
const minecraft = require('./minecraft');

/**
 * Create a new pending order and initialize payment session
 * @param {string} username - Minecraft player username
 * @param {number|null} userId - ID tài khoản người dùng
 * @param {string|null} buyerEmail - Email người mua
 * @returns {Promise<Object>}
 */
async function createOrder(username, userId = null, buyerEmail = null) {
  const cleanUsername = (username || '').trim();

  if (!minecraft.isValidUsername(cleanUsername)) {
    throw new Error('Tên nhân vật Minecraft không hợp lệ. Tên hợp lệ từ 3 đến 16 ký tự (chữ cái, số và dấu gạch dưới).');
  }

  const orderId = zalopay.generateAppTransId();
  // GIÁ MỚI 5.000 VNĐ - ĐƯỢC ÉP BUỘC CHẶT CHẼ TỪ BACKEND
  const amount = config.rank.price;

  const manualQrUrl = config.manualPayment.qrTemplate.replace('{orderId}', orderId);

  // 1. Ghi nhận đơn hàng vào cơ sở dữ liệu
  await db.run(
    `INSERT INTO orders (order_id, user_id, buyer_email, username, rank_name, amount, status, qr_code)
     VALUES (?, ?, ?, ?, 'plus', ?, 'PENDING', ?)`,
    [orderId, userId, buyerEmail, cleanUsername, amount, manualQrUrl]
  );

  await db.run(
    `INSERT INTO order_logs (order_id, action, details) VALUES (?, 'CREATED', ?)`,
    [orderId, `Tạo đơn hàng mua Rank Plus cho ${cleanUsername} với giá ưu đãi ${amount} VNĐ`]
  );

  // Nếu ZaloPay Merchant chưa cấu hình: Sử dụng quy trình thanh toán thủ công & duyệt đơn
  if (!config.isZaloPayConfigured()) {
    const randomCode = Math.floor(Math.random() * 670) + 1;
    const transferContent = `${randomCode}-${cleanUsername}`;

    return {
      orderId,
      username: cleanUsername,
      amount,
      oldAmount: config.rank.oldPrice || 50000,
      discountPercent: 90,
      configured: false,
      manualPayment: {
        bankName: config.manualPayment.bankName,
        accountNo: config.manualPayment.accountNo,
        accountName: config.manualPayment.accountName,
        transferContent: transferContent,
        qrUrl: 'assets/qr-payment.png'
      },
      status: 'PENDING',
      message: 'Vui lòng quét mã QR chuyển khoản 5.000đ và gửi biên lai để quản trị viên kiểm tra.'
    };
  }

  // 2. Call ZaloPay Create Order API
  let zpResult;
  try {
    zpResult = await zalopay.createOrder({
      orderId,
      username: cleanUsername,
      amount
    });
  } catch (err) {
    await db.run(`UPDATE orders SET status = 'FAILED' WHERE order_id = ?`, [orderId]);
    await db.run(
      `INSERT INTO order_logs (order_id, action, details) VALUES (?, 'FAILED', ?)`,
      [orderId, `Lỗi gọi ZaloPay API: ${err.message}`]
    );
    throw err;
  }

  if (zpResult.return_code !== 1) {
    await db.run(`UPDATE orders SET status = 'FAILED' WHERE order_id = ?`, [orderId]);
    throw new Error(`ZaloPay từ chối tạo đơn (${zpResult.return_code}): ${zpResult.return_message || zpResult.sub_return_message}`);
  }

  // 3. Update order with payment session details
  const orderUrl = zpResult.order_url || '';
  const zpTransToken = zpResult.zp_trans_token || '';
  const qrCode = zpResult.qr_code || orderUrl;

  await db.run(
    `UPDATE orders 
     SET order_url = ?, zp_trans_token = ?, qr_code = ?, updated_at = datetime('now', 'localtime')
     WHERE order_id = ?`,
    [orderUrl, zpTransToken, qrCode, orderId]
  );

  return {
    orderId,
    username: cleanUsername,
    rankName: config.rank.name,
    amount,
    orderUrl,
    zpTransToken,
    qrCode,
    status: 'PENDING'
  };
}

/**
 * Handle incoming Webhook Callback from ZaloPay
 * Strictly verifies MAC signature, validates order amount, and executes RCON rank delivery
 *
 * @param {string} data - JSON string sent by ZaloPay
 * @param {string} mac - HMAC signature sent by ZaloPay
 * @returns {Promise<{ return_code: number, return_message: string }>}
 */
async function processZaloPayCallback(data, mac) {
  // 1. Verify HMAC-SHA256 signature
  const verification = zalopay.verifyCallback(data, mac);
  if (!verification.isValid) {
    console.error('⛔ [Callback Security] Chữ ký MAC không hợp lệ:', verification.error);
    return {
      return_code: -1,
      return_message: verification.error || 'Invalid MAC signature'
    };
  }

  const { parsedData } = verification;
  const orderId = parsedData.app_trans_id;
  const callbackAmount = parseInt(parsedData.amount, 10);
  const zpTransId = String(parsedData.zp_trans_id || '');

  console.log(`📩 [ZaloPay Callback] Nhận thông báo giao dịch thành công cho đơn #${orderId} - Số tiền: ${callbackAmount} VNĐ`);

  // 2. Fetch order from database
  const order = await db.get(`SELECT * FROM orders WHERE order_id = ?`, [orderId]);
  if (!order) {
    console.error(`❌ [Callback] Không tìm thấy đơn hàng #${orderId} trong cơ sở dữ liệu.`);
    return {
      return_code: 0,
      return_message: 'Order does not exist'
    };
  }

  // 3. Amount integrity check
  if (order.amount !== callbackAmount) {
    console.error(`❌ [Callback] Số tiền không khớp! Đơn hàng: ${order.amount} VNĐ, Callback: ${callbackAmount} VNĐ`);
    await db.run(
      `INSERT INTO order_logs (order_id, action, details) VALUES (?, 'AMOUNT_MISMATCH', ?)`,
      [orderId, `Số tiền không khớp: Đơn=${order.amount}, ZaloPay=${callbackAmount}`]
    );
    return {
      return_code: 0,
      return_message: 'Amount mismatch'
    };
  }

  // 4. Idempotency check: Protect against duplicate callbacks
  if (order.status === 'PAID' || order.status === 'DELIVERED') {
    console.log(`ℹ️ [Callback] Đơn hàng #${orderId} đã được xử lý trước đó. Bỏ qua cấp rank lặp.`);
    return {
      return_code: 1,
      return_message: 'Order already processed'
    };
  }

  // 5. Update order status to PAID
  await db.run(
    `UPDATE orders 
     SET status = 'PAID', zp_trans_id = ?, updated_at = datetime('now', 'localtime')
     WHERE id = ?`,
    [zpTransId, order.id]
  );

  await db.run(
    `INSERT INTO order_logs (order_id, action, details) VALUES (?, 'CALLBACK_VERIFIED', ?)`,
    [orderId, `Xác minh chữ ký thành công. ZP Trans ID: ${zpTransId}`]
  );

  // 6. Automatically grant Rank Plus in Minecraft via RCON
  const rconResult = await minecraft.grantRankPlus(order.username, order.order_id);

  if (rconResult.success) {
    await db.run(
      `UPDATE orders 
       SET status = 'DELIVERED', 
           rcon_attempts = rcon_attempts + 1, 
           rcon_delivered_at = datetime('now', 'localtime'),
           updated_at = datetime('now', 'localtime')
       WHERE id = ?`,
      [order.id]
    );
    console.log(`🎉 [Minecraft Delivery] Cấp Rank Plus THÀNH CÔNG cho "${order.username}" (Đơn #${orderId})!`);
  } else {
    // Server is offline or RCON failed -> Put into retry queue
    await db.run(
      `UPDATE orders 
       SET status = 'DELIVERY_PENDING', 
           rcon_attempts = rcon_attempts + 1, 
           rcon_last_error = ?,
           updated_at = datetime('now', 'localtime')
       WHERE id = ?`,
      [rconResult.error, order.id]
    );
    console.warn(`⚠️ [Minecraft Delivery] Máy chủ tạm thời chưa cấp được: ${rconResult.error}. Đã đưa vào hàng đợi cấp bù tự động.`);
  }

  return {
    return_code: 1,
    return_message: 'success'
  };
}

/**
 * Get detailed status of an order
 * @param {string} orderId
 * @returns {Promise<Object|null>}
 */
async function getOrderStatus(orderId) {
  const order = await db.get(
    `SELECT id, order_id, username, rank_name, amount, status, order_url, qr_code, rcon_delivered_at, created_at, updated_at
     FROM orders WHERE order_id = ?`,
    [orderId]
  );

  if (!order) return null;

  // Active check fallback: If order is PENDING and ZaloPay is configured, query ZaloPay API
  if (order.status === 'PENDING' && config.isZaloPayConfigured()) {
    try {
      const qResult = await zalopay.queryOrder(orderId);
      if (qResult.return_code === 1) {
        // Payment succeeded according to ZaloPay!
        await processZaloPayCallback(
          JSON.stringify({
            app_id: config.zalopay.appId,
            app_trans_id: orderId,
            amount: order.amount,
            zp_trans_id: qResult.zp_trans_id || ''
          }),
          zalopay.generateHmacSha256(
            config.zalopay.key2,
            JSON.stringify({
              app_id: config.zalopay.appId,
              app_trans_id: orderId,
              amount: order.amount,
              zp_trans_id: qResult.zp_trans_id || ''
            })
          )
        );
        // Re-read updated order
        return await db.get(
          `SELECT id, order_id, username, rank_name, amount, status, order_url, qr_code, rcon_delivered_at, created_at, updated_at
           FROM orders WHERE order_id = ?`,
          [orderId]
        );
      }
    } catch (_) {
      // Non-blocking query error
    }
  }

  return order;
}

/**
 * Look up recent orders by username or exact order ID
 * @param {string} query
 * @returns {Promise<Array>}
 */
async function lookupOrders(query) {
  const clean = (query || '').trim();
  if (!clean) return [];

  return await db.all(
    `SELECT order_id, username, rank_name, amount, status, rcon_delivered_at, created_at
     FROM orders
     WHERE order_id = ? OR LOWER(username) = LOWER(?)
     ORDER BY id DESC
     LIMIT 5`,
    [clean, clean]
  );
}

module.exports = {
  createOrder,
  processZaloPayCallback,
  getOrderStatus,
  lookupOrders
};
