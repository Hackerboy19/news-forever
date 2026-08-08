import React from 'react';
import { CISubscriber } from '../../types';
import { Mail, Download, CheckCircle } from 'lucide-react';

interface AdminSubscribersProps {
  subscribers: CISubscriber[];
}

export const AdminSubscribers: React.FC<AdminSubscribersProps> = ({ subscribers }) => {
  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["ID,Email,Status,SubscribedAt", ...subscribers.map(s => `${s.id},${s.email},${s.status},${s.subscribed_at}`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            Newsletter Subscribers (<code className="text-rose-400 font-mono">ci_subscribers</code>)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage newsletter audience subscriptions and export CSV lists for marketing campaigns.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-sm rounded-xl transition"
        >
          <Download className="w-4 h-4" />
          Export CSV List
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Email Address</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Subscribed At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {subscribers.map((sub) => (
              <tr key={sub.id} className="hover:bg-slate-800/40 transition">
                <td className="p-4 font-mono text-xs text-slate-400">#{sub.id}</td>
                <td className="p-4 font-bold text-white flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-rose-400" />
                  {sub.email}
                </td>
                <td className="p-4">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                    {sub.status}
                  </span>
                </td>
                <td className="p-4 text-right font-mono text-xs text-slate-400">{sub.subscribed_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSubscribers;
