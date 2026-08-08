import React from 'react';
import { CIUser } from '../../types';
import { Users, Shield, UserCheck } from 'lucide-react';

interface AdminUsersProps {
  users: CIUser[];
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ users }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111] border border-[#222222] p-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 font-serif italic">
            Editorial Staff & Role Management (<code className="text-orange-400 font-mono text-xs">ci_users</code>)
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Role-based editorial staff permissions and access control management.
          </p>
        </div>
      </div>

      <div className="bg-[#111111] border border-[#222222] overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-[#0A0A0A] border-b border-[#222222] text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-mono">
            <tr>
              <th className="p-4">User ID</th>
              <th className="p-4">Username & Email</th>
              <th className="p-4">Assigned Role</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Last Active Session</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222222]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-800/40 transition">
                <td className="p-4 font-mono text-xs text-zinc-500">#{u.id}</td>
                <td className="p-4">
                  <div className="font-bold text-white">{u.username}</div>
                  <div className="text-xs text-zinc-400 font-mono">{u.email}</div>
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-1 bg-orange-600/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold uppercase tracking-widest">
                    {u.role}
                  </span>
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-widest">
                    Active
                  </span>
                </td>
                <td className="p-4 text-right font-mono text-xs text-zinc-500">{u.last_login}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
