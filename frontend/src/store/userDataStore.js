import { create } from 'zustand';
import { encrypt, decrypt } from '../lib/crypto';
import useAuthStore from './authStore';

// All data is encrypted on the client before being saved.
// The server stores opaque blobs — it cannot read liked songs or playlists.

async function saveKey(key, data, cryptoKey) {
  const { encrypted_blob, iv } = await encrypt(cryptoKey, data);
  await fetch(`/api/me/data/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ encrypted_blob, iv }),
  });
}

async function loadKey(key, cryptoKey) {
  const res = await fetch(`/api/me/data/${key}`);
  const row = await res.json();
  if (!row) return null;
  try {
    return await decrypt(cryptoKey, row.encrypted_blob, row.iv);
  } catch {
    return null; // corrupted or wrong key
  }
}

const useUserDataStore = create((set, get) => ({
  likedSongs: [],   // string[] of song IDs
  playlists: [],    // { id, name, songs: string[] }[]
  loaded: false,

  load: async () => {
    const { cryptoKey } = useAuthStore.getState();
    if (!cryptoKey) return;
    try {
      const [liked, playlists] = await Promise.all([
        loadKey('liked_songs', cryptoKey),
        loadKey('playlists', cryptoKey),
      ]);
      set({ likedSongs: liked || [], playlists: playlists || [], loaded: true });
    } catch {
      set({ likedSongs: [], playlists: [], loaded: true });
    }
  },

  reset: () => set({ likedSongs: [], playlists: [], loaded: false }),

  // ── Liked songs ──────────────────────────────────────────────────────────

  toggleLike: async (songId) => {
    const { cryptoKey } = useAuthStore.getState();
    if (!cryptoKey) return;
    const prev = get().likedSongs;
    const next = prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId];
    set({ likedSongs: next });
    await saveKey('liked_songs', next, cryptoKey);
  },

  isLiked: (songId) => get().likedSongs.includes(songId),

  // ── Playlists ─────────────────────────────────────────────────────────────

  createPlaylist: async (name) => {
    const { cryptoKey } = useAuthStore.getState();
    if (!cryptoKey) return null;
    const playlist = { id: crypto.randomUUID(), name, songs: [] };
    const next = [...get().playlists, playlist];
    set({ playlists: next });
    await saveKey('playlists', next, cryptoKey);
    return playlist;
  },

  renamePlaylist: async (playlistId, name) => {
    const { cryptoKey } = useAuthStore.getState();
    if (!cryptoKey) return;
    const next = get().playlists.map((p) => (p.id === playlistId ? { ...p, name } : p));
    set({ playlists: next });
    await saveKey('playlists', next, cryptoKey);
  },

  deletePlaylist: async (playlistId) => {
    const { cryptoKey } = useAuthStore.getState();
    if (!cryptoKey) return;
    const next = get().playlists.filter((p) => p.id !== playlistId);
    set({ playlists: next });
    await saveKey('playlists', next, cryptoKey);
  },

  addToPlaylist: async (playlistId, songId) => {
    const { cryptoKey } = useAuthStore.getState();
    if (!cryptoKey) return;
    const next = get().playlists.map((p) =>
      p.id === playlistId && !p.songs.includes(songId)
        ? { ...p, songs: [...p.songs, songId] }
        : p
    );
    set({ playlists: next });
    await saveKey('playlists', next, cryptoKey);
  },

  removeFromPlaylist: async (playlistId, songId) => {
    const { cryptoKey } = useAuthStore.getState();
    if (!cryptoKey) return;
    const next = get().playlists.map((p) =>
      p.id === playlistId ? { ...p, songs: p.songs.filter((id) => id !== songId) } : p
    );
    set({ playlists: next });
    await saveKey('playlists', next, cryptoKey);
  },
}));

export default useUserDataStore;
