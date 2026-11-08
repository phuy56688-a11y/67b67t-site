/**
 * 67B67T — Database Module (SQLite3 with Promise Wrapper & Auto-Migrations)
 * Zero-configuration, file-based persistence for user accounts, order states and audit logs
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

// Ensure database directory exists
const dbDir = path.dirname(config.database.filename);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Ensure uploads directory exists for payment receipts
const uploadDir = path.join(__dirname, '..', 'uploads', 'receipts');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const db = new sqlite3.Database(config.database.filename, (err) => {
  if (err) {
    console.error('❌ [Database] Không thể kết nối SQLite:', err.message);
  } else {
    console.log('✅ [Database] Đã kết nối cơ sở dữ liệu SQLite:', config.database.filename);
    initSchema();
  }
});

/**
 * Run migrations to ensure all columns exist
 */
async function runMigrations() {
  try {
    const tableInfo = await all("PRAGMA table_info(orders)");
    const existingCols = tableInfo.map(col => col.name);

    const neededCols = [
      { name: 'user_id', type: 'INTEGER' },
      { name: 'buyer_email', type: 'TEXT' },
      { name: 'receipt_url', type: 'TEXT' },
      { name: 'receipt_note', type: 'TEXT' },
      { name: 'receipt_submitted_at', type: 'TEXT' },
      { name: 'reviewed_by', type: 'TEXT' },
      { name: 'reviewed_at', type: 'TEXT' },
      { name: 'rejection_reason', type: 'TEXT' }
    ];

    for (const col of neededCols) {
      if (!existingCols.includes(col.name)) {
        await run(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`);
        console.log(`[Migration] Đã bổ sung cột '${col.name}' vào bảng orders.`);
      }
    }

    // Đảm bảo tài khoản phuy56688@gmail.com luôn có quyền ADMIN nếu đã tồn tại
    if (config.adminEmail) {
      await run(`UPDATE users SET role = 'ADMIN' WHERE LOWER(email) = LOWER(?)`, [config.adminEmail]);
    }

  } catch (err) {
    console.error('❌ [Migration Error]', err.message);
  }
}

/**
 * Initialize database schema from schema.sql
 */
function initSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql, (err) => {
      if (err) {
        console.error('❌ [Database] Khởi tạo bảng thất bại:', err.message);
      } else {
        console.log('✅ [Database] Khởi tạo bảng cơ sở dữ liệu thành công.');
        runMigrations();
      }
    });
  }
}

/**
 * Promise-based init
 */
function init() {
  return new Promise((resolve, reject) => {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      db.exec(schemaSql, async (err) => {
        if (err) {
          console.error('❌ [Database] Khởi tạo bảng thất bại:', err.message);
          return reject(err);
        }
        await runMigrations();
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Helper: Run SQL statement (INSERT, UPDATE, DELETE)
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<{ lastID: number, changes: number }>}
 */
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

/**
 * Helper: Query single row
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Object|null>}
 */
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

/**
 * Helper: Query multiple rows
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Array>}
 */
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

module.exports = {
  db,
  init,
  run,
  get,
  all,
  runMigrations
};
