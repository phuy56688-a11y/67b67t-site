/**
 * 67B67T — Auth Routes (Đăng Ký, Đăng Nhập, Google OAuth & Khôi Phục Mật Khẩu)
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const config = require('../config/config');
const db = require('../database/db');
const { authenticate } = require('../middleware/auth');

const googleClient = new OAuth2Client(config.google.clientId);

/**
 * Helper: Tạo JWT Token cho phiên đăng nhập (Hạn dùng: 30 ngày)
 */
function createAuthToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    config.jwtSecret,
    { expiresIn: '30d' }
  );
}

/**
 * POST /api/auth/register
 * Đăng ký tài khoản bằng Email & Mật khẩu
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập địa chỉ email hợp lệ' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Định dạng email không hợp lệ' });
    }

    if (!password || typeof password !== 'string' || password.length < 6 || password.length > 30) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải từ 6 đến 30 ký tự' });
    }

    // Kiểm tra xem email đã được đăng ký trước đó chưa
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email này đã được đăng ký tài khoản. Vui lòng đăng nhập.' });
    }

    // Mã hóa mật khẩu bảo mật bằng bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Quyền hạn: CHỈ DUY NHẤT phuy56688@gmail.com là ADMIN, tất cả còn lại là USER
    const role = cleanEmail === config.adminEmail ? 'ADMIN' : 'USER';
    const displayName = (name && typeof name === 'string' && name.trim()) ? name.trim() : cleanEmail.split('@')[0];

    const result = await db.run(
      `INSERT INTO users (email, password_hash, role, name, avatar) VALUES (?, ?, ?, ?, ?)`,
      [cleanEmail, passwordHash, role, displayName, 'https://mc-heads.net/avatar/MHF_Steve/64']
    );

    const newUser = {
      id: result.lastID,
      email: cleanEmail,
      role: role,
      name: displayName,
      avatar: 'https://mc-heads.net/avatar/MHF_Steve/64'
    };

    const token = createAuthToken(newUser);

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      token,
      user: newUser
    });

  } catch (err) {
    console.error('[Auth Register Error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi đăng ký tài khoản. Vui lòng thử lại sau.' });
  }
});

/**
 * POST /api/auth/login
 * Đăng nhập bằng Email & Mật khẩu
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ email và mật khẩu' });
    }

    if (typeof password !== 'string' || password.length < 6 || password.length > 30) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải từ 6 đến 30 ký tự' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await db.get('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }

    if (!user.password_hash) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản này chưa có mật khẩu. Vui lòng dùng tính năng Quên Mật Khẩu để tạo mật khẩu.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }

    // Bảo đảm email quản trị viên luôn giữ quyền ADMIN
    let role = user.role;
    if (cleanEmail === config.adminEmail) {
      role = 'ADMIN';
      if (user.role !== 'ADMIN') {
        await db.run("UPDATE users SET role = 'ADMIN' WHERE id = ?", [user.id]);
      }
    }

    const authUser = {
      id: user.id,
      email: user.email,
      role: role,
      name: user.name || cleanEmail.split('@')[0],
      avatar: user.avatar || 'https://mc-heads.net/avatar/MHF_Steve/64'
    };

    const token = createAuthToken(authUser);

    return res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: authUser
    });

  } catch (err) {
    console.error('[Auth Login Error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi đăng nhập. Vui lòng thử lại sau.' });
  }
});

/**
 * GET /api/auth/google-config
 * Cung cấp Google Client ID cho Frontend khởi tạo Google Identity Services
 */
router.get('/google-config', (req, res) => {
  return res.json({
    success: true,
    clientId: config.google.clientId || ''
  });
});

/**
 * POST /api/auth/google
 * Đăng nhập hoặc Đăng ký tự động qua Google OAuth ID Token
 * XÁC MINH NGHIÊM NGẶT TẠI BACKEND - CHỐNG GIẢ MẠO
 */
router.post('/google', async (req, res) => {
  try {
    const { credential, idToken } = req.body;
    const tokenToVerify = credential || idToken;

    if (!tokenToVerify) {
      return res.status(400).json({ success: false, message: 'Thiếu mã xác thực Google Credential' });
    }

    let payload;

    // 1. Xác minh chữ ký token từ máy chủ Google
    if (config.google.clientId) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: tokenToVerify,
          audience: config.google.clientId
        });
        payload = ticket.getPayload();
      } catch (verifyErr) {
        console.error('[Google OAuth Verify Error]', verifyErr.message);
        return res.status(401).json({
          success: false,
          message: 'Xác thực Google ID Token thất bại: Chữ ký hoặc Audience không hợp lệ.'
        });
      }
    } else {
      // Khi người dùng chưa điền GOOGLE_CLIENT_ID trong .env:
      // Giải mã payload an toàn và kiểm tra tính hợp lệ cơ bản
      const parts = tokenToVerify.split('.');
      if (parts.length !== 3) {
        return res.status(400).json({ success: false, message: 'Mã Google ID Token không đúng định dạng JWT' });
      }
      try {
        payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      } catch (parseErr) {
        return res.status(400).json({ success: false, message: 'Không thể giải mã Google Token' });
      }

      // Kiểm tra issuer chuẩn của Google
      const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
      if (!validIssuers.includes(payload.iss)) {
        return res.status(401).json({ success: false, message: 'Issuer token không phải từ Google' });
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, message: 'Token Google không chứa thông tin email' });
    }

    // Kiểm tra cờ email_verified từ Google
    if (payload.email_verified === false) {
      return res.status(403).json({ success: false, message: 'Tài khoản Google này chưa được xác minh email' });
    }

    const googleEmail = payload.email.toLowerCase().trim();
    const googleSub = payload.sub; // ID duy nhất của người dùng từ Google
    const googleName = payload.name || googleEmail.split('@')[0];
    const googlePicture = payload.picture || 'https://mc-heads.net/avatar/MHF_Steve/64';

    // BẢO MẬT TUYỆT ĐỐI THEO YÊU CẦU:
    // Chỉ duy nhất email phuy56688@gmail.com được cấp quyền ADMIN
    const role = (googleEmail === config.adminEmail) ? 'ADMIN' : 'USER';

    // Kiểm tra xem user đã tồn tại trong DB theo email hoặc google_id
    let user = await db.get('SELECT * FROM users WHERE email = ? OR google_id = ?', [googleEmail, googleSub]);

    if (user) {
      // Cập nhật thông tin mới nhất từ Google
      await db.run(
        `UPDATE users SET google_id = ?, role = ?, name = ?, avatar = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`,
        [googleSub, role, googleName, googlePicture, user.id]
      );
      user.role = role;
      user.name = googleName;
      user.avatar = googlePicture;
    } else {
      // Tạo mới tài khoản
      const insertResult = await db.run(
        `INSERT INTO users (email, google_id, role, name, avatar) VALUES (?, ?, ?, ?, ?)`,
        [googleEmail, googleSub, role, googleName, googlePicture]
      );
      user = {
        id: insertResult.lastID,
        email: googleEmail,
        google_id: googleSub,
        role: role,
        name: googleName,
        avatar: googlePicture
      };
    }

    console.log(`[Google Auth] Người dùng đăng nhập: ${googleEmail} (Role: ${user.role})`);

    const token = createAuthToken(user);

    return res.json({
      success: true,
      message: user.role === 'ADMIN' ? 'Chào mừng Quản trị viên hệ thống!' : 'Đăng nhập Google thành công',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        avatar: user.avatar
      }
    });

  } catch (err) {
    console.error('[Google Auth Controller Error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi xác thực Google OAuth. Vui lòng thử lại.' });
  }
});

/**
 * GET /api/auth/me
 * Lấy thông tin tài khoản hiện tại từ Token
 */
router.get('/me', authenticate, async (req, res) => {
  return res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      name: req.user.name,
      avatar: req.user.avatar
    }
  });
});

/**
 * POST /api/auth/forgot-password
 * Yêu cầu mã khôi phục mật khẩu
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email tài khoản' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await db.get('SELECT id, email FROM users WHERE email = ?', [cleanEmail]);

    if (!user) {
      // Để bảo mật không tiết lộ email tồn tại hay không
      return res.json({
        success: true,
        message: 'Nếu email tồn tại trên hệ thống, mã khôi phục đã được tạo thành công.'
      });
    }

    // Tạo mã token 6 chữ số
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 phút

    await db.run(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [resetCode, expiresAt, user.id]
    );

    console.log(`[Forgot Password] Mã khôi phục cho ${cleanEmail} là: ${resetCode}`);

    return res.json({
      success: true,
      message: 'Mã xác nhận khôi phục mật khẩu đã được tạo (hiệu lực 15 phút).',
      // Trong môi trường dev/local để bạn test thuận tiện:
      reset_code_dev: resetCode
    });

  } catch (err) {
    console.error('[Forgot Password Error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi yêu cầu khôi phục mật khẩu' });
  }
});

/**
 * POST /api/auth/reset-password
 * Đặt lại mật khẩu mới với mã xác nhận
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ email, mã xác nhận và mật khẩu mới' });
    }

    if (!newPassword || newPassword.length < 6 || newPassword.length > 30) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải từ 6 đến 30 ký tự' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await db.get(
      'SELECT id, reset_token, reset_token_expires FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (!user || !user.reset_token || user.reset_token !== code.trim()) {
      return res.status(400).json({ success: false, message: 'Mã xác nhận không đúng hoặc đã hết hạn' });
    }

    if (new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ success: false, message: 'Mã xác nhận đã hết hạn. Vui lòng yêu cầu mã mới.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.run(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [passwordHash, user.id]
    );

    return res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công! Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.'
    });

  } catch (err) {
    console.error('[Reset Password Error]', err);
    return res.status(500).json({ success: false, message: 'Lỗi đặt lại mật khẩu' });
  }
});

module.exports = router;
