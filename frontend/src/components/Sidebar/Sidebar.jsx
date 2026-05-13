import { NavLink } from 'react-router-dom';
import { Music2, Youtube, Library } from 'lucide-react';

export default function Sidebar() {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'text-white bg-zinc-700' : 'text-zinc-400 hover:text-white'
    }`;

  return (
    <div className="w-60 bg-black flex flex-col gap-2 p-2 shrink-0">
      <div className="bg-zinc-900 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-6">
          <Music2 size={26} className="text-white" />
          <span className="text-white font-bold text-base">Skynet Music</span>
        </div>
        <nav className="space-y-1">
          <NavLink to="/" end className={linkClass}>
            <Library size={20} />
            Library
          </NavLink>
          <NavLink to="/youtube" className={linkClass}>
            <Youtube size={20} className="text-red-500" />
            YouTube
          </NavLink>
        </nav>
      </div>

      <div className="bg-zinc-900 rounded-lg p-4 flex-1">
        <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
          Your Library
        </p>
        <p className="text-zinc-500 text-xs leading-relaxed">
          Drop music files into the <span className="text-zinc-300">./music</span> folder and click
          "Scan Library" to load them.
        </p>
      </div>
    </div>
  );
}
