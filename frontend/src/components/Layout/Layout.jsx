import Sidebar from '../Sidebar/Sidebar';
import Player from '../Player/Player';

export default function Layout({ children }) {
  return (
    <div className="flex flex-col h-screen bg-black">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-800 to-zinc-900">
          {children}
        </main>
      </div>
      <Player />
    </div>
  );
}
