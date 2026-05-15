import { useState, useEffect } from 'react';
import usePlayerStore from '../../store/playerStore';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music, Shuffle, ChevronDown } from 'lucide-react';

function fmt(s) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function TrackBar({ value, max, onChange, large = false }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <input
      type="range"
      min={0}
      max={max || 0}
      value={value}
      step={0.1}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{ background: `linear-gradient(to right, white ${pct}%, #3f3f46 ${pct}%)` }}
      className={`w-full ${large ? 'track-bar-large' : ''}`}
    />
  );
}

function EqBars({ isPlaying, size = 'sm' }) {
  const h = size === 'lg' ? 'h-5' : 'h-3.5';
  return (
    <div className={`flex items-end gap-[2px] ${h} shrink-0 ${isPlaying ? '' : 'eq-paused'}`}>
      <span className="eq-bar" />
      <span className="eq-bar" />
      <span className="eq-bar" />
    </div>
  );
}

function Cover({ song, className = '' }) {
  return (
    <div className={`bg-zinc-800 overflow-hidden flex items-center justify-center ${className}`}>
      {song?.has_cover
        ? <img src={`/api/music/${song.id}/cover`} alt="" className="w-full h-full object-cover" />
        : <Music size={24} className="text-zinc-600" />}
    </div>
  );
}

function NowPlayingExpanded({ onClose }) {
  const {
    currentSong, isPlaying, currentTime, duration, shuffle,
    pause, resume, next, prev, seek, toggleShuffle,
  } = usePlayerStore();

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-4 shrink-0">
        <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white transition-colors">
          <ChevronDown size={28} />
        </button>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Now Playing</p>
        <div className="w-9" />
      </div>

      {/* Album art */}
      <div className="flex-1 flex items-center justify-center px-10 py-4 min-h-0">
        <div className="w-full max-w-xs aspect-square rounded-2xl overflow-hidden shadow-2xl">
          <Cover song={currentSong} className="w-full h-full rounded-2xl" />
        </div>
      </div>

      {/* Song info + controls */}
      <div className="px-8 pb-12 pt-4 space-y-5 shrink-0">
        {/* Title + artist */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            {currentSong && <EqBars isPlaying={isPlaying} size="lg" />}
            <h2 className="text-2xl font-bold text-green-400 truncate">{currentSong?.title ?? 'Nothing playing'}</h2>
          </div>
          <p className="text-zinc-400 text-base truncate">{currentSong?.artist}</p>
          {currentSong?.album && <p className="text-zinc-600 text-sm truncate mt-0.5">{currentSong.album}</p>}
        </div>

        {/* Seek bar */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            step={0.1}
            onChange={(e) => seek(parseFloat(e.target.value))}
            style={{ background: `linear-gradient(to right, white ${pct}%, #3f3f46 ${pct}%)` }}
            className="w-full track-bar-large"
          />
          <div className="flex justify-between text-xs text-zinc-500">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={toggleShuffle}
            className={`p-2 transition-colors ${shuffle ? 'text-green-400' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <Shuffle size={22} />
          </button>
          <button
            onClick={prev}
            disabled={!currentSong}
            className="p-2 text-zinc-300 hover:text-white transition-colors disabled:opacity-30"
          >
            <SkipBack size={32} className="fill-current" />
          </button>
          <button
            onClick={isPlaying ? pause : resume}
            disabled={!currentSong}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg disabled:opacity-30"
          >
            {isPlaying
              ? <Pause size={26} className="text-black" />
              : <Play size={26} className="text-black ml-1" />}
          </button>
          <button
            onClick={next}
            disabled={!currentSong}
            className="p-2 text-zinc-300 hover:text-white transition-colors disabled:opacity-30"
          >
            <SkipForward size={32} className="fill-current" />
          </button>
          <div className="w-10" />
        </div>
      </div>
    </div>
  );
}

export default function Player() {
  const {
    currentSong, isPlaying, currentTime, duration, volume, shuffle,
    pause, resume, next, prev, seek, setVolume, toggleShuffle,
  } = usePlayerStore();
  const [expanded, setExpanded] = useState(false);

  // Close with Escape key
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e) => { if (e.key === 'Escape') setExpanded(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [expanded]);

  const open = () => { if (currentSong) setExpanded(true); };

  return (
    <>
      {/* Expanded now-playing overlay — always in DOM so slide animation works */}
      <div
        className={`fixed inset-0 z-50 transition-transform duration-300 ease-out ${expanded ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`}
      >
        <NowPlayingExpanded onClose={() => setExpanded(false)} />
      </div>

      <div className="bg-zinc-900 border-t border-zinc-800 shrink-0">

        {/* ── Mobile player ── */}
        <div className="flex md:hidden items-center gap-2 px-3 py-2">
          {/* Clickable song info — opens expanded view */}
          <button
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
            onClick={open}
            disabled={!currentSong}
          >
            <Cover
              song={currentSong}
              className="w-12 h-12 rounded shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {currentSong && <EqBars isPlaying={isPlaying} />}
                <p className={`text-sm font-medium truncate ${currentSong ? 'text-green-400' : 'text-zinc-500'}`}>
                  {currentSong?.title ?? 'Nothing playing'}
                </p>
              </div>
              <p className="text-zinc-400 text-xs truncate">{currentSong?.artist ?? ''}</p>
            </div>
          </button>

          {/* Controls — separate so they don't trigger expand */}
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={prev} disabled={!currentSong} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30">
              <SkipBack size={20} />
            </button>
            <button
              onClick={isPlaying ? pause : resume}
              disabled={!currentSong}
              className="w-9 h-9 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-30 shrink-0"
            >
              {isPlaying ? <Pause size={16} className="text-black" /> : <Play size={16} className="text-black ml-0.5" />}
            </button>
            <button onClick={next} disabled={!currentSong} className="p-2 text-zinc-400 hover:text-white disabled:opacity-30">
              <SkipForward size={20} />
            </button>
          </div>
        </div>

        {/* ── Desktop player ── */}
        <div className="hidden md:flex items-center px-4 py-0 h-24 gap-4">

          {/* Song info — clickable to open expanded view */}
          <button
            className="flex items-center gap-3 w-64 shrink-0 min-w-0 text-left group"
            onClick={open}
            disabled={!currentSong}
          >
            <Cover song={currentSong} className="w-14 h-14 rounded shrink-0 group-hover:opacity-80 transition-opacity" />
            {currentSong ? (
              <div className="min-w-0 flex items-center gap-2">
                <EqBars isPlaying={isPlaying} />
                <div className="min-w-0">
                  <p className="text-green-400 text-sm font-medium truncate group-hover:underline">{currentSong.title}</p>
                  <p className="text-zinc-400 text-xs truncate">{currentSong.artist}</p>
                </div>
              </div>
            ) : (
              <p className="text-zinc-600 text-sm">Nothing playing</p>
            )}
          </button>

          {/* Center controls + seek */}
          <div className="flex flex-col items-center flex-1 gap-2">
            <div className="flex items-center gap-6">
              <button
                onClick={toggleShuffle}
                className={`transition-colors ${shuffle ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                title={shuffle ? 'Shuffle on' : 'Shuffle off'}
              >
                <Shuffle size={16} />
              </button>
              <button onClick={prev} disabled={!currentSong} className="text-zinc-400 hover:text-white transition-colors disabled:opacity-30">
                <SkipBack size={20} />
              </button>
              <button
                onClick={isPlaying ? pause : resume}
                disabled={!currentSong}
                className="w-9 h-9 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-30 shrink-0"
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
      </div>
    </>
  );
}
