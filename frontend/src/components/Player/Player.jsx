import usePlayerStore from '../../store/playerStore';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music } from 'lucide-react';

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function TrackBar({ value, max, onChange, color = 'white' }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <input
      type="range"
      min={0}
      max={max || 0}
      value={value}
      step={0.1}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{ background: `linear-gradient(to right, ${color} ${pct}%, #535353 ${pct}%)` }}
      className="w-full"
    />
  );
}

export default function Player() {
  const { currentSong, isPlaying, currentTime, duration, volume, pause, resume, next, prev, seek, setVolume } =
    usePlayerStore();

  return (
    <div className="h-24 bg-zinc-900 border-t border-zinc-800 flex items-center px-4 gap-4 shrink-0">
      {/* Song info */}
      <div className="flex items-center gap-3 w-56 shrink-0 min-w-0">
        {currentSong ? (
          <>
            <div className="w-14 h-14 bg-zinc-800 rounded shrink-0 overflow-hidden">
              {currentSong.has_cover ? (
                <img src={`/api/music/${currentSong.id}/cover`} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <Music size={18} />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{currentSong.title}</p>
              <p className="text-zinc-400 text-xs truncate">{currentSong.artist}</p>
            </div>
          </>
        ) : (
          <p className="text-zinc-600 text-sm">Nothing playing</p>
        )}
      </div>

      {/* Center controls */}
      <div className="flex flex-col items-center flex-1 gap-2">
        <div className="flex items-center gap-6">
          <button onClick={prev} disabled={!currentSong} className="text-zinc-400 hover:text-white transition-colors disabled:opacity-30">
            <SkipBack size={20} />
          </button>
          <button
            onClick={isPlaying ? pause : resume}
            disabled={!currentSong}
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-30"
          >
            {isPlaying ? <Pause size={16} className="text-black" /> : <Play size={16} className="text-black ml-0.5" />}
          </button>
          <button onClick={next} disabled={!currentSong} className="text-zinc-400 hover:text-white transition-colors disabled:opacity-30">
            <SkipForward size={20} />
          </button>
        </div>
        <div className="flex items-center gap-2 w-full max-w-md">
          <span className="text-zinc-500 text-xs w-10 text-right">{fmt(currentTime)}</span>
          <TrackBar value={currentTime} max={duration} onChange={seek} />
          <span className="text-zinc-500 text-xs w-10">{fmt(duration)}</span>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 w-36 shrink-0">
        <Volume2 size={16} className="text-zinc-400 shrink-0" />
        <TrackBar value={volume} max={1} onChange={setVolume} />
      </div>
    </div>
  );
}
