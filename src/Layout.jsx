import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, Users, Briefcase, Menu, X, Search, Bell, Zap, BarChart3, LogOut, Settings as SettingsIcon, Sun, Moon, Database, CheckSquare, Sparkles, Brain, Globe
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SettingsProvider, useSettings } from '@/components/context/SettingsContext';
import { ActNowProvider } from '@/components/context/ActNowContext';
import GlobalSearch from '@/components/layout/GlobalSearch';
import Notifications from '@/components/layout/Notifications';
import MobileBottomNav from '@/components/layout/MobileBottomNav';

function LayoutContent({ children, currentPageName }) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { branding, theme, toggleTheme } = useSettings();
  
  // Exact paths
  const navigation = [
  { name: 'Dashboard', path: 'Dashboard', icon: LayoutDashboard, color: 'cyan' },
  { name: 'Leads', path: 'Leads', icon: Users, color: 'purple' },
  { name: 'Opportunities', path: 'Opportunities', icon: Briefcase, color: 'pink' },
  { name: 'Act Now', path: 'ActNow', icon: Brain, color: 'orange' },
  { name: 'Tasks', path: 'Tasks', icon: CheckSquare, color: 'red' },
  { name: 'Reports', path: 'Reports', icon: BarChart3, color: 'emerald' },
  { name: 'Automation', path: 'Automation', icon: Zap, color: 'indigo' },
  { name: 'Galaxy', path: 'SalesGalaxy', icon: Globe, color: 'amber' },
  ];

  // Dark Mode Color Configurations
  const darkColors = {
      cyan: { active: 'bg-cyan-500/15 text-cyan-400 shadow-cyan-500/10', icon: 'text-cyan-400', indicator: 'bg-cyan-400 shadow-cyan-400/50', hover: 'hover:text-cyan-400' },
      purple: { active: 'bg-purple-500/15 text-purple-400 shadow-purple-500/10', icon: 'text-purple-400', indicator: 'bg-purple-400 shadow-purple-400/50', hover: 'hover:text-purple-400' },
      pink: { active: 'bg-pink-500/15 text-pink-400 shadow-pink-500/10', icon: 'text-pink-400', indicator: 'bg-pink-400 shadow-pink-400/50', hover: 'hover:text-pink-400' },
      orange: { active: 'bg-orange-500/15 text-orange-400 shadow-orange-500/10', icon: 'text-orange-400', indicator: 'bg-orange-400 shadow-orange-400/50', hover: 'hover:text-orange-400' },
      red: { active: 'bg-red-500/15 text-red-400 shadow-red-500/10', icon: 'text-red-400', indicator: 'bg-red-400 shadow-red-400/50', hover: 'hover:text-red-400' },
      emerald: { active: 'bg-emerald-500/15 text-emerald-400 shadow-emerald-500/10', icon: 'text-emerald-400', indicator: 'bg-emerald-400 shadow-emerald-400/50', hover: 'hover:text-emerald-400' },
      indigo: { active: 'bg-indigo-500/15 text-indigo-400 shadow-indigo-500/10', icon: 'text-indigo-400', indicator: 'bg-indigo-400 shadow-indigo-400/50', hover: 'hover:text-indigo-400' },
      amber: { active: 'bg-amber-500/15 text-amber-400 shadow-amber-500/10', icon: 'text-amber-400', indicator: 'bg-amber-400 shadow-amber-400/50', hover: 'hover:text-amber-400' },
  };

  // Dynamic Colors based on branding
  // New "Clean Luxury Red" styling
  const activeClass = `bg-red-50 text-red-700 font-bold`;

  // Custom Deep Theme for Dark Mode
  // Background: #0B1121 (Very dark blue/slate)
  // Panel: #151E32 (Slightly lighter)
  // Accent: Emerald/Teal

  return (
    <div className={`min-h-screen font-heebo flex transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0B1121] text-slate-100' : 'bg-neutral-50 text-neutral-900'}`} dir="ltr">
      
      {/* Global Scrollbar Styles */}
      <style>{`
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: ${theme === 'dark' ? '#1E293B' : '#cbd5e1'};
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: ${theme === 'dark' ? '#334155' : '#94a3b8'};
        }
      `}</style>

      {/* Sidebar / Drawer - Adaptive */}
      <aside className={`
        fixed inset-0 z-[60] transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-72 lg:border-r lg:shadow-sm
        ${theme === 'dark' ? 'bg-[#151E32] text-slate-200 border-[#1E293B]' : 'bg-white text-neutral-800 border-neutral-100'}
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full relative">
            {/* Mobile Close Button - Absolute Top Right */}
            <div className="absolute top-4 right-4 lg:hidden z-10">
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="h-10 w-10 rounded-full bg-neutral-100 text-neutral-500">
                    <X className="w-6 h-6" />
                </Button>
            </div>

            {/* Logo Area */}
            <div className={`p-6 lg:p-6 border-b flex flex-col items-center lg:items-start mt-10 lg:mt-0 ${theme === 'dark' ? 'border-[#1E293B]' : 'border-neutral-50'}`}>
                <Link to={createPageUrl('Dashboard')} onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 text-2xl lg:text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity">
                    {branding.logoUrl ? (
                        <img src={branding.logoUrl} alt="Logo" className={`w-16 h-16 lg:w-10 lg:h-10 object-contain rounded-full p-1 ${theme === 'dark' ? 'bg-[#0B1121]' : 'bg-white'}`} />
                    ) : (
                        <div className={`rounded-full lg:rounded-lg p-4 lg:p-2 shadow-lg ${theme === 'dark' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-700 shadow-red-900/20'}`}>
                            <Database className="w-8 h-8 lg:w-6 lg:h-6 text-white" />
                        </div>
                    )}
                    <span className="hidden lg:inline truncate">{branding.companyName}</span>
                </Link>
                <p className="lg:hidden text-xl font-bold mt-4">{branding.companyName}</p>
                <p className={`text-sm mt-2 font-medium tracking-wide ${theme === 'dark' ? 'text-emerald-400' : 'text-neutral-500 opacity-80'}`}>Anyone's CRM</p>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-6 lg:px-4 py-8 space-y-3 lg:space-y-2 overflow-y-auto">
                {navigation.map((item) => {
                const isActive = currentPageName === item.path;
                const themeColor = darkColors[item.color] || darkColors.emerald;

                return (
                    <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                        group flex items-center gap-4 lg:gap-3 px-6 lg:px-4 py-5 lg:py-3.5 text-lg lg:text-sm font-medium rounded-2xl lg:rounded-xl transition-all duration-200 relative overflow-hidden
                        ${isActive 
                        ? theme === 'dark' 
                          ? `${themeColor.active} font-bold shadow-sm` 
                          : 'bg-red-50 text-red-700 font-bold shadow-sm'
                        : theme === 'dark'
                          ? `text-slate-400 hover:bg-[#1E293B] ${themeColor.hover}`
                          : 'text-neutral-600 hover:bg-red-50 hover:text-red-600 bg-neutral-50/50 lg:bg-transparent'}
                    `}
                    >
                    <item.icon className={`w-6 h-6 lg:w-5 lg:h-5 transition-colors ${
                      isActive 
                        ? theme === 'dark' ? themeColor.icon : 'text-red-700'
                        : theme === 'dark' ? `text-slate-500 group-${themeColor.hover}` : 'text-neutral-400 group-hover:text-red-600'
                    }`} />
                    <span className="relative z-10">{item.name}</span>
                    {isActive && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 lg:h-6 rounded-r-full ${theme === 'dark' ? `${themeColor.indicator} shadow-lg` : 'bg-red-600'}`} />}
                    </Link>
                );
                })}
            </nav>

            {/* Footer / Settings */}
            <div className={`p-6 lg:p-4 border-t ${theme === 'dark' ? 'border-[#1E293B]' : 'border-neutral-50'}`}>
                <Link
                    to={createPageUrl('Settings')}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                        flex items-center gap-4 lg:gap-3 px-6 lg:px-4 py-4 lg:py-3 text-base lg:text-sm font-medium rounded-2xl lg:rounded-xl transition-all duration-200 group
                        ${currentPageName === 'Settings' 
                          ? theme === 'dark' 
                            ? 'bg-white/10 text-white font-bold shadow-sm shadow-white/5' 
                            : 'bg-red-50 text-red-700 font-bold'
                          : theme === 'dark'
                            ? 'text-slate-400 hover:bg-[#1E293B] hover:text-white'
                            : 'text-neutral-600 hover:bg-red-50 hover:text-red-600 bg-neutral-50/30 lg:bg-transparent'}
                    `}
                >
                    <SettingsIcon className={`w-6 h-6 lg:w-5 lg:h-5 transition-colors ${
                        currentPageName === 'Settings' 
                        ? theme === 'dark' ? 'text-white' : 'text-red-700'
                        : theme === 'dark' ? 'text-slate-500 group-hover:text-white' : 'text-neutral-400'
                    }`} />
                    System Settings
                    {currentPageName === 'Settings' && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full ${theme === 'dark' ? 'bg-white shadow-lg shadow-white/30' : 'hidden'}`} />}
                </Link>
                <button
                    onClick={toggleTheme}
                    className={`mt-3 flex items-center gap-3 px-6 lg:px-4 py-3 text-sm font-medium rounded-xl transition-all w-full ${
                        theme === 'dark' 
                            ? 'text-emerald-400 hover:bg-[#1E293B]' 
                            : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        {/* Mobile Header */}
        <header className={`lg:hidden backdrop-blur-sm border-b px-4 h-16 flex items-center justify-between sticky top-0 z-40 transition-all duration-200 ${
            theme === 'dark' 
                ? 'bg-[#151E32]/95 border-[#1E293B]' 
                : 'bg-white/95 border-neutral-100'
        }`}>
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className={theme === 'dark' ? 'hover:bg-[#1E293B]' : 'hover:bg-neutral-100 -ml-2'}>
                    <Menu className={`w-6 h-6 ${theme === 'dark' ? 'text-white' : 'text-neutral-700'}`} />
                </Button>
                <span className="font-bold text-lg">{branding.companyName}</span>
            </div>
            <div className="flex items-center gap-2">
               <Notifications />
               {branding.logoUrl && (
                 <Link to={createPageUrl('Dashboard')}>
                   <img src={branding.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded-full" />
                 </Link>
               )}
            </div>
        </header>

        {/* Topbar Desktop */}
        <header className={`hidden lg:flex backdrop-blur-md border-b h-20 items-center justify-between px-8 sticky top-0 z-30 transition-colors duration-300 ${
            theme === 'dark' 
                ? 'bg-[#0B1121]/80 border-[#1E293B]' 
                : 'bg-white/80 border-neutral-200/60'
        }`}>
            <h1 className={`text-2xl font-bold ${
                theme === 'dark' 
                    ? (currentPageName === 'Settings' 
                        ? 'text-white' 
                        : (navigation.find(n => n.path === currentPageName)?.color 
                            ? darkColors[navigation.find(n => n.path === currentPageName).color].icon 
                            : 'text-emerald-400'))
                    : 'text-neutral-800'
            }`}>
                {navigation.find(n => n.path === currentPageName)?.name || (currentPageName === 'Settings' ? 'Settings' : 'Overview')}
            </h1>
            <div className="flex items-center gap-2 md:gap-4">
                <div className="hidden md:block">
                  <GlobalSearch />
                </div>
                <button
                    onClick={toggleTheme}
                    className={`p-2 rounded-lg transition-colors ${
                        theme === 'dark' 
                            ? 'hover:bg-[#1E293B] text-emerald-400' 
                            : 'hover:bg-neutral-100 text-neutral-600'
                    }`}
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <Notifications />
            </div>
        </header>

        {/* Page Content Scrollable Area */}
        <main className={`flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth transition-colors duration-300 ${
            theme === 'dark' ? 'bg-[#0B1121]' : 'bg-neutral-50'
        }`}>
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </main>
        
        <MobileBottomNav activePage={currentPageName} />
        </div>

        {/* Overlay for Mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
}

export default function Layout(props) {
  return (
    <SettingsProvider>
      <ActNowProvider>
        <LayoutContent {...props} />
      </ActNowProvider>
    </SettingsProvider>
  );
}