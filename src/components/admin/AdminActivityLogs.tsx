import React, { useState } from 'react';
import { CIActivityLog } from '../../types';
import { ShieldAlert, Search, Clock, User, HardDrive } from 'lucide-react';

interface AdminActivityLogsProps {
  activityLogs: CIActivityLog[];
}

export const AdminActivityLogs: React.FC<AdminActivityLogsProps> = ({ activityLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  const filteredLogs = activityLogs.filter((log) => {
    const matchesSearch = 
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address.includes(searchTerm);

    const matchesModule = moduleFilter === 'all' || log.module.toLowerCase() === moduleFilter.toLowerCase();
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            Activity Log
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            A record of everything the team has done — edits, new articles, published items, and setting changes.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by User, Activity, or IP Address..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-rose-500"
          />
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-rose-500"
        >
          <option value="all">All Modules</option>
          <option value="Blog">Blog</option>
          <option value="Category">Category</option>
          <option value="Advertisement">Advertisement</option>
          <option value="Setting">Setting</option>
          <option value="Image Library">Image Library</option>
        </select>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">User</th>
              <th className="p-4">Module</th>
              <th className="p-4">Activity Description</th>
              <th className="p-4">IP Address</th>
              <th className="p-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/40 transition">
                <td className="p-4 font-mono text-xs text-slate-400">#{log.id}</td>
                <td className="p-4 font-bold text-white flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-rose-400" />
                  {log.user_name}
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded bg-slate-800 text-rose-300 text-xs font-mono border border-slate-700">
                    {log.module}
                  </span>
                </td>
                <td className="p-4 text-slate-200">{log.activity}</td>
                <td className="p-4 font-mono text-xs text-slate-400">{log.ip_address}</td>
                <td className="p-4 text-right font-mono text-xs text-slate-400">{log.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminActivityLogs;
