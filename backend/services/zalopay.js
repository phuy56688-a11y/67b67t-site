/**
 * 67B67T — ZaloPay Merchant API Service (V2 Specification)
 * Strictly follows ZaloPay official cryptography standards and security protocols
 */

const crypto = require('crypto');
const config = require('../config/config');

/**
 * Generate HMAC-SHA256 signature
 * @param {string} key - Secret key
 * @param {string} data - Data to hash
 * @returns {string} - Hex-encoded signature
 */
function generateHmacSha256(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

/**
 * Timing-safe string comparison to protect against timing attacks
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Format app_trans_id in ZaloPay standard format: yyMMdd_XXXXXX
 * @returns {string}
 */
function generateAppTransId() {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(-2);
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const timeMs = String(Date.now()).slice(-4);
  return `${yy}${MM}${dd}_${timeMs}${randomSuffix}`;
}

/**
 * Call ZaloPay V2 Create Order API
 * @param {Object} params
 * @param {string} params.orderId - Unique app_trans_id
 * @param {string} params.username - Minecraft username
 * @param {number} params.amount - Amount in VND
 * @returns {Promise<Object>}
 */
async function createOrder({ orderId, username, amount }) {
  if (!config.isZaloPayConfigured()) {
    throw new Error('ZaloPay Merchant API chưa được cấu hình. Vui lòng cập nhật APP_ID, KEY1, KEY2 trong file .env');
  }

  const appTime = Date.now();
  const embedData = JSON.stringify({
    redirecturl: `${config.frontendUrl}#store`,
    preferred_payment_method: [],
    username: username
  });

  const item = JSON.stringify([
    {
      itemid: 'rank_plus',
      itemname: config.rank.name,
      itemprice: amount,
      itemquantity: 1
    }
  ]);

  const description = `67B67T - Mua Rank Plus cho ${username} (${orderId})`;

  // Standard ZaloPay data string format for create order:
  // app_id|app_trans_id|app_user|amount|app_time|embed_data|item
  const rawData = `${config.zalopay.appId}|${orderId}|${username}|${amount}|${appTime}|${embedData}|${item}`;
  const mac = generateHmacSha256(config.zalopay.key1, rawData);

  const payload = {
    app_id: parseInt(config.zalopay.appId, 10),
    app_user: username,
    app_trans_id: orderId,
    app_time: appTime,
    amount: amount,
    item: item,
    description: description,
    embed_data: embedData,
    bank_code: '', // Empty opens universal QR & all payment options
    callback_url: config.zalopay.callbackUrl,
    mac: mac
  };

  // Use native fetch (Node.js 18+)
  const response = await fetch(config.zalopay.endpoints.create, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ZaloPay HTTP Error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  return result;
}

/**
 * Verify ZaloPay Webhook Callback
 * ZaloPay sends { data: string (JSON), mac: string, type: number }
 * Callback MAC is computed using key2: HMAC-SHA256(key2, req.body.data)
 *
 * @param {string} data - JSON string sent by ZaloPay
 * @param {string} mac - MAC sent by ZaloPay
 * @returns {{ isValid: boolean, parsedData: Object|null, error?: string }}
 */
function verifyCallback(data, mac) {
  if (!config.isZaloPayConfigured()) {
    return { isValid: false, parsedData: null, error: 'Chưa cấu hình ZaloPay Merchant credentials' };
  }

  if (!data || !mac) {
    return { isValid: false, parsedData: null, error: 'Dữ liệu callback ZaloPay không hợp lệ' };
  }

  const expectedMac = generateHmacSha256(config.zalopay.key2, data);
  const isValid = timingSafeEqual(expectedMac, mac);

  if (!isValid) {
    return { isValid: false, parsedData: null, error: 'Chữ ký MAC callback không hợp lệ (Sai Key 2)' };
  }

  try {
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    return { isValid: true, parsedData };
  } catch (err) {
    return { isValid: false, parsedData: null, error: 'Không thể giải mã dữ liệu JSON callback' };
  }
}

/**
 * Query order status directly from ZaloPay API
 * Data string format for query: app_id|app_trans_id|key1
 * @param {string} orderId - app_trans_id
 * @returns {Promise<Object>}
 */
async function queryOrder(orderId) {
  if (!config.isZaloPayConfigured()) {
    throw new Error('ZaloPay Merchant API chưa được cấu hình.');
  }

  const rawData = `${config.zalopay.appId}|${orderId}|${config.zalopay.key1}`;
  const mac = generateHmacSha256(config.zalopay.key1, rawData);

  const payload = {
    app_id: parseInt(config.zalopay.appId, 10),
    app_trans_id: orderId,
    mac: mac
  };

  const response = await fetch(config.zalopay.endpoints.query, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lỗi tra cứu đơn hàng ZaloPay (${response.status}): ${errorText}`);
  }

  return await response.json();
}

module.exports = {
  generateAppTransId,
  createOrder,
  verifyCallback,
  queryOrder,
  generateHmacSha256
};
