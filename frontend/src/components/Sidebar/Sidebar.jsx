import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Music2, Youtube, Library, Heart, ListMusic, Plus, ShieldCheck, LogOut, Trash2, Check } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUserDataStore from '../../store/userDataStore';

function PlaylistItem({ playlist }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(playlist.name);
  const { renamePlaylist, deletePlaylist } = useUserDataStore();

  async function commitRename() {
    if (name.trim() && name !== playlist.name) await renamePlaylist(playlist.id, name.trim());
    setRenaming(false);
  }

  return (
    <div className="group flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-zinc-800 transition-colors">
      <ListMusic size={15} className="text-zinc-500 shrink-0" />
      {renaming ? (
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(false); }}
          className="flex-1 bg-zinc-700 text-white text-sm rounded px-1.5 py-0.5 focus:outline-none min-w-0"
        />
      ) : (
        <NavLink
          to={`/playlist/${playlist.id}`}
          className={({ isActive }) =>
            `flex-1 text-sm truncate transition-colors ${isActive ? 'text-white' : 'text-zinc-400 hover:text-white'}`
          }
          onDoubleClick={() => setRenaming(true)}
        >
          {playlist.name}
        </NavLink>
      )}
      <button
        onClick={() => deletePlaylist(playlist.id)}
        className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-colors shrink-0"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { playlists, likedSongs, createPlaylist } = useUserDataStore();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const navigate = useNavigate();

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'text-white bg-zinc-700' : 'text-zinc-400 hover:text-white'
    }`;

  async function handleCreatePlaylist() {
    const name = newName.trim();
    if (!name) return;
    const playlist = await createPlaylist(name);
    setNewName('');
    setCreating(false);
    if (playlist) navigate(`/playlist/${playlist.id}`);
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="w-60 bg-black flex flex-col gap-2 p-2 shrink-0 overflow-y-auto">
      {/* App header + nav */}
      <div className="bg-zinc-900 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-5">
          <Music2 size={24} className="text-white" />
          <span className="text-white font-bold text-base">Skynet Music</span>
        </div>
        <nav className="space-y-0.5">
          <NavLink to="/" end className={linkClass}>
            <Library size={18} />
            Library
          </NavLink>
          <NavLink to="/liked" className={linkClass}>
            <Heart size={18} className="text-red-400" />
            Liked Songs
            {likedSongs.length > 0 && (
              <span className="ml-auto text-xs text-zinc-500">{likedSongs.length}</span>
            )}
          </NavLink>
          <NavLink to="/youtube" className={linkClass}>
            <Youtube size={18} className="text-red-500" />
            YouTube
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass}>
              <ShieldCheck size={18} className="text-amber-400" />
              Admin
            </NavLink>
          )}
        </nav>
      </div>

      {/* Playlists */}
      <div className="bg-zinc-900 rounded-lg p-3 flex-1 min-h-0">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Playlists</span>
          <button
            onClick={() => setCreating(!creating)}
            className="text-zinc-500 hover:text-white transition-colors"
            title="New playlist"
          >
            <Plus size={16} />
          </button>
        </div>

        {creating && (
          <div className="flex items-center gap-1 mb-2">
            <input
              autoFocus
              type="text"
              placeholder="Playlist name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreatePlaylist(); if (e.key === 'Escape') setCreating(false); }}
              className="flex-1 bg-zinc-700 text-white text-xs rounded px-2 py-1.5 focus:outline-none placeholder-zinc-500"
            />
            <button onClick={handleCreatePlaylist} className="text-zinc-400 hover:text-white p-1">
              <Check size={14} />
            </button>
          </div>
        )}

        <div className="space-y-0.5">
          {playlists.length === 0 && !creating && (
            <p className="text-zinc-600 text-xs px-3 py-1">No playlists yet</p>
          )}
          {playlists.map((p) => <PlaylistItem key={p.id} playlist={p} />)}
        </div>
      </div>

      {/* User footer */}
      <div className="bg-zinc-900 rounded-lg px-3 py-2.5 flex items-center gap-2">
        <div className="w-7 h-7 bg-zinc-700 rounded-full flex items-center justify-center shrink-0">
          <span className="text-xs text-white font-medium">{user?.username?.[0]?.toUpperCase()}</span>
        </div>
        <span className="text-white text-sm font-medium flex-1 truncate">{user?.username}</span>
        <button onClick={handleLogout} className="text-zinc-500 hover:text-white transition-colors" title="Sign out">
          <LogOut size={15} />
        </button>
      </div>
    </div>
  );
}
