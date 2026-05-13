import { create } from 'zustand';
import { deriveKey, exportKey, importKey } from '../lib/crypto';

const SESSION_KEY = 'skynet_music_ck'; // sessionStorage key for the crypto key

const useAuthStore = create((set) => ({
  user: null,       // { id, username, role }
  cryptoKey: null,  // CryptoKey — in memory + sessionStorage, never sent to server
  loading: true,    // true while we're checking the existing session on mount

  login: async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json(); // { id, username, role, salt }

    // Derive encryption key from password + salt (never sent to server)
    const cryptoKey = await deriveKey(password, data.salt);
    // Persist to sessionStorage so page refreshes don't force re-login
    sessionStorage.setItem(SESSION_KEY, await exportKey(cryptoKey));

    set({ user: { id: data.id, username: data.username, role: data.role }, cryptoKey });
  },

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    sessionStorage.removeItem(SESSION_KEY);
    set({ user: null, cryptoKey: null });
  },

  // Called once on app mount — restores session from cookie + crypto key from sessionStorage
  checkSession: async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        sessionStorage.removeItem(SESSION_KEY);
        set({ user: null, cryptoKey: null, loading: false });
        return;
      }
      const user = await res.json();

      const stored = sessionStorage.getItem(SESSION_KEY);
      if (!stored) {
        // Cookie valid but no crypto key in session — force re-login so user re-derives key
        await fetch('/api/auth/logout', { method: 'POST' });
        set({ user: null, cryptoKey: null, loading: false });
        return;
      }

      const cryptoKey = await importKey(stored);
      set({ user: { id: user.id, username: user.username, role: user.role }, cryptoKey, loading: false });
    } catch {
      set({ user: null, cryptoKey: null, loading: false });
    }
  },
}));

export default useAuthStore;
