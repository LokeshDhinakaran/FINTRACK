// config/db.js — SQLite wrapper (better-sqlite3)
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

// Open DB (sync)
const db = new Database(path.join(__dirname, '../fintrack.sqlite'));

// Wrapper (same mysql2 style)
const pool = {
  query: async (sql, params = []) => {
    // SQLite Compatibility: better-sqlite3 only supports (string, number, bigint, buffer, null)
    const sanitizedParams = params.map(p => {
      if (p instanceof Date)     return p.toISOString();
      if (typeof p === 'boolean') return p ? 1 : 0;
      if (p === undefined)       return null;
      return p;
    });



    const isSelect =
      sql.trim().toUpperCase().startsWith('SELECT') ||
      sql.trim().toUpperCase().startsWith('SHOW') ||
      sql.trim().toUpperCase().startsWith('PRAGMA');

    if (isSelect) {
      const rows = db.prepare(sql).all(sanitizedParams);
      return [rows, []];
    } else {
      const result = db.prepare(sql).run(sanitizedParams);

      return [{ insertId: result.lastInsertRowid, affectedRows: result.changes }, []];
    }
  },

  execute: async function (sql, params) {
    return this.query(sql, params);
  },

  getConnection: async () => {
    return {
      query: pool.query,
      execute: pool.execute,
      release: () => { },
    };
  },
};

// Startup check
try {
  console.log('✅ SQLite connected — fintrack.sqlite');
} catch (err) {
  console.error('❌ SQLite connection failed:', err.message);
  process.exit(1);
}

module.exports = pool;