import React, { useState } from 'react';
import { CIUser } from '../../types';
import { Plus, Pencil, Trash2, Save, X, UserPlus } from 'lucide-react';

interface UserPayload {
  id?: number;
  username?: string;
  firstname?: string;
  email?: string;
  password?: string;
  is_active?: number;
}
interface AdminUsersProps {
  users: CIUser[];
  kind?: string; // "Admin" | "Sub Admin"
  currentAdminId?: number;
  onSave?: (u: UserPayload) => Promise<boolean>;
  onDelete?: (id: number) => Promise<boolean>;
}

const blankForm = { username: '', firstname: '', email: '', password: '', is_active: 1 };

export const AdminUsers: React.FC<AdminUsersProps> = ({ users, kind = 'Team', currentAdminId, onSave, onDelete }) => {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<UserPayload>({ ...blankForm });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<UserPayload>({});
  const [busy, setBusy] = useState(false);

  const set = (p: Partial<UserPayload>) => setForm((f) => ({ ...f, ...p }));
  const setE = (p: Partial<UserPayload>) => setEditForm((f) => ({ ...f, ...p }));

  const submitNew = async () => {
    if (!onSave) return;
    if (!form.username?.trim() || !form.password?.trim()) { alert('Login username and password are required.'); return; }
    setBusy(true);
    const ok = await onSave(form);
    setBusy(false);
    if (ok) { setForm({ ...blankForm }); setAdding(false); }
  };
  const startEdit = (u: CIUser) => { setEditId(u.id); setEditForm({ id: u.id, email: u.email, is_active: u.status, password: '' }); };
  const saveEdit = async () => {
    if (!onSave || !editId) return;
    setBusy(true);
    const payload: UserPayload = { id: editId, email: editForm.email, is_active: editForm.is_active };
    if (editForm.password?.trim()) payload.password = editForm.password.trim();
    const ok = await onSave(payload);
    setBusy(false);
    if (ok) setEditId(null);
  };
  const toggleActive = async (u: CIUser) => { if (onSave) await onSave({ id: u.id, is_active: u.status ? 0 : 1 }); };
  const del = async (u: CIUser) => {
    if (!onDelete) return;
    if (currentAdminId && u.id === currentAdminId) { alert('You cannot delete your own account.'); return; }
    if (!confirm(`Delete ${kind} "${u.username}"? They will lose access immediately.`)) return;
    await onDelete(u.id);
  };

  const inp = 'bg-[#0A0A0A] border border-zinc-700 text-white text-sm rounded px-3 py-2 outline-none focus:border-orange-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111] border border-[#222222] p-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 font-serif italic">{kind === 'Sub Admin' ? 'Sub Admins' : 'Team Members'}</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Log-in accounts that manage the site. Add, edit, activate/deactivate or remove.</p>
        </div>
        {onSave && (
          <button onClick={() => setAdding((a) => !a)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold rounded self-start">
            <UserPlus className="w-4 h-4" /> Add {kind === 'Sub Admin' ? 'sub admin' : 'user'}
          </button>
        )}
      </div>

      {adding && onSave && (
        <div className="bg-[#111111] border border-[#222222] p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={form.firstname || ''} onChange={(e) => set({ firstname: e.target.value })} placeholder="Full name" className={inp} />
          <input value={form.email || ''} onChange={(e) => set({ email: e.target.value })} placeholder="Email" className={inp} />
          <input value={form.username || ''} onChange={(e) => set({ username: e.target.value })} placeholder="Login username *" className={inp} />
          <input value={form.password || ''} onChange={(e) => set({ password: e.target.value })} placeholder="Password *" type="text" className={inp} />
          <label className="flex items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={form.is_active !== 0} onChange={(e) => set({ is_active: e.target.checked ? 1 : 0 })} /> Active</label>
          <div className="flex items-center gap-2 justify-end">
            <button onClick={() => { setAdding(false); setForm({ ...blankForm }); }} className="px-4 py-2 text-xs text-zinc-400 hover:text-white">Cancel</button>
            <button onClick={submitNew} disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-bold rounded"><Plus className="w-4 h-4" /> Create</button>
          </div>
        </div>
      )}

      <div className="bg-[#111111] border border-[#222222] overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-[#0A0A0A] border-b border-[#222222] text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-mono">
            <tr><th className="p-4">#</th><th className="p-4">Name & Email</th><th className="p-4">Role</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-[#222222]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-800/40 transition">
                <td className="p-4 font-mono text-xs text-zinc-500">#{u.id}</td>
                {editId === u.id ? (
                  <>
                    <td className="p-4">
                      <div className="font-bold text-white">{u.username}</div>
                      <input value={editForm.email || ''} onChange={(e) => setE({ email: e.target.value })} placeholder="Email" className={`${inp} mt-1 w-full`} />
                      <input value={editForm.password || ''} onChange={(e) => setE({ password: e.target.value })} placeholder="New password (blank = keep)" className={`${inp} mt-1 w-full`} />
                    </td>
                    <td className="p-4 text-xs text-zinc-500">{u.role}</td>
                    <td className="p-4"><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={editForm.is_active !== 0} onChange={(e) => setE({ is_active: e.target.checked ? 1 : 0 })} /> Active</label></td>
                    <td className="p-4 text-right whitespace-nowrap">
                      <button onClick={saveEdit} disabled={busy} className="p-1.5 text-emerald-400 hover:bg-zinc-800 rounded" title="Save"><Save className="w-4 h-4" /></button>
                      <button onClick={() => setEditId(null)} className="p-1.5 text-zinc-400 hover:bg-zinc-800 rounded" title="Cancel"><X className="w-4 h-4" /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-4"><div className="font-bold text-white">{u.username}</div><div className="text-xs text-zinc-400 font-mono">{u.email}</div></td>
                    <td className="p-4"><span className="px-2.5 py-1 bg-orange-600/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold uppercase tracking-widest">{u.role}</span></td>
                    <td className="p-4">
                      <button onClick={() => toggleActive(u)} disabled={!onSave} className={`px-2.5 py-0.5 border text-[10px] font-bold uppercase tracking-widest ${u.status ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-700/30 text-zinc-400 border-zinc-600'}`}>
                        {u.status ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      {onSave && <button onClick={() => startEdit(u)} className="p-1.5 text-blue-400 hover:bg-zinc-800 rounded" title="Edit"><Pencil className="w-4 h-4" /></button>}
                      {onDelete && <button onClick={() => del(u)} className="p-1.5 text-rose-400 hover:bg-zinc-800 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>}
                    </td>
                  </>
                )}
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-zinc-500 text-sm">No {kind.toLowerCase()} accounts yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
