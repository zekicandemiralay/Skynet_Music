import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Search, RefreshCw, Music, Youtube } from 'lucide-react';
import usePlayerStore from '../../store/playerStore';

function fmt(s) {
  if (!s) return '--:--';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export default function Library() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [search, setSearch] = useState('');
  const [hovered, setHovered] = useState(null);
  const { playSong, currentSong, isPlaying } = usePlayerStore();
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/music');
      setSongs(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function scan() {
    setScanning(true);
    try {
      await fetch('/api/music/scan', { method: 'POST' });
      await load();
    } finally {
      setScanning(false);
    }
  }

  const filtered = songs.filter(
    (s) =>
      !search ||
      [s.title, s.artist, s.album].some((f) => f?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Your Library</h1>
          <p className="text-zinc-400 text-sm mt-1">{songs.length} songs</p>
        </div>
        <button
          onClick={scan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-full text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={scanning ? 'animate-spin' : ''} />
          {scanning ? 'Scanning…' : 'Scan Library'}
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search songs, artists, albums…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm bg-zinc-800 text-white placeholder-zinc-500 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
        />
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <Music size={48} className="mx-auto text-zinc-700 mb-4" />
          <p className="text-zinc-400 text-lg mb-2">
            {songs.length === 0 ? 'No music in library yet' : 'No results'}
          </p>
          {songs.length === 0 && (
            <div className="space-y-3 mt-4">
              <p className="text-zinc-600 text-sm">
                Drop files into the <span className="text-zinc-400">./music</span> folder then scan, or find music on YouTube.
              </p>
              <button
                onClick={() => navigate('/youtube')}
                className="inline-flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full text-sm font-medium transition-colors"
              >
                <Youtube size={16} />
                Find on YouTube
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-[2rem_1fr_1fr_1fr_4rem_3rem] gap-3 px-4 py-2 text-zinc-500 text-xs uppercase tracking-wider border-b border-zinc-800 mb-1">
            <span>#</span>
            <span>Title</span>
            <span>Artist</span>
            <span>Album</span>
            <span className="text-right">Time</span>
            <span />
          </div>

          {filtered.map((song, i) => {
            const active = currentSong?.id === song.id;
            const isHov = hovered === song.id;
            return (
              <div
                key={song.id}
                className={`grid grid-cols-[2rem_1fr_1fr_1fr_4rem_3rem] gap-3 px-4 py-2 rounded-md cursor-pointer transition-colors items-center ${
                  active ? 'bg-zinc-700/40' : 'hover:bg-zinc-700/20'
                }`}
                onClick={() => playSong(song, filtered, i)}
                onMouseEnter={() => setHovered(song.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="flex items-center justify-center">
                  {isHov || active ? (
                    <Play size={13} className={`fill-current ${active && isPlaying ? 'text-green-400' : 'text-white'}`} />
                  ) : (
                    <span className={`text-sm ${active ? 'text-green-400' : 'text-zinc-500'}`}>{i + 1}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-zinc-800 rounded shrink-0 overflow-hidden">
                    {song.has_cover ? (
                      <img src={`/api/music/${song.id}/cover`} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <Music size={14} />
                      </div>
                    )}
                  </div>
                  <span className={`text-sm truncate ${active ? 'text-green-400' : 'text-white'}`}>{song.title}</span>
                </div>

                <span className="text-zinc-400 text-sm truncate">{song.artist}</span>
                <span className="text-zinc-400 text-sm truncate">{song.album}</span>
                <span className="text-zinc-500 text-sm text-right">{fmt(song.duration)}</span>

                <button
                  className="opacity-0 group-hover:opacity-100 hover:!opacity-100 text-zinc-500 hover:text-red-400 transition-colors"
                  title="Find on YouTube"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/youtube?q=${encodeURIComponent(`${song.artist} ${song.title}`)}`);
                  }}
                >
                  <Youtube size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
