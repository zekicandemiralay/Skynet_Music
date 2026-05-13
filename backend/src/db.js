const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'music.db');

let db;

function getDb() {
  if (!db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDb() {
  const database = getDb();
  database.exec(`
    CREATE TABLE IF NOT EXISTS songs (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL UNIQUE,
      title TEXT,
      artist TEXT,
      album TEXT,
      duration REAL,
      track INTEGER,
      year INTEGER,
      has_cover INTEGER DEFAULT 0,
      added_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      title TEXT,
      status TEXT DEFAULT 'pending',
      progress REAL DEFAULT 0,
      error TEXT,
      song_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_data (
      user_id TEXT NOT NULL,
      data_key TEXT NOT NULL,
      encrypted_blob TEXT NOT NULL,
      iv TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, data_key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  ensureAdmin(database);
}

async function ensureAdmin(database) {
  const existing = database.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'admin'").get();
  if (existing.c > 0) return;

  const username = process.env.ADMIN_USERNAME || 'admin';
  let password = process.env.ADMIN_PASSWORD;

  if (!password) {
    password = crypto.randomBytes(12).toString('hex');
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║   Admin account created automatically  ║');
    console.log(`║   Username : ${username.padEnd(24)}║`);
    console.log(`║   Password : ${password.padEnd(24)}║`);
    console.log('║   Save this — it will not show again   ║');
    console.log('╚══════════════════════════════════════╝\n');
  }

  const salt = crypto.randomBytes(32).toString('hex');
  const hash = await bcrypt.hash(password, 12);

  database.prepare(
    'INSERT INTO users (id, username, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)'
  ).run(uuidv4(), username, hash, salt, 'admin');
}

module.exports = { getDb, initDb };
