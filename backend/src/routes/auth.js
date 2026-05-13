const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const SECRET = () => process.env.JWT_SECRET || 'insecure-default-change-in-production';
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  // set secure=true only when explicitly configured (HTTPS in production)
  secure: process.env.SECURE_COOKIE === 'true',
};

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const user = getDb().prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET(),
    { expiresIn: '7d' }
  );

  res.cookie('token', token, COOKIE_OPTS);
  // Return salt so the client can derive the crypto key from the password
  res.json({ id: user.id, username: user.username, role: user.role, salt: user.salt });
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  const user = getDb()
    .prepare('SELECT id, username, role, salt FROM users WHERE id = ?')
    .get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Change own password
router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
    return res.status(401).json({ error: 'Current password is wrong' });
  }

  // New password means a new salt and a new crypto key on the client.
  // All existing encrypted user_data will be unreadable — clear it.
  const crypto = require('crypto');
  const newSalt = crypto.randomBytes(32).toString('hex');
  const newHash = await bcrypt.hash(newPassword, 12);

  db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(newHash, newSalt, req.user.id);
  db.prepare('DELETE FROM user_data WHERE user_id = ?').run(req.user.id);

  res.json({ ok: true, note: 'Liked songs and playlists were cleared because the encryption key changed.' });
});

module.exports = router;
