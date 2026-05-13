const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { requireAdmin } = require('../middleware/auth');

// All routes in this file require admin
router.use(requireAdmin);

router.get('/users', (_req, res) => {
  const users = getDb()
    .prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at')
    .all();
  res.json(users);
});

router.post('/users', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const salt = crypto.randomBytes(32).toString('hex');
  const hash = await bcrypt.hash(password, 12);

  try {
    const id = uuidv4();
    getDb().prepare(
      'INSERT INTO users (id, username, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)'
    ).run(id, username, hash, salt, 'user');
    res.json({ id, username, role: 'user' });
  } catch {
    res.status(409).json({ error: 'Username already taken' });
  }
});

router.delete('/users/:id', (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }
  getDb().prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Reset a user's password (clears their encrypted data — new key, fresh start)
router.post('/users/:id/reset-password', async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const db = getDb();
  const crypto = require('crypto');
  const newSalt = crypto.randomBytes(32).toString('hex');
  const newHash = await bcrypt.hash(newPassword, 12);

  db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(newHash, newSalt, req.params.id);
  db.prepare('DELETE FROM user_data WHERE user_id = ?').run(req.params.id);

  res.json({ ok: true });
});

module.exports = router;
