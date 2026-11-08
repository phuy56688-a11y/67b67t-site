/**
 * 67B67T — Minecraft RCON Service & Automated Provisioning Engine
 * Executes commands on Paper 1.21.11 securely and retries when server is offline
 */

const { Rcon } = require('rcon-client');
const config = require('../config/config');
const db = require('../database/db');

/**
 * Validate Minecraft Java Edition username format
 * 3-16 alphanumeric characters and underscores
 * @param {string} username
 * @returns {boolean}
 */
function isValidUsername(username) {
  if (typeof username !== 'string') return false;
  return /^[a-zA-Z0-9_]{3,16}$/.test(username.trim());
}

/**
 * Execute a Minecraft server console command via RCON
 * @param {string} command - Minecraft command (without leading slash)
 * @returns {Promise<{ success: boolean, response: string, error?: string }>}
 */
async function executeRconCommand(command) {
  if (!config.minecraft.password) {
    return {
      success: false,
      response: '',
      error: 'Mật khẩu RCON chưa được cấu hình trong file .env (RCON_PASSWORD)'
    };
  }

  let rcon;
  try {
    rcon = new Rcon({
      host: config.minecraft.host,
      port: config.minecraft.port,
      password: config.minecraft.password,
      timeout: 5000 // 5 seconds timeout
    });

    await rcon.connect();
    const response = await rcon.send(command);
    await rcon.end();

    return {
      success: true,
      response: response || 'Command executed successfully.'
    };
  } catch (err) {
    if (rcon) {
      try { await rcon.end(); } catch (_) {}
    }
    return {
      success: false,
      response: '',
      error: `Lỗi kết nối RCON Minecraft (${config.minecraft.host}:${config.minecraft.port}): ${err.message}`
    };
  }
}

/**
 * Grant Rank Plus to a player via Skript RCON command
 * @param {string} username - Validated Minecraft player name
 * @param {string} orderId - Unique order tracking ID
 * @returns {Promise<{ success: boolean, response: string, error?: string }>}
 */
async function grantRankPlus(username, orderId) {
  if (!isValidUsername(username)) {
    return {
      success: false,
      response: '',
      error: `Tên nhân vật không hợp lệ: "${username}". Tên Minecraft phải từ 3-16 ký tự hợp lệ.`
    };
  }

  // Build command using configured template
  const command = config.minecraft.rankCommand
    .replace('{username}', username)
    .replace('{orderId}', orderId);

  console.log(`📡 [Minecraft RCON] Đang gửi lệnh cấp rank: "${command}"...`);

  const result = await executeRconCommand(command);

  // Log action in audit trail
  await db.run(
    `INSERT INTO order_logs (order_id, action, details) VALUES (?, ?, ?)`,
    [
      orderId,
      result.success ? 'RCON_SUCCESS' : 'RCON_FAILED',
      result.success
        ? `Lệnh thành công: ${result.response}`
        : `Lệnh thất bại: ${result.error}`
    ]
  );

  return result;
}

/**
 * Background retry worker: re-attempts granting rank for orders marked as DELIVERY_PENDING
 */
async function processPendingDeliveries() {
  try {
    const pendingOrders = await db.all(
      `SELECT * FROM orders WHERE status = 'DELIVERY_PENDING' AND rcon_attempts < 10 ORDER BY id ASC LIMIT 5`
    );

    if (pendingOrders.length === 0) return;

    console.log(`🔄 [Retry Worker] Đang kiểm tra ${pendingOrders.length} đơn hàng chờ cấp rank...`);

    for (const order of pendingOrders) {
      const result = await grantRankPlus(order.username, order.order_id);

      if (result.success) {
        await db.run(
          `UPDATE orders 
           SET status = 'DELIVERED', 
               rcon_attempts = rcon_attempts + 1, 
               rcon_delivered_at = datetime('now', 'localtime'),
               updated_at = datetime('now', 'localtime')
           WHERE id = ?`,
          [order.id]
        );
        console.log(`✅ [Retry Worker] Đã cấp bù Rank Plus thành công cho "${order.username}" (Đơn #${order.order_id})`);
      } else {
        await db.run(
          `UPDATE orders 
           SET rcon_attempts = rcon_attempts + 1, 
               rcon_last_error = ?,
               updated_at = datetime('now', 'localtime')
           WHERE id = ?`,
          [result.error, order.id]
        );
        console.warn(`⏳ [Retry Worker] Thử lại đơn #${order.order_id} chưa thành công: ${result.error}`);
      }
    }
  } catch (err) {
    console.error('❌ [Retry Worker] Lỗi trong quá trình thử cấp lại:', err.message);
  }
}

module.exports = {
  isValidUsername,
  executeRconCommand,
  grantRankPlus,
  processPendingDeliveries
};
