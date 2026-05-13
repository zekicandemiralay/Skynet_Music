import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from '../Sidebar/Sidebar';
import Player from '../Player/Player';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Mobile top bar */}
      <div className="flex md:hidden items-center gap-3 px-4 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <button onClick={() => setSidebarOpen(true)} className="text-zinc-400 hover:text-white transition-colors">
          <Menu size={22} />
        </button>
        <span className="text-white font-bold text-base">Skynet Music</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-black/70" />
          </div>
        )}

        {/* Sidebar — fixed overlay on mobile, static on desktop */}
        <div className={`
          fixed md:static inset-y-0 left-0 z-50
          transform transition-transform duration-300 ease-in-out
          md:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
        </div>

        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-800 to-zinc-900">
          {children}
        </main>
      </div>

      <Player />
    </div>
  );
}
