const fs = require('fs');
const path = require('path');
const mm = require('music-metadata');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');

const AUDIO_EXTS = new Set(['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.opus', '.aac']);

function walkDir(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (AUDIO_EXTS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

async function scanFile(filepath) {
  const db = getDb();
  try {
    const existing = db.prepare('SELECT * FROM songs WHERE filepath = ?').get(filepath);
    if (existing) return existing;

    const meta = await mm.parseFile(filepath, { duration: true, skipCovers: false });
    const { common, format } = meta;
    const hasCover = !!(common.picture && common.picture.length > 0);

    const song = {
      id: uuidv4(),
      filename: path.basename(filepath),
      filepath,
      title: common.title || path.basename(filepath, path.extname(filepath)),
      artist: common.artist || 'Unknown Artist',
      album: common.album || 'Unknown Album',
      duration: format.duration || 0,
      track: common.track?.no || 0,
      year: common.year || null,
      has_cover: hasCover ? 1 : 0,
    };

    db.prepare(`
      INSERT OR IGNORE INTO songs
        (id, filename, filepath, title, artist, album, duration, track, year, has_cover)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      song.id, song.filename, song.filepath, song.title, song.artist,
      song.album, song.duration, song.track, song.year, song.has_cover
    );

    return song;
  } catch (err) {
    console.error(`Error scanning ${filepath}:`, err.message);
    return null;
  }
}

async function scanMusicDir(dir) {
  const files = walkDir(dir);
  let count = 0;
  for (const file of files) {
    const result = await scanFile(file);
    if (result) count++;
  }
  return count;
}

module.exports = { scanMusicDir, scanFile };
