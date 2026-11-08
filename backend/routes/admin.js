/**
 * 67B67T — Admin Dashboard & Manual Order Review Routes
 * DÀNH RIÊNG CHO QUẢN TRỊ VIÊN: phuy56688@gmail.com
 */

const express = require('express');
const router = express.Router();
const config = require('../config/config');
const db = require('../database/db');
const { requireAdmin } = require('../middleware/auth');
const minecraft = require('../services/minecraft');

// Áp dụng middleware kiểm tra quyền Admin cho toàn bộ routes
router.use(requireAdmin);

/**
 * GET /api/admin/dashboard
 * Thống kê tổng quan hệ thống dành cho Admin
 */
router.get('/dashboard', async (req, res) => {
  try {
    const totalRow = await db.get('SELECT COUNT(*) AS count FROM orders');
    const pendingRow = await db.get("SELECT COUNT(*) AS count FROM orders WHERE status = 'AWAITING_REVIEW'");
    const approvedRow = await db.get("SELECT COUNT(*) AS count FROM orders WHERE status IN ('APPROVED', 'DELIVERED', 'APPROVED_PENDING_DELIVERY')");
    const rejectedRow = await db.get("SELECT COUNT(*) AS count FROM orders WHERE status = 'REJECTED'");
    const revenueRow = await db.get("SELECT SUM(amount) AS sum FROM orders WHERE status IN ('APPROVED', 'DELIVERED')");

    const recentOrders = await db.all(
      `SELECT id, order_id, user_id, buyer_email, username, rank_name, amount, status, 
              receipt_url, receipt_note, receipt_submitted_at, reviewed_by, reviewed_at, rejection_reason, created_at
       FROM orders 
       ORDER BY id DESC LIMIT 10`
    );

    return res.json({
      success: true,
      stats: {
        totalOrders: totalRow.count || 0,
        pendingReview: pendingRow.count || 0,
        approvedOrders: approvedRow.count || 0,
        rejectedOrders: rejectedRow.count || 0,
        totalRevenue: revenueRow.sum || 0
      },
      recentOrders
    });
  } catch (err) {
    console.error('[Admin Dashboard Error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi tải thống kê Dashboard' });
  }
});

/**
 * GET /api/admin/orders
 * Danh sách đơn hàng có tìm kiếm và lọc trạng thái
 */
router.get('/orders', async (req, res) => {
  try {
    const { status, q, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClauses = [];
    let params = [];

    if (status && status !== 'ALL') {
      if (status === 'APPROVED') {
        whereClauses.push("status IN ('APPROVED', 'DELIVERED', 'APPROVED_PENDING_DELIVERY')");
      } else {
        whereClauses.push("status = ?");
        params.push(status);
      }
    }

    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      whereClauses.push("(order_id LIKE ? OR username LIKE ? OR buyer_email LIKE ?)");
      params.push(term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = await db.get(`SELECT COUNT(*) as total FROM orders ${whereSql}`, params);
    const total = countRow.total || 0;

    const orders = await db.all(
      `SELECT id, order_id, user_id, buyer_email, username, rank_name, amount, status, 
              receipt_url, receipt_note, receipt_submitted_at, reviewed_by, reviewed_at, rejection_reason, rcon_delivered_at, created_at
       FROM orders 
       ${whereSql}
       ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), offset]
    );

    return res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)) || 1,
      orders
    });
  } catch (err) {
    console.error('[Admin Get Orders Error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi tải danh sách đơn hàng' });
  }
});

/**
 * POST /api/admin/orders/:orderId/approve
 * DUYỆT ĐƠN HÀNG THỦ CÔNG & KÍCH HOẠT RANK PLUS CHO MINECRAFT
 * Chống cấp trùng (Idempotent), ghi lại người duyệt & thời gian duyệt
 */
router.post('/orders/:orderId/approve', async (req, res) => {
  try {
    const { orderId } = req.params;
    const adminEmail = req.user.email;

    const order = await db.get('SELECT * FROM orders WHERE order_id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Chống duyệt nhiều lần (Idempotency check)
    if (order.status === 'APPROVED' || order.status === 'DELIVERED') {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng #${orderId} đã được duyệt trước đó bởi ${order.reviewed_by || 'quản trị viên'}.`
      });
    }

    console.log(`👮‍♂️ [Admin Review] Quản trị viên ${adminEmail} đang duyệt đơn #${orderId} cho nhân vật "${order.username}"...`);

    // Gửi lệnh cấp Rank Plus qua RCON đến Minecraft Paper 1.21.11
    const rconResult = await minecraft.grantRankPlus(order.username, order.order_id);

    let newStatus = 'APPROVED';
    let responseMsg = `Chúc mừng! Đơn hàng #${orderId} đã được duyệt thành công. Rank Plus đã được cấp cho tài khoản Minecraft "${order.username}".`;

    if (rconResult.success) {
      await db.run(
        `UPDATE orders 
         SET status = 'APPROVED',
             rcon_delivered_at = datetime('now', 'localtime'),
             reviewed_by = ?,
             reviewed_at = datetime('now', 'localtime'),
             updated_at = datetime('now', 'localtime')
         WHERE id = ?`,
        [adminEmail, order.id]
      );
    } else {
      // Máy chủ Minecraft offline hoặc gặp sự cố kết nối: Lưu trạng thái chờ cấp bù an toàn
      newStatus = 'APPROVED_PENDING_DELIVERY';
      responseMsg = `Đã duyệt đơn #${orderId}! Tuy nhiên máy chủ Minecraft đang offline (${rconResult.error}). Hệ thống đã lưu trữ và sẽ tự động cấp bù ngay khi server online.`;

      await db.run(
        `UPDATE orders 
         SET status = 'APPROVED_PENDING_DELIVERY',
             rcon_last_error = ?,
             reviewed_by = ?,
             reviewed_at = datetime('now', 'localtime'),
             updated_at = datetime('now', 'localtime')
         WHERE id = ?`,
        [rconResult.error, adminEmail, order.id]
      );
    }

    // Ghi log kiểm toán thao tác admin
    await db.run(
      `INSERT INTO admin_logs (admin_email, action, order_id, details) VALUES (?, 'APPROVE_ORDER', ?, ?)`,
      [adminEmail, orderId, `Duyệt đơn cấp Rank Plus cho ${order.username} (Trạng thái RCON: ${rconResult.success ? 'Thành công' : 'Offline/Chờ bù'})`]
    );

    await db.run(
      `INSERT INTO order_logs (order_id, action, details) VALUES (?, 'APPROVED', ?)`,
      [orderId, `Đơn hàng được duyệt bởi quản trị viên ${adminEmail}. Trạng thái mới: ${newStatus}`]
    );

    return res.json({
      success: true,
      message: responseMsg,
      status: newStatus,
      rcon_success: rconResult.success
    });

  } catch (err) {
    console.error('[Admin Approve Error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi duyệt đơn hàng: ' + err.message });
  }
});

/**
 * POST /api/admin/orders/:orderId/reject
 * TỪ CHỐI ĐƠN HÀNG VÀ GHI RÕ LÝ DO
 */
router.post('/orders/:orderId/reject', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const adminEmail = req.user.email;

    const order = await db.get('SELECT * FROM orders WHERE order_id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (order.status === 'APPROVED' || order.status === 'DELIVERED') {
      return res.status(400).json({
        success: false,
        message: 'Không thể từ chối đơn hàng đã được duyệt và cấp rank thành công.'
      });
    }

    const rejectionReason = (reason && typeof reason === 'string' && reason.trim())
      ? reason.trim()
      : 'Biên lai không hợp lệ hoặc chưa nhận được tiền trong tài khoản.';

    await db.run(
      `UPDATE orders 
       SET status = 'REJECTED',
           rejection_reason = ?,
           reviewed_by = ?,
           reviewed_at = datetime('now', 'localtime'),
           updated_at = datetime('now', 'localtime')
       WHERE id = ?`,
      [rejectionReason, adminEmail, order.id]
    );

    // Ghi log kiểm toán
    await db.run(
      `INSERT INTO admin_logs (admin_email, action, order_id, details) VALUES (?, 'REJECT_ORDER', ?, ?)`,
      [adminEmail, orderId, `Từ chối đơn hàng của ${order.username}. Lý do: ${rejectionReason}`]
    );

    await db.run(
      `INSERT INTO order_logs (order_id, action, details) VALUES (?, 'REJECTED', ?)`,
      [orderId, `Đơn hàng bị từ chối bởi ${adminEmail}. Lý do: ${rejectionReason}`]
    );

    return res.json({
      success: true,
      message: `Đã từ chối đơn hàng #${orderId}.`,
      status: 'REJECTED',
      rejection_reason: rejectionReason
    });

  } catch (err) {
    console.error('[Admin Reject Error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi từ chối đơn hàng: ' + err.message });
  }
});

/**
 * GET /api/admin/logs
 * Xem nhật ký kiểm toán thao tác quản trị
 */
router.get('/logs', async (req, res) => {
  try {
    const logs = await db.all(
      'SELECT id, admin_email, action, order_id, details, created_at FROM admin_logs ORDER BY id DESC LIMIT 50'
    );
    return res.json({ success: true, logs });
  } catch (err) {
    console.error('[Admin Logs Error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi tải nhật ký quản trị' });
  }
});

module.exports = router;
