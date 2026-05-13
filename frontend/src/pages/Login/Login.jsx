import { useState } from 'react';
import { Music2 } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUserDataStore from '../../store/userDataStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const loadUserData = useUserDataStore((s) => s.load);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      await loadUserData();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
            <Music2 size={32} className="text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold">Skynet Music</h1>
          <p className="text-zinc-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm border border-zinc-700 focus:outline-none focus:border-white/40 placeholder-zinc-600"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full bg-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm border border-zinc-700 focus:outline-none focus:border-white/40 placeholder-zinc-600"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-semibold rounded-lg py-2.5 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-zinc-600 text-xs mt-6">
          Your playlists and liked songs are private to your account.
        </p>
      </div>
    </div>
  );
}
