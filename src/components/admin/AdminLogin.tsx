import React, { useState } from 'react';
import { Lock, LogIn } from 'lucide-react';
import Logo from '../ui/Logo';
import { AdminCredentials } from '../../lib/adminAuth';

interface AdminLoginProps {
  onLogin: (creds: AdminCredentials) => void;
  onBackToSite: () => void;
}

/**
 * Admin sign-in gate — credentials verified server-side against the real
 * ci_admin table before any write endpoint accepts a request.
 */
export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onBackToSite }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Login failed');
        return;
      }
      const admin = await res.json();
      onLogin({ username, password, name: admin.name, admin_id: admin.admin_id });
    } catch {
      setError('Network error — is the API reachable?');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-stone-200 shadow-2xl">
        <div className="p-6 border-b border-stone-200 bg-[#FAF8F5] text-center space-y-2">
          <Logo className="w-14 h-14 mx-auto" />
          <h1 className="font-serif font-black text-2xl text-stone-900">
            News<span className="text-[#991B1B]">Forever</span>
          </h1>
          <p className="text-[10px] font-mono uppercase tracking-widest text-stone-500 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Editorial Admin Panel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-600">Username</label>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 text-sm text-stone-900 focus:outline-none focus:border-[#991B1B]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-600">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 text-sm text-stone-900 focus:outline-none focus:border-[#991B1B]"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{error}</div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 bg-[#991B1B] hover:bg-[#7A0C0C] disabled:opacity-60 text-white font-bold text-xs uppercase tracking-widest transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-3.5 h-3.5" />
            {busy ? 'Verifying…' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={onBackToSite}
            className="w-full text-center text-[11px] text-stone-500 hover:text-[#991B1B] transition"
          >
            ← Back to the news portal
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
