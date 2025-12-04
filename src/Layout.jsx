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
// MobileNav removed

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
      
      {/* Sidebar / Drawer - Adaptive */}
      <aside className={`
        fixed inset-0 z-[60] bg-white text-neutral-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:w-72 lg:border-l border-neutral-100 lg:shadow-sm
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full relative">
            {/* Mobile Close Button - Absolute Top Left */}
            <div className="absolute top-4 left-4 lg:hidden z-10">
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="h-10 w-10 rounded-full bg-neutral-100 text-neutral-500">
                    <X className="w-6 h-6" />
                </Button>
            </div>

            {/* Logo Area */}
            <div className="p-6 lg:p-6 border-b border-neutral-50 flex flex-col items-center lg:items-start mt-10 lg:mt-0">
                <div className="flex items-center gap-3 text-2xl lg:text-2xl font-bold tracking-tight text-neutral-900">
                    {branding.logoUrl ? (
                        <img src={branding.logoUrl} alt="Logo" className="w-16 h-16 lg:w-10 lg:h-10 object-contain bg-white rounded-xl p-1" />
                    ) : (
                        <div className="bg-red-700 rounded-xl lg:rounded-lg p-4 lg:p-2 shadow-lg shadow-red-900/20">
                            <Database className="w-8 h-8 lg:w-6 lg:h-6 text-white" />
                        </div>
                    )}
                    <span className="hidden lg:inline truncate">{branding.companyName}</span>
                </div>
                <p className="lg:hidden text-xl font-bold mt-4 text-neutral-900">{branding.companyName}</p>
                <p className="text-sm text-neutral-500 mt-2 font-medium tracking-wide opacity-80">OLD SALES DATABASE</p>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-6 lg:px-4 py-8 space-y-3 lg:space-y-2 overflow-y-auto">
                {navigation.map((item) => {
                const isActive = currentPageName === item.path;
                return (
                    <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                        group flex items-center gap-4 lg:gap-3 px-6 lg:px-4 py-5 lg:py-3.5 text-lg lg:text-sm font-medium rounded-2xl lg:rounded-xl transition-all duration-200 relative overflow-hidden
                        ${isActive 
                        ? 'bg-red-50 text-red-700 font-bold shadow-sm'
                        : 'text-neutral-600 hover:bg-red-50 hover:text-red-600 bg-neutral-50/50 lg:bg-transparent'}
                    `}
                    >
                    <item.icon className={`w-6 h-6 lg:w-5 lg:h-5 transition-colors ${isActive ? 'text-red-700' : 'text-neutral-400 group-hover:text-red-600'}`} />
                    <span className="relative z-10">{item.name}</span>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 lg:h-6 bg-red-600 rounded-r-full" />}
                    </Link>
                );
                })}
            </nav>

            {/* Footer / Settings */}
            <div className="p-6 lg:p-4 border-t border-neutral-50">
                <Link
                    to={createPageUrl('Settings')}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                        flex items-center gap-4 lg:gap-3 px-6 lg:px-4 py-4 lg:py-3 text-base lg:text-sm font-medium rounded-2xl lg:rounded-xl transition-all duration-200
                        ${currentPageName === 'Settings' ? 'bg-red-50 text-red-700 font-bold' : 'text-neutral-600 hover:bg-red-50 hover:text-red-600 bg-neutral-50/30 lg:bg-transparent'}
                    `}
                >
                    <SettingsIcon className="w-6 h-6 lg:w-5 lg:h-5" />
                    הגדרות מערכת
                </Link>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white/95 backdrop-blur-sm border-b border-neutral-100 px-4 h-16 flex items-center justify-between sticky top-0 z-40 transition-all duration-200">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="hover:bg-neutral-100 -mr-2">
                    <Menu className="w-6 h-6 text-neutral-700" />
                </Button>
                <span className="font-bold text-lg text-neutral-900">{branding.companyName}</span>
            </div>
            <div className="flex items-center gap-2">
               <Notifications />
               {branding.logoUrl && <img src={branding.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />}
            </div>
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
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth bg-neutral-50">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </main>
        
        {/* Mobile Nav Removed */}
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
      <LayoutContent {...props} />
    </SettingsProvider>
  );
}