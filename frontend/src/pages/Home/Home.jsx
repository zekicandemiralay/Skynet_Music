import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Music, Flame, Sparkles, Clock, Mic2, Library, ChevronRight } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import usePlayerStore from '../../store/playerStore';
import useMixStore from '../../store/useMixStore';

const MIX_STYLES = {
  your_mix:     { icon: Sparkles, bg: 'from-purple-900/60 to-purple-800/30', border: 'border-purple-700/30', iconColor: 'text-purple-400' },
  rediscovery:  { icon: Clock,    bg: 'from-amber-900/60  to-amber-800/30',  border: 'border-amber-700/30',  iconColor: 'text-amber-400'  },
  artist_focus: { icon: Mic2,     bg: 'from-blue-900/60   to-blue-800/30',   border: 'border-blue-700/30',   iconColor: 'text-blue-400'   },
  genre:        { icon: Music,    bg: 'from-green-900/60  to-green-800/30',  border: 'border-green-700/30',  iconColor: 'text-green-400'  },
};

function greeting(username) {
  const h = new Date().getHours();
  const part = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  return `Good ${part}, ${username}`;
}

function fmtTime(s) {
  if (!s) return null;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ''} this week`;
  if (m > 0) return `${m} min this week`;
  return null;
}

function SongCard({ song, queue, queueIndex, onPlay }) {
  const { currentSong, isPlaying } = usePlayerStore();
  const active = currentSong?.id === song.id;

  return (
    <button
      onClick={() => onPlay(song, queue, queueIndex)}
      className={`group flex items-center gap-3 rounded-lg p-2.5 text-left transition-colors w-full ${
        active ? 'bg-zinc-700/60' : 'bg-zinc-800/50 hover:bg-zinc-700/50'
      }`}
    >
      <div className="relative w-11 h-11 bg-zinc-700 rounded shrink-0 overflow-hidden">
        {song.has_cover
          ? <img src={`/api/music/${song.id}/cover`} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-zinc-500"><Music size={14} /></div>}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
          active && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <Play size={14} className="fill-current text-white ml-0.5" />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium truncate ${active ? 'text-green-400' : 'text-white'}`}>{song.title}</p>
        <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
      </div>
    </button>
  );
}

function MixCard({ mix }) {
  const navigate = useNavigate();
  const style = MIX_STYLES[mix.type] || MIX_STYLES.genre;
  const Icon = style.icon;

  return (
    <button
      onClick={() => navigate(`/mix/${mix.id}`)}
      className={`group relative flex flex-col gap-3 p-4 rounded-xl bg-gradient-to-br ${style.bg} border ${style.border} text-left hover:scale-[1.02] transition-transform w-full`}
    >
      <div className="flex items-start justify-between">
        <Icon size={22} className={style.iconColor} />
        <span className="text-zinc-500 text-xs">{mix.songs.length} songs</span>
      </div>
      <div>
        <p className="text-white font-semibold text-sm leading-tight">{mix.name}</p>
        <p className="text-zinc-400 text-xs mt-0.5 line-clamp-2">{mix.description}</p>
      </div>
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
          <Play size={12} className="fill-current text-black ml-0.5" />
        </div>
      </div>
    </button>
  );
}

export default function Home() {
  const { user } = useAuthStore();
  const { playSong, shufflePlay } = usePlayerStore();
  const { mixes } = useMixStore();
  const navigate = useNavigate();

  const [data, setData] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    fetch('/api/home', { signal: controller.signal })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => clearTimeout(timer));
    return () => { controller.abort(); clearTimeout(timer); };
  }, []);

  const recentlyPlayed = data?.recentlyPlayed || [];
  const streak = data?.streak || 0;
  const weekTime = fmtTime(data?.weekSeconds);
  const isEmpty = recentlyPlayed.length === 0 && mixes.length === 0;

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{greeting(user?.username || '')}</h1>
          {weekTime && <p className="text-zinc-400 text-sm mt-1">{weekTime}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/25 rounded-full px-3 py-1.5">
              <Flame size={14} className="text-orange-400" />
              <span className="text-orange-300 text-sm font-medium">{streak} day streak</span>
            </div>
          )}
        </div>
      </div>

      {isEmpty ? (
        /* ── Empty state ─────────────────────────────────────────────────── */
        <div className="text-center py-20">
          <Music size={52} className="mx-auto text-zinc-700 mb-4" />
          <h2 className="text-white text-xl font-semibold mb-2">Welcome to Skynet Music</h2>
          <p className="text-zinc-400 text-sm mb-6 max-w-xs mx-auto">
            Start listening to your library and your personal mixes, stats, and history will appear here.
          </p>
          <button
            onClick={() => navigate('/library')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full text-sm font-semibold hover:bg-zinc-200 transition-colors"
          >
            <Library size={16} />
            Go to Library
          </button>
        </div>
      ) : (
        <>
          {/* ── Jump back in ─────────────────────────────────────────────── */}
          {recentlyPlayed.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-bold text-lg">Jump back in</h2>
                {recentlyPlayed.length > 0 && (
                  <button
                    onClick={() => shufflePlay(recentlyPlayed)}
                    className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm transition-colors"
                  >
                    <Play size={13} className="fill-current" />
                    Play all
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {recentlyPlayed.map((song, i) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    queue={recentlyPlayed}
                    queueIndex={i}
                    onPlay={playSong}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Your Mixes ───────────────────────────────────────────────── */}
          {mixes.length > 0 && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-bold text-lg">Your Mixes</h2>
                {mixes.length > 6 && (
                  <button
                    onClick={() => navigate('/library')}
                    className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm transition-colors"
                  >
                    See all <ChevronRight size={14} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {mixes.slice(0, 6).map((mix) => (
                  <MixCard key={mix.id} mix={mix} />
                ))}
              </div>
            </section>
          )}

          {/* ── Prompt for new users with only Rediscovery ───────────────── */}
          {recentlyPlayed.length === 0 && mixes.length > 0 && (
            <div className="bg-zinc-800/40 rounded-xl p-4 mb-6 border border-zinc-700/30">
              <p className="text-white text-sm font-medium mb-1">Your personalised mixes are building up</p>
              <p className="text-zinc-400 text-xs">
                Listen to more songs and your "Your Mix" and artist mixes will appear here.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
