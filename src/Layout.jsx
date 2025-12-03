import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, Users, Briefcase, Menu, X, Search, Bell, Zap, BarChart3, LogOut, Settings as SettingsIcon, Sun, Moon, Database
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SettingsProvider, useSettings } from '@/components/context/SettingsContext';
import GlobalSearch from '@/components/layout/GlobalSearch';
import Notifications from '@/components/layout/Notifications';

function LayoutContent({ children, currentPageName }) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { branding, theme, toggleTheme } = useSettings();
  
  // Exact paths
  const navigation = [
    { name: 'לוח בקרה', path: 'Dashboard', icon: LayoutDashboard },
    { name: 'מאגר לידים', path: 'Leads', icon: Users },
    { name: 'הזדמנויות', path: 'Opportunities', icon: Briefcase },
    { name: 'דוחות', path: 'Reports', icon: BarChart3 },
    { name: 'אוטומציות', path: 'Automation', icon: Zap },
  ];

  // Dynamic Colors based on branding
  // New "Clean Luxury Red" styling
  const activeClass = `bg-red-50 text-red-700 font-bold`;

  return (
    <div className="min-h-screen bg-neutral-50 font-heebo text-neutral-900 flex" dir="rtl">
      
      {/* Sidebar Desktop */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-72 bg-white text-neutral-800 border-l border-neutral-100 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-sm
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-6 border-b border-neutral-50">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 text-2xl font-bold tracking-tight text-neutral-900">
                        {branding.logoUrl ? (
                            <img src={branding.logoUrl} alt="Logo" className="w-10 h-10 object-contain bg-white rounded-lg p-1" />
                        ) : (
                            <div className="bg-red-700 rounded-lg p-2 shadow-md shadow-red-900/20">
                                <Database className="w-6 h-6 text-white" />
                            </div>
                        )}
                        <span className="truncate">{branding.companyName}</span>
                    </div>
                    {/* Close button for mobile */}
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-neutral-400 hover:text-red-600">
                        <X className="w-5 h-5" />
                    </Button>
                </div>
                <p className="text-xs text-neutral-500 mt-2 font-medium tracking-wide opacity-80 dark:text-neutral-600">OLD SALES DATABASE</p>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-8 space-y-2">
                {navigation.map((item) => {
                const isActive = currentPageName === item.path;
                return (
                    <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    onClick={() => setIsSidebarOpen(false)} // Close on mobile
                    className={`
                        group flex items-center gap-3 px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden
                        ${isActive 
                        ? activeClass
                        : 'text-neutral-600 hover:bg-red-50 hover:text-red-600'}
                    `}
                    >
                    <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-red-700' : 'text-neutral-400 group-hover:text-red-600'}`} />
                    <span className="relative z-10">{item.name}</span>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-red-600 rounded-r-full" />}
                    </Link>
                );
                })}
            </nav>

            {/* Settings & User Profile */}
            <div className="p-4 m-4 space-y-2">
                <Link
                    to={createPageUrl('Settings')}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                        flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                        ${currentPageName === 'Settings' ? 'bg-red-50 text-red-700 font-bold' : 'text-neutral-600 hover:bg-red-50 hover:text-red-600'}
                    `}
                >
                    <SettingsIcon className="w-5 h-5" />
                    הגדרות מערכת
                </Link>


            </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-40">
            <span className="font-bold text-lg">{branding.companyName}</span>
            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                {isSidebarOpen ? <X /> : <Menu />}
            </Button>
        </header>

        {/* Topbar Desktop */}
        <header className="hidden lg:flex bg-white/80 dark:bg-neutral-200/90 backdrop-blur-md border-b border-neutral-200/60 dark:border-neutral-800 h-20 items-center justify-between px-8 sticky top-0 z-30">
            <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-900">
                {navigation.find(n => n.path === currentPageName)?.name || (currentPageName === 'Settings' ? 'הגדרות' : 'סקירה')}
            </h1>
            <div className="flex items-center gap-2 md:gap-4">
                <div className="hidden md:block">
                  <GlobalSearch />
                </div>
                {/* Theme toggle removed as per request - forced to light mode */}
                <Notifications />
            </div>
        </header>

        {/* Page Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </main>
      </div>

      {/* Overlay for Mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
}

export default function Layout(props) {
  return (
    <SettingsProvider>
      <LayoutContent {...props} />
    </SettingsProvider>
  );
}