/**
 * Middleware Xác Thực & Phân Quyền (Authentication & RBAC Middleware)
 * 67B67T Minecraft Platform
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../database/db');

/**
 * Bắt buộc người dùng phải đăng nhập hợp lệ
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để tiếp tục' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    // Kiểm tra user trong cơ sở dữ liệu
    const user = await db.get('SELECT id, email, role, name, avatar FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại hoặc đã bị khóa' });
    }

    // Đảm bảo nếu email là phuy56688@gmail.com thì role luôn là ADMIN
    if (user.email.toLowerCase() === config.adminEmail) {
      user.role = 'ADMIN';
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' });
    }
    return res.status(401).json({ success: false, message: 'Mã xác thực không hợp lệ' });
  }
}

/**
 * Tùy chọn: nạp thông tin user nếu có đăng nhập, không chặn nếu khách vãng lai
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await db.get('SELECT id, email, role, name, avatar FROM users WHERE id = ?', [decoded.id]);
      if (user) {
        if (user.email.toLowerCase() === config.adminEmail) {
          user.role = 'ADMIN';
        }
        req.user = user;
      }
    }
  } catch (_) {
    // Bỏ qua lỗi token trong optional
  }
  next();
}

/**
 * Bắt buộc quyền ADMIN và xác minh đúng email quản trị viên duy nhất (phuy56688@gmail.com)
 */
async function requireAdmin(req, res, next) {
  await authenticate(req, res, async () => {
    const userEmail = (req.user.email || '').toLowerCase().trim();
    if (req.user.role !== 'ADMIN' || userEmail !== config.adminEmail) {
      console.warn(`[Cảnh Báo Bảo Mật] Truy cập trái phép vào API Admin từ: ${userEmail}`);
      return res.status(403).json({
        success: false,
        message: 'Từ chối quyền truy cập! Bạn không phải là quản trị viên hệ thống.'
      });
    }
    next();
  });
}

module.exports = {
  authenticate,
  optionalAuth,
  requireAdmin
};
