import React from 'react';
import { CIBlog, CIActivityLog, CIAdvertisement, CICategory } from '../../types';
import { 
  FileText, 
  FolderTree, 
  Eye, 
  TrendingUp, 
  Clock, 
  ShieldAlert, 
  BarChart2, 
  MousePointer, 
  Plus,
  ArrowRight
} from 'lucide-react';

interface AdminDashboardProps {
  blogs: CIBlog[];
  categories: CICategory[];
  ads: CIAdvertisement[];
  activityLogs: CIActivityLog[];
  onNavigate: (tab: string) => void;
  onNewArticle: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  blogs,
  categories,
  ads,
  activityLogs,
  onNavigate,
  onNewArticle,
}) => {
  const totalViews = blogs.reduce((acc, b) => acc + b.views, 0);
  const activeBlogs = blogs.filter(b => b.status === 1).length;
  const totalAdClicks = ads.reduce((acc, a) => acc + a.click_count, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Headless Admin Operations
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-medium">
              CodeIgniter DB Synced
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time control center managing legacy MySQL records with modern headless reactivity.
          </p>
        </div>

        <button
          onClick={onNewArticle}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-600/25 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Article
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Total Published</span>
            <FileText className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-white">{activeBlogs} <span className="text-xs text-slate-400 font-normal">/ {blogs.length} Total</span></div>
          <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12.4% this week
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Article Impressions</span>
            <Eye className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalViews.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 font-mono">
            Organic Pageviews
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Categories</span>
            <FolderTree className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{categories.length}</div>
          <div className="text-[11px] text-slate-400 font-mono">
            Structured Taxonomies
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>Ad Clicks</span>
            <MousePointer className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalAdClicks.toLocaleString()}</div>
          <div className="text-[11px] text-purple-400 font-mono">
            Monetization CTR 2.8%
          </div>
        </div>
      </div>

      {/* Main Grid: Activity Log Widget & Ad Campaign Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Log Widget (Reads from ci_activity_log) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Recent Activity
              </h2>
              <p className="text-xs text-slate-400">Who changed what, and when</p>
            </div>
            <button
              onClick={() => onNavigate('Activity Log')}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
            >
              View Full Log <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {activityLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{log.user_name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-rose-300 border border-slate-700 font-mono">
                      {log.module}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{log.activity}</p>
                </div>
                <div className="text-right text-[10px] text-slate-400 font-mono shrink-0 ml-4">
                  <div className="flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {log.created_at}
                  </div>
                  <div className="text-slate-400 mt-0.5">{log.ip_address}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ad Performance Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-400" />
              Ads
            </h2>
            <button
              onClick={() => onNavigate('Advertisement')}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
            >
              Manage Ads
            </button>
          </div>

          <div className="space-y-3">
            {ads.map((ad) => (
              <div key={ad.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-white">
                  <span className="truncate max-w-[180px]">{ad.title}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${ad.status === 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {ad.position}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Clicks: <strong className="text-white">{ad.click_count}</strong></span>
                  <span>Impressions: <strong className="text-white">{ad.impressions.toLocaleString()}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
