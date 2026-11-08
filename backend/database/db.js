/**
 * 67B67T — Database Module (SQLite3 with Promise Wrapper)
 * Zero-configuration, file-based persistence for order states and audit logs
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

const db = new sqlite3.Database(config.database.filename, (err) => {
  if (err) {
    console.error('❌ [Database] Không thể kết nối SQLite:', err.message);
  } else {
    console.log('✅ [Database] Đã kết nối cơ sở dữ liệu SQLite:', config.database.filename);
    initSchema();
  }
});

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
      db.exec(schemaSql, (err) => {
        if (err) {
          console.error('❌ [Database] Khởi tạo bảng thất bại:', err.message);
          return reject(err);
        }
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
  all
};
