const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/me/data/:key — fetch one encrypted blob
router.get('/:key', (req, res) => {
  const row = getDb()
    .prepare('SELECT encrypted_blob, iv FROM user_data WHERE user_id = ? AND data_key = ?')
    .get(req.user.id, req.params.key);
  res.json(row || null);
});

// PUT /api/me/data/:key — save one encrypted blob
router.put('/:key', (req, res) => {
  const { encrypted_blob, iv } = req.body;
  if (!encrypted_blob || !iv) return res.status(400).json({ error: 'encrypted_blob and iv required' });

  getDb().prepare(`
    INSERT INTO user_data (user_id, data_key, encrypted_blob, iv, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, data_key)
    DO UPDATE SET encrypted_blob = excluded.encrypted_blob,
                  iv = excluded.iv,
                  updated_at = excluded.updated_at
  `).run(req.user.id, req.params.key, encrypted_blob, iv);

  res.json({ ok: true });
});

module.exports = router;
