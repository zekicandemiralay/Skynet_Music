import { create } from 'zustand';

const audio = new Audio();
audio.preload = 'metadata';

function applyMediaSessionMeta(song) {
  if (!('mediaSession' in navigator) || !song) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title || 'Unknown',
    artist: song.artist || '',
    album: song.album || '',
    artwork: song.has_cover
      ? [{ src: `/api/music/${song.id}/cover`, sizes: '512x512', type: 'image/jpeg' }]
      : [],
  });
}

const usePlayerStore = create((set, get) => ({
  currentSong: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  queue: [],
  queueIndex: -1,

  playSong: (song, queue = null, queueIndex = 0) => {
    const state = get();
    if (state.currentSong?.id === song.id) {
      state.isPlaying ? audio.pause() : audio.play();
      return;
    }
    audio.src = `/api/music/${song.id}/stream`;
    audio.play();
    applyMediaSessionMeta(song);
    set({ currentSong: song, isPlaying: true, currentTime: 0, queue: queue || [song], queueIndex });
  },

  pause: () => { audio.pause(); set({ isPlaying: false }); },
  resume: () => { audio.play(); set({ isPlaying: true }); },

  next: () => {
    const { queue, queueIndex } = get();
    if (queueIndex < queue.length - 1) {
      const idx = queueIndex + 1;
      get().playSong(queue[idx], queue, idx);
    }
  },

  prev: () => {
    const { queue, queueIndex, currentTime } = get();
    if (currentTime > 3) { audio.currentTime = 0; return; }
    if (queueIndex > 0) {
      const idx = queueIndex - 1;
      get().playSong(queue[idx], queue, idx);
    }
  },

  seek: (time) => { audio.currentTime = time; set({ currentTime: time }); },
  setVolume: (v) => { audio.volume = v; set({ volume: v }); },
}));

// Audio event → store sync
audio.addEventListener('timeupdate', () => {
  const t = audio.currentTime;
  usePlayerStore.setState({ currentTime: t });
  // Keep lock screen progress bar in sync
  if ('mediaSession' in navigator && !isNaN(audio.duration) && audio.duration > 0) {
    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate,
        position: t,
      });
    } catch {}
  }
});

audio.addEventListener('durationchange', () => usePlayerStore.setState({ duration: audio.duration || 0 }));
audio.addEventListener('ended', () => usePlayerStore.getState().next());
audio.addEventListener('pause', () => usePlayerStore.setState({ isPlaying: false }));
audio.addEventListener('play', () => usePlayerStore.setState({ isPlaying: true }));

// Lock screen / headphone controls
if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', () => {
    audio.play();
    usePlayerStore.setState({ isPlaying: true });
  });
  navigator.mediaSession.setActionHandler('pause', () => {
    audio.pause();
    usePlayerStore.setState({ isPlaying: false });
  });
  navigator.mediaSession.setActionHandler('nexttrack', () => usePlayerStore.getState().next());
  navigator.mediaSession.setActionHandler('previoustrack', () => usePlayerStore.getState().prev());
  navigator.mediaSession.setActionHandler('seekto', (d) => {
    if (d.seekTime !== undefined) {
      audio.currentTime = d.seekTime;
      usePlayerStore.setState({ currentTime: d.seekTime });
    }
  });
}

export default usePlayerStore;
