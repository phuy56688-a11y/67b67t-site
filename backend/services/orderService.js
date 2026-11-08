/**
 * 67B67T — Order Management & Fulfillment Service
 * Handles transactional state transitions, idempotency, and audit logging
 */

const db = require('../database/db');
const config = require('../config/config');
const zalopay = require('./zalopay');
const minecraft = require('./minecraft');
const gachcard = require('./gachcard');

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
    `SELECT id, order_id, username, rank_name, amount, payment_method, card_telco, card_serial_masked, status, order_url, qr_code, rcon_delivered_at, created_at, updated_at
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
    `SELECT order_id, username, rank_name, amount, payment_method, card_telco, status, rcon_delivered_at, created_at
     FROM orders
     WHERE order_id = ? OR LOWER(username) = LOWER(?)
     ORDER BY id DESC
     LIMIT 5`,
    [clean, clean]
  );
}

/**
 * Tạo đơn hàng thanh toán Thẻ Cào (GachCard API)
 * Mệnh giá cố định: 10.000 VNĐ
 * Nhà mạng: VIETTEL, GARENA, ZING, MOBIFONE
 *
 * @param {Object} params
 * @param {string} params.username - Tên nhân vật Minecraft
 * @param {string} params.telco - Nhà mạng
 * @param {string} params.code - Mã PIN thẻ
 * @param {string} params.serial - Số serial thẻ
 * @param {number|null} [params.userId]
 * @param {string|null} [params.buyerEmail]
 * @returns {Promise<Object>}
 */
async function createCardOrder({ username, telco, code, serial, userId = null, buyerEmail = null }) {
  const cleanUsername = (username || '').trim();

  if (!minecraft.isValidUsername(cleanUsername)) {
    throw new Error('Tên nhân vật Minecraft không hợp lệ (từ 3 đến 16 ký tự, chỉ gồm chữ, số, _).');
  }

  const cleanTelco = (telco || '').trim().toUpperCase();
  if (!gachcard.ALLOWED_TELCOS.includes(cleanTelco)) {
    throw new Error(`Nhà mạng '${cleanTelco}' không hợp lệ. Vui lòng chọn: Viettel, Garena, Zing hoặc Mobifone.`);
  }

  const cleanCode = (code || '').trim().replace(/[^a-zA-Z0-9]/g, '');
  const cleanSerial = (serial || '').trim().replace(/[^a-zA-Z0-9]/g, '');

  if (!cleanCode || cleanCode.length < 8) {
    throw new Error('Mã thẻ cào (PIN) không được để trống (tối thiểu 8 ký tự).');
  }
  if (!cleanSerial || cleanSerial.length < 8) {
    throw new Error('Số serial không được để trống (tối thiểu 8 ký tự).');
  }

  // Tạo mã đơn và request_id riêng biệt, không trùng lặp
  const now = new Date();
  const datePrefix = String(now.getFullYear()).slice(-2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const randNum = Math.floor(100000 + Math.random() * 900000);
  const orderId = `CARD_${datePrefix}_${randNum}`;
  const requestId = orderId;

  const amount = config.rank.cardPrice || 10000;
  const maskedCode = gachcard.maskPin(cleanCode);
  const maskedSerial = gachcard.maskSerial(cleanSerial);

  // 1. Gọi API GachCard để gửi thẻ (HTTP POST application/json, command: charging)
  let cardRes;
  try {
    cardRes = await gachcard.sendCard({
      telco: cleanTelco,
      code: cleanCode,
      serial: cleanSerial,
      amount,
      requestId
    });
  } catch (err) {
    console.error('[OrderService Card Submit Error]', err.message);
    throw err;
  }

  // 2. Xác định trạng thái ban đầu của đơn hàng
  // 1: Thẻ hợp lệ (thành công)
  // 2: Thẻ đúng nhưng sai mệnh giá
  // 3: Thẻ không hợp lệ
  // 4: Nhà mạng bảo trì
  // 99: Đang chờ xử lý (Pending)
  let orderStatus = 'AWAITING_REVIEW';
  let rejectionReason = null;
  let isImmediateApproved = false;

  if (cardRes.status === 1) {
    // Thẻ đúng, kiểm tra mệnh giá thực nhận
    if (cardRes.value >= amount) {
      orderStatus = 'APPROVED';
      isImmediateApproved = true;
    } else {
      orderStatus = 'AWAITING_REVIEW';
      rejectionReason = `Thẻ đúng nhưng sai mệnh giá: Thực nhận ${cardRes.value}đ (yêu cầu ${amount}đ).`;
    }
  } else if (cardRes.status === 2) {
    orderStatus = 'AWAITING_REVIEW';
    rejectionReason = `Thẻ sai mệnh giá (Khai 10.000đ, thực nhận ${cardRes.value || 0}đ).`;
  } else if (cardRes.status === 3) {
    orderStatus = 'REJECTED';
    rejectionReason = cardRes.message || 'Mã thẻ hoặc số serial không hợp lệ / đã qua sử dụng.';
  } else if (cardRes.status === 4) {
    orderStatus = 'REJECTED';
    rejectionReason = 'Nhà mạng ' + cleanTelco + ' đang bảo trì, vui lòng thử lại sau.';
  } else {
    // Status 99 hoặc khác: Đang chờ xử lý
    orderStatus = 'AWAITING_REVIEW';
  }

  // 3. Ghi nhận đơn hàng vào cơ sở dữ liệu (Bảo mật: lưu masked PIN & masked Serial)
  await db.run(
    `INSERT INTO orders (
      order_id, user_id, buyer_email, username, rank_name, amount, 
      payment_method, card_telco, card_code_masked, card_serial_masked, 
      card_request_id, card_trans_id, card_declared_value, card_real_value, 
      status, rejection_reason
    ) VALUES (?, ?, ?, ?, 'plus', ?, 'CARD', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderId, userId, buyerEmail, cleanUsername, amount,
      cleanTelco, maskedCode, maskedSerial,
      requestId, cardRes.trans_id || '', amount, cardRes.value || 0,
      orderStatus, rejectionReason
    ]
  );

  await db.run(
    `INSERT INTO order_logs (order_id, action, details) VALUES (?, 'CARD_SUBMITTED', ?)`,
    [orderId, `Gửi thẻ cào ${cleanTelco} 10.000đ (Status: ${cardRes.status} - ${cardRes.message})`]
  );

  // 4. Nếu thẻ được duyệt thành công ngay lập tức: Kích hoạt Rank Plus qua Minecraft RCON
  let rankGrantResult = null;
  if (isImmediateApproved) {
    rankGrantResult = await minecraft.grantRankPlus(cleanUsername, orderId);
    if (rankGrantResult.success) {
      await db.run(
        `UPDATE orders 
         SET status = 'DELIVERED', 
             rcon_attempts = rcon_attempts + 1, 
             rcon_delivered_at = datetime('now', 'localtime'),
             updated_at = datetime('now', 'localtime')
         WHERE order_id = ?`,
        [orderId]
      );
      await db.run(
        `INSERT INTO order_logs (order_id, action, details) VALUES (?, 'RCON_DELIVERED', ?)`,
        [orderId, `Tự động cấp Rank Plus qua RCON cho ${cleanUsername} thành công.`]
      );
    } else {
      await db.run(
        `UPDATE orders 
         SET status = 'APPROVED_PENDING_DELIVERY', 
             rcon_attempts = rcon_attempts + 1, 
             rcon_last_error = ?,
             updated_at = datetime('now', 'localtime')
         WHERE order_id = ?`,
        [rankGrantResult.error, orderId]
      );
    }
  }

  return {
    success: cardRes.status === 1 || cardRes.status === 99,
    orderId,
    username: cleanUsername,
    paymentMethod: 'CARD',
    telco: cleanTelco,
    amount,
    status: orderStatus,
    cardStatus: cardRes.status,
    transId: cardRes.trans_id,
    message: cardRes.message || gachcard.getStatusMessage(cardRes.status),
    rejectionReason
  };
}

/**
 * Xử lý Webhook Callback từ GachCard (Khi thẻ được duyệt bất đồng bộ)
 * Xác minh tính hợp lệ, chống xử lý trùng (Idempotent), tự động cấp Rank Plus
 *
 * @param {Object} callbackData
 * @returns {Promise<Object>}
 */
async function processCardCallback(callbackData) {
  console.log('[GachCard Callback] Dữ liệu nhận được:', callbackData);

  const status = Number(callbackData.status);
  const requestId = (callbackData.request_id || callbackData.requestId || '').trim();
  const transId = callbackData.trans_id || callbackData.transId || '';
  const declaredValue = Number(callbackData.declared_value || callbackData.declaredValue || 10000);
  const value = Number(callbackData.value || callbackData.amount || 0);
  const message = callbackData.message || '';

  if (!requestId) {
    return { status: 'error', message: 'Missing request_id' };
  }

  // 1. Tìm đơn hàng trong cơ sở dữ liệu
  const order = await db.get(
    `SELECT * FROM orders WHERE card_request_id = ? OR order_id = ?`,
    [requestId, requestId]
  );

  if (!order) {
    console.warn(`[GachCard Callback] Không tìm thấy đơn hàng với request_id: ${requestId}`);
    return { status: 'error', message: 'Order not found' };
  }

  // 2. Chống xử lý trùng lặp (Idempotency): Nếu đơn đã được duyệt hoặc cấp rank, không cấp lại
  if (order.status === 'APPROVED' || order.status === 'DELIVERED') {
    console.log(`[GachCard Callback] Đơn hàng #${order.order_id} đã được xử lý trước đó. Bỏ qua.`);
    return { status: 'success', message: 'Order already processed' };
  }

  // 3. Cập nhật dữ liệu callback
  const rawDataJson = JSON.stringify(callbackData);

  if (status === 1) {
    // Thẻ hợp lệ
    if (value >= 10000) {
      await db.run(
        `UPDATE orders 
         SET status = 'APPROVED', 
             card_trans_id = ?, 
             card_real_value = ?, 
             card_callback_data = ?,
             reviewed_by = 'GachCard System API',
             reviewed_at = datetime('now', 'localtime'),
             updated_at = datetime('now', 'localtime')
         WHERE id = ?`,
        [transId, value, rawDataJson, order.id]
      );

      await db.run(
        `INSERT INTO order_logs (order_id, action, details) VALUES (?, 'CALLBACK_APPROVED', ?)`,
        [order.order_id, `GachCard xác nhận thẻ hợp lệ: ${value}đ`]
      );

      // Kích hoạt cấp Rank Plus ngay
      const rconResult = await minecraft.grantRankPlus(order.username, order.order_id);
      if (rconResult.success) {
        await db.run(
          `UPDATE orders 
           SET status = 'DELIVERED', 
               rcon_attempts = rcon_attempts + 1, 
               rcon_delivered_at = datetime('now', 'localtime') 
           WHERE id = ?`,
          [order.id]
        );
        console.log(`🎉 [Card Delivery] Cấp Rank Plus THÀNH CÔNG cho "${order.username}" (Đơn #${order.order_id})!`);
      } else {
        await db.run(
          `UPDATE orders 
           SET status = 'APPROVED_PENDING_DELIVERY', 
               rcon_attempts = rcon_attempts + 1, 
               rcon_last_error = ? 
           WHERE id = ?`,
          [rconResult.error, order.id]
        );
      }
    } else {
      // Đúng thẻ nhưng số tiền thực tế nhỏ hơn 10.000đ
      await db.run(
        `UPDATE orders 
         SET status = 'AWAITING_REVIEW', 
             card_trans_id = ?, 
             card_real_value = ?, 
             card_callback_data = ?,
             rejection_reason = ?,
             updated_at = datetime('now', 'localtime')
         WHERE id = ?`,
        [transId, value, rawDataJson, `Mệnh giá thực nhận (${value}đ) không đủ 10.000đ`, order.id]
      );
    }
  } else if (status === 2) {
    // Sai mệnh giá
    await db.run(
      `UPDATE orders 
       SET status = 'AWAITING_REVIEW', 
           card_trans_id = ?, 
           card_real_value = ?, 
           card_callback_data = ?,
           rejection_reason = ?,
           updated_at = datetime('now', 'localtime')
       WHERE id = ?`,
      [transId, value, rawDataJson, `Sai mệnh giá: Khai 10.000đ, thực nhận ${value}đ`, order.id]
    );
  } else if (status === 3 || status === 4) {
    // Thẻ lỗi hoặc bảo trì
    const reason = status === 4 ? 'Nhà mạng bảo trì' : (message || 'Thẻ cào không hợp lệ / sai mã');
    await db.run(
      `UPDATE orders 
       SET status = 'REJECTED', 
           card_trans_id = ?, 
           card_callback_data = ?,
           rejection_reason = ?,
           updated_at = datetime('now', 'localtime')
       WHERE id = ?`,
      [transId, rawDataJson, reason, order.id]
    );

    await db.run(
      `INSERT INTO order_logs (order_id, action, details) VALUES (?, 'CALLBACK_REJECTED', ?)`,
      [order.order_id, `GachCard từ chối thẻ: ${reason}`]
    );
  }

  return { status: 'success', message: 'Callback processed' };
}

module.exports = {
  createOrder,
  createCardOrder,
  processCardCallback,
  processZaloPayCallback,
  getOrderStatus,
  lookupOrders
};
