/**
 * 67B67T — GachCard API Service (gachcard.net)
 * Tích hợp API Đổi Thẻ Cào / Gạch Thẻ Tự Động Chuẩn Charging V2
 * Tài liệu chính thức: https://gachcard.net/tai-lieu-api
 */

const crypto = require('crypto');
const config = require('../config/config');

const ALLOWED_TELCOS = ['VIETTEL', 'GARENA', 'ZING', 'MOBIFONE'];

/**
 * Tính mã băm chữ ký MD5 chuẩn Charging V2
 * Công thức: md5(partner_key + code + command + partner_id + request_id + serial + telco)
 *
 * @param {Object} params
 * @param {string} params.partnerKey
 * @param {string} params.code
 * @param {string} params.command
 * @param {string} params.partnerId
 * @param {string} params.requestId
 * @param {string} params.serial
 * @param {string} params.telco
 * @returns {string} MD5 hex 32 ký tự
 */
function generateSign({ partnerKey, code, command, partnerId, requestId, serial, telco }) {
  const rawString = `${partnerKey}${code}${command}${partnerId}${requestId}${serial}${telco}`;
  return crypto.createHash('md5').update(rawString).digest('hex');
}

/**
 * Tạo chữ ký xác minh trạng thái (Command: check)
 * Công thức: md5(partner_key + command + partner_id + request_id)
 */
function generateCheckSign({ partnerKey, command = 'check', partnerId, requestId }) {
  const rawString = `${partnerKey}${command}${partnerId}${requestId}`;
  return crypto.createHash('md5').update(rawString).digest('hex');
}

/**
 * Ẩn bảo mật mã thẻ (PIN) — Chỉ giữ lại 4 ký tự cuối
 * Tuyệt đối không lưu văn bản thuần hoặc để lộ ra frontend
 * @param {string} str
 * @returns {string}
 */
function maskPin(str) {
  if (!str || typeof str !== 'string') return '****';
  const clean = str.trim();
  if (clean.length <= 4) return '****';
  return '*'.repeat(clean.length - 4) + clean.slice(-4);
}

/**
 * Ẩn bảo mật số Serial — Giữ lại 3 ký tự đầu và 4 ký tự cuối
 * @param {string} str
 * @returns {string}
 */
function maskSerial(str) {
  if (!str || typeof str !== 'string') return '****';
  const clean = str.trim();
  if (clean.length <= 7) return '*'.repeat(clean.length);
  return clean.slice(0, 3) + '*'.repeat(clean.length - 7) + clean.slice(-4);
}

/**
 * Gửi thẻ cào lên cổng API GachCard (POST /chargingws/v2)
 *
 * @param {Object} params
 * @param {string} params.telco - Nhà mạng: VIETTEL, GARENA, ZING, MOBIFONE
 * @param {string} params.code - Mã thẻ (PIN)
 * @param {string} params.serial - Số serial
 * @param {number} [params.amount=10000] - Mệnh giá (cố định 10.000 VNĐ)
 * @param {string} params.requestId - Mã giao dịch duy nhất
 * @returns {Promise<Object>}
 */
async function sendCard({ telco, code, serial, amount = 10000, requestId }) {
  const cleanTelco = (telco || '').trim().toUpperCase();
  const cleanCode = (code || '').trim().replace(/[^a-zA-Z0-9]/g, '');
  const cleanSerial = (serial || '').trim().replace(/[^a-zA-Z0-9]/g, '');

  if (!ALLOWED_TELCOS.includes(cleanTelco)) {
    throw new Error(`Nhà mạng '${cleanTelco}' không hợp lệ. Chỉ chấp nhận: VIETTEL, GARENA, ZING, MOBIFONE.`);
  }

  if (!cleanCode || cleanCode.length < 8) {
    throw new Error('Mã thẻ (PIN) không hợp lệ (tối thiểu 8 ký tự).');
  }

  if (!cleanSerial || cleanSerial.length < 8) {
    throw new Error('Số serial thẻ không hợp lệ (tối thiểu 8 ký tự).');
  }

  // Nếu chưa cấu hình Partner ID / Key ở backend: Lưu đơn ở trạng thái CHỜ DUYỆT (99 / AWAITING_REVIEW)
  if (!config.isGachCardConfigured()) {
    console.warn('[GachCard] Chưa cấu hình GACHCARD_PARTNER_ID hoặc GACHCARD_PARTNER_KEY. Đơn hàng sẽ được ghi nhận chờ Admin duyệt.');
    return {
      status: 99,
      message: 'Hệ thống đã tiếp nhận thẻ cào thành công và đang chuyển cho Admin kiểm tra.',
      trans_id: 'LOCAL_' + Date.now(),
      declared_value: 10000,
      value: 10000,
      amount: 10000,
      is_simulated: true
    };
  }

  const { partnerId, partnerKey, url } = config.gachcard;
  const command = 'charging';

  const sign = generateSign({
    partnerKey,
    code: cleanCode,
    command,
    partnerId,
    requestId,
    serial: cleanSerial,
    telco: cleanTelco
  });

  const payload = {
    telco: cleanTelco,
    code: cleanCode,
    serial: cleanSerial,
    amount: Number(amount) || 10000,
    request_id: requestId,
    partner_id: partnerId,
    sign: sign,
    command: command
  };

  console.log(`[GachCard API] Đang gửi thẻ cào (${cleanTelco} - 10.000đ) với Request ID: ${requestId}...`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await res.json();
    console.log('[GachCard API Response]', data);

    return {
      status: Number(data.status),
      message: data.message || getStatusMessage(Number(data.status)),
      trans_id: data.trans_id || '',
      declared_value: Number(data.declared_value) || 10000,
      value: Number(data.value) || 0,
      amount: Number(data.amount) || 0
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[GachCard API Network Error]', err.message);
    // Khi gặp sự cố mạng, giữ đơn ở trạng thái 99 (Chờ xử lý / kiểm tra lại)
    return {
      status: 99,
      message: 'Đã gửi thẻ tới hệ thống gạch thẻ, đang chờ kết quả phản hồi: ' + err.message,
      trans_id: '',
      declared_value: 10000,
      value: 0,
      amount: 0
    };
  }
}

/**
 * Diễn giải mã trạng thái GachCard theo tài liệu API chính thức
 * @param {number} status
 * @returns {string}
 */
function getStatusMessage(status) {
  switch (status) {
    case 1:
      return 'Thẻ hợp lệ (Nạp thành công).';
    case 2:
      return 'Thẻ đúng nhưng sai mệnh giá.';
    case 3:
      return 'Thẻ không hợp lệ hoặc đã qua sử dụng.';
    case 4:
      return 'Hệ thống nhà mạng đang bảo trì.';
    case 99:
      return 'Thẻ đang chờ xử lý trên hệ thống.';
    default:
      return 'Trạng thái giao dịch: ' + status;
  }
}

module.exports = {
  ALLOWED_TELCOS,
  generateSign,
  generateCheckSign,
  maskPin,
  maskSerial,
  sendCard,
  getStatusMessage
};
