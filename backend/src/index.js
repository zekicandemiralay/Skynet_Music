const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');
const musicRoutes = require('./routes/music');
const youtubeRoutes = require('./routes/youtube');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

initDb();

app.use('/api/music', musicRoutes);
app.use('/api/youtube', youtubeRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Music directory: ${process.env.MUSIC_DIR || '/music'}`);
});
