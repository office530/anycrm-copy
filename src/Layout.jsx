import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LayoutDashboard, Users, Briefcase, Menu, X, Search, Bell, Zap, BarChart3, LogOut, Settings as SettingsIcon, Sun, Moon
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SettingsProvider, useSettings } from '@/components/context/SettingsContext';

import { useNavigate } from 'react-router-dom';

function LayoutContent({ children, currentPageName }) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { branding, theme, toggleTheme } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();

  // בדיקה אם אנחנו בעמוד הנחיתה
  const isLandingPage = currentPageName === 'LandingPage' || location.pathname === '/LandingPage' || location.pathname === '/';

  // בדיקת התחברות (דמה) - אם מנסים לגשת לעמוד פנימי
  React.useEffect(() => {
      if (!isLandingPage) {
          const isAuthenticated = localStorage.getItem('crm_is_authenticated') === 'true';
          if (!isAuthenticated) {
              // הפניה לעמוד הנחיתה אם לא מחובר
              // מכיוון שאין לנו שליטה מלאה על ה-Router הראשי, נשתמש בנתיב הישיר
              navigate(createPageUrl('LandingPage')); 
          }
      }
  }, [isLandingPage, navigate]);

  // אם אנחנו בעמוד נחיתה - נציג רק את התוכן ללא המעטפת
  if (isLandingPage) {
      return <main className="w-full min-h-screen">{children}</main>;
  }

  // Exact paths
  const navigation = [
    { name: 'לוח בקרה', path: 'Dashboard', icon: LayoutDashboard },
    { name: 'מאגר לידים', path: 'Leads', icon: Users },
    { name: 'הזדמנויות', path: 'Opportunities', icon: Briefcase },
    { name: 'דוחות', path: 'Reports', icon: BarChart3 },
    { name: 'אוטומציות', path: 'Automation', icon: Zap },
  ];

  // Dynamic Colors based on branding
  const activeClass = `bg-${branding.primaryColor}-600 text-white shadow-lg shadow-${branding.primaryColor}-900/20`;
  const iconClass = `bg-${branding.primaryColor}-500`;
  const focusRing = `focus:ring-${branding.primaryColor}-500/20`;

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex" dir="rtl">
      
      {/* Sidebar Desktop */}
      <aside className={`
        fixed inset-y-0 right-0 z-50 w-72 bg-[#0F172A] text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-8 border-b border-slate-800/50">
                <div className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
                    {branding.logoUrl ? (
                        <img src={branding.logoUrl} alt="Logo" className="w-10 h-10 object-contain bg-white rounded-lg p-1" />
                    ) : (
                        <div className={`${iconClass} rounded-lg p-1.5`}>
                            <Briefcase className="w-6 h-6 text-white" />
                        </div>
                    )}
                    <span className="truncate">{branding.companyName}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium tracking-wide opacity-60">MORTGAGE CONSULTING</p>
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
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                    `}
                    >
                    <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    <span className="relative z-10">{item.name}</span>
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/20 rounded-r-full" />}
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
                        ${currentPageName === 'Settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
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
        <header className="hidden lg:flex bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 h-20 items-center justify-between px-8 sticky top-0 z-30">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {navigation.find(n => n.path === currentPageName)?.name || (currentPageName === 'Settings' ? 'הגדרות' : 'סקירה')}
            </h1>
            <div className="flex items-center gap-4">
                <div className="relative group">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                    <input 
                        className={`bg-slate-50 dark:bg-slate-800 border-none rounded-full py-2.5 pr-10 pl-4 text-sm w-64 focus:ring-2 ${focusRing} focus:bg-white dark:focus:bg-slate-900 dark:text-slate-100 transition-all placeholder:text-slate-400`}
                        placeholder="חיפוש מהיר..."
                    />
                </div>
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400">
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full relative">
                    <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                </Button>
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