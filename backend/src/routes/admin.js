const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { requireAdmin } = require('../middleware/auth');

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

// Reset password — data is preserved since there is no encryption key tied to the password
router.post('/users/:id/reset-password', async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  const newHash = await bcrypt.hash(newPassword, 12);
  getDb().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.params.id);
  res.json({ ok: true });
});

module.exports = router;
