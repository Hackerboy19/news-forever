import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  User, 
  Users, 
  FolderTree, 
  Tag, 
  BarChart2, 
  FileText, 
  Mail, 
  Image as ImageIcon, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  LogOut,
  Bell,
  Search,
  Menu,
  ShieldCheck
} from 'lucide-react';

interface AdminLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onSwitchToPublic: () => void;
  adminName?: string;
  onLogout?: () => void;
  children: React.ReactNode;
}

/**
 * Sleek, dark-themed Admin Layout with collapsible sidebar.
 * Mirroring exact CodeIgniter navigation structure:
 * Dashboard, Profile, Users, Category, Tag, Advertisement, Blog, Subscribe, Image Library, Setting.
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onTabChange,
  onSwitchToPublic,
  adminName = 'Administrator',
  onLogout,
  children,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  // Mobile: sidebar lives off-canvas and opens as an overlay drawer
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setMobileSidebarOpen(false);
  };

  const managementItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Blog', icon: FileText },
    { name: 'Category', icon: FolderTree },
    { name: 'Tag', icon: Tag },
    { name: 'Advertisement', icon: BarChart2 },
    { name: 'Image Library', icon: ImageIcon },
  ];

  const systemItems = [
    { name: 'Subscribe', icon: Mail },
    { name: 'Activity Log', icon: ShieldCheck },
    { name: 'Users', icon: Users },
    { name: 'Sub Admin', icon: Users },
    { name: 'Profile', icon: User },
    { name: 'Setting', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1917] flex font-sans">
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-stone-950/50 backdrop-blur-xs"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed drawer on mobile, static column on lg+ */}
      <aside
        className={`bg-white border-r border-[#E7E5E4] flex flex-col justify-between transition-all duration-300 z-40 shadow-xs
          fixed inset-y-0 left-0 lg:static lg:translate-x-0 overflow-y-auto
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'lg:w-20 w-64' : 'w-64'}`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-[#E7E5E4]">
            {(!collapsed || mobileSidebarOpen) && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#991B1B] flex items-center justify-center font-bold text-white text-base shadow-sm">
                  P
                </div>
                <div className="leading-none">
                  <span className="font-bold text-base text-stone-900 italic font-serif tracking-tight">Portal CMS</span>
                  <span className="block text-[10px] text-[#991B1B] font-mono tracking-widest uppercase mt-0.5 font-bold">Editorial v2.6</span>
                </div>
              </div>
            )}
            {collapsed && !mobileSidebarOpen && (
              <div className="w-9 h-9 mx-auto bg-[#991B1B] flex items-center justify-center font-bold text-white text-lg shadow-sm">
                P
              </div>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition hidden sm:block"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Menu Items */}
          <nav className="py-4 px-3 space-y-4">
            <div>
              {(!collapsed || mobileSidebarOpen) && (
                <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold px-3 py-1.5 mb-1 font-mono">
                  Management
                </div>
              )}
              <div className="space-y-1">
                {managementItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleTabChange(item.name)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition group ${
                        isActive
                          ? 'text-[#991B1B] bg-[#991B1B]/10 border-r-2 border-[#991B1B] font-bold'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                      }`}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#991B1B]' : 'text-stone-400 group-hover:text-stone-700'}`} />
                      {(!collapsed || mobileSidebarOpen) && <span className="truncate">{item.name}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              {(!collapsed || mobileSidebarOpen) && (
                <div className="text-[10px] uppercase tracking-widest text-stone-500 font-bold px-3 py-1.5 mb-1 font-mono">
                  System
                </div>
              )}
              <div className="space-y-1">
                {systemItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleTabChange(item.name)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition group ${
                        isActive
                          ? 'text-[#991B1B] bg-[#991B1B]/10 border-r-2 border-[#991B1B] font-bold'
                          : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                      }`}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#991B1B]' : 'text-stone-400 group-hover:text-stone-700'}`} />
                      {(!collapsed || mobileSidebarOpen) && <span className="truncate">{item.name}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[#E7E5E4] bg-[#FAF8F5]">
          <button
            onClick={onSwitchToPublic}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#991B1B] hover:bg-[#991B1B] hover:text-white transition border border-[#991B1B]/30"
            title="View Public Frontend"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {(!collapsed || mobileSidebarOpen) && <span>Live Public Site</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAF8F5]">
        {/* Top Navbar */}
        <header className="h-16 bg-white/95 backdrop-blur border-b border-[#E7E5E4] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-stone-600 hover:text-[#991B1B]"
              aria-label="Open admin menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="hidden sm:inline text-xs font-bold text-stone-500 uppercase tracking-widest font-mono">
              Admin Panel
            </span>
            <span className="text-stone-300">/</span>
            <span className="text-sm font-bold uppercase tracking-widest text-stone-900">{currentTab}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onSwitchToPublic}
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest bg-[#991B1B] text-white hover:bg-[#7F1D1D] transition shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Preview Public Site
            </button>

            {/* Admin Profile (real ci_admin account) */}
            <div className="flex items-center gap-3 pl-4 border-l border-[#E7E5E4]">
              <div className="w-8 h-8 rounded-full bg-[#991B1B] flex items-center justify-center font-bold text-white text-xs uppercase">
                {adminName.split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </div>
              <div className="hidden md:block leading-tight text-left">
                <span className="block text-xs font-bold text-stone-900">{adminName}</span>
                <span className="block text-[10px] text-stone-500 uppercase tracking-wider font-mono">ci_admin editor</span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="ml-1 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 hover:text-[#991B1B] transition"
                  title="Sign out"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Page View Container */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
