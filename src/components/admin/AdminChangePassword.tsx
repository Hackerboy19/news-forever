import React, { useState } from 'react';
import { KeyRound, Check } from 'lucide-react';
import { AdminCredentials, adminHeaders, saveAdminSession } from '../../lib/adminAuth';

interface AdminChangePasswordProps {
  adminAuth: AdminCredentials;
  onPasswordChanged: (creds: AdminCredentials) => void;
}

/**
 * Change the signed-in admin's password — updates the real ci_admin row
 * (directly or via the cPanel bridge), so the old panel accepts the new
 * password too.
 */
export const AdminChangePassword: React.FC<AdminChangePasswordProps> = ({ adminAuth, onPasswordChanged }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (next.length < 6) return setMsg({ ok: false, text: 'New password must be at least 6 characters.' });
    if (next !== confirm) return setMsg({ ok: false, text: 'New passwords do not match.' });
    setBusy(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders({ ...adminAuth, password: current }),
        },
        body: JSON.stringify({ new_password: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || 'Password change failed.' });
        return;
      }
      const updated = { ...adminAuth, password: next };
      saveAdminSession(updated);
      onPasswordChanged(updated);
      setMsg({ ok: true, text: 'Password updated — the old cPanel panel accepts the new password too.' });
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch {
      setMsg({ ok: false, text: 'Network error.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md bg-white border border-[#E7E5E4] shadow-xs">
      <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-[#991B1B]" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-stone-900">Change Password</h2>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <p className="text-xs text-stone-500">
          Signed in as <span className="font-bold text-stone-800">{adminAuth.username}</span> — the change writes to the
          live <code className="text-[#991B1B] font-mono">ci_admin</code> record.
        </p>
        {[
          { label: 'Current Password', value: current, set: setCurrent, ac: 'current-password' },
          { label: 'New Password', value: next, set: setNext, ac: 'new-password' },
          { label: 'Confirm New Password', value: confirm, set: setConfirm, ac: 'new-password' },
        ].map((f) => (
          <div key={f.label} className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-600">{f.label}</label>
            <input
              type="password"
              required
              autoComplete={f.ac}
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 text-sm text-stone-900 focus:outline-none focus:border-[#991B1B]"
            />
          </div>
        ))}

        {msg && (
          <div
            className={`p-2.5 text-xs font-semibold border flex items-center gap-1.5 ${
              msg.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {msg.ok && <Check className="w-3.5 h-3.5" />}
            {msg.text}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 bg-[#991B1B] hover:bg-[#7A0C0C] disabled:opacity-60 text-white font-bold text-xs uppercase tracking-widest transition"
        >
          {busy ? 'Updating…' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

export default AdminChangePassword;
