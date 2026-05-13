import { create } from 'zustand';

async function save(key, data) {
  await fetch(`/api/me/data/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
}

async function load(key) {
  const res = await fetch(`/api/me/data/${key}`);
  return res.ok ? res.json() : null;
}

const useUserDataStore = create((set, get) => ({
  likedSongs: [],   // string[] of song IDs
  playlists: [],    // { id, name, songs: string[] }[]
  loaded: false,

  load: async () => {
    try {
      const [liked, playlists] = await Promise.all([
        load('liked_songs'),
        load('playlists'),
      ]);
      set({ likedSongs: liked || [], playlists: playlists || [], loaded: true });
    } catch {
      set({ likedSongs: [], playlists: [], loaded: true });
    }
  },

  reset: () => set({ likedSongs: [], playlists: [], loaded: false }),

  // ── Liked songs ──────────────────────────────────────────────────────────

  toggleLike: async (songId) => {
    const prev = get().likedSongs;
    const next = prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId];
    set({ likedSongs: next });
    await save('liked_songs', next);
  },

  isLiked: (songId) => get().likedSongs.includes(songId),

  // ── Playlists ─────────────────────────────────────────────────────────────

  createPlaylist: async (name) => {
    const playlist = { id: crypto.randomUUID(), name, songs: [] };
    const next = [...get().playlists, playlist];
    set({ playlists: next });
    await save('playlists', next);
    return playlist;
  },

  renamePlaylist: async (playlistId, name) => {
    const next = get().playlists.map((p) => (p.id === playlistId ? { ...p, name } : p));
    set({ playlists: next });
    await save('playlists', next);
  },

  deletePlaylist: async (playlistId) => {
    const next = get().playlists.filter((p) => p.id !== playlistId);
    set({ playlists: next });
    await save('playlists', next);
  },

  addToPlaylist: async (playlistId, songId) => {
    const next = get().playlists.map((p) =>
      p.id === playlistId && !p.songs.includes(songId)
        ? { ...p, songs: [...p.songs, songId] }
        : p
    );
    set({ playlists: next });
    await save('playlists', next);
  },

  removeFromPlaylist: async (playlistId, songId) => {
    const next = get().playlists.map((p) =>
      p.id === playlistId ? { ...p, songs: p.songs.filter((id) => id !== songId) } : p
    );
    set({ playlists: next });
    await save('playlists', next);
  },
}));

export default useUserDataStore;
