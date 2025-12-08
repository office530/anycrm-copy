import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LayoutDashboard, Users, Briefcase, Plus, Menu, Sparkles } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useSettings } from "@/components/context/SettingsContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator } from
"@/components/ui/dropdown-menu";

export default function MobileBottomNav() {
  const location = useLocation();
  const { theme } = useSettings();
  const currentPath = location.pathname.split('/').pop() || 'Dashboard';
  const [showAiImport, setShowAiImport] = React.useState(false);

  const isActive = (path) => currentPath === path;
  
  const activeClass = theme === 'dark' 
    ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' 
    : 'text-red-600';
    
  const inactiveClass = theme === 'dark' ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400';

  return (
    <div className={`fixed bottom-0 left-0 right-0 border-t h-16 px-6 flex items-center justify-between z-50 lg:hidden transition-colors duration-300 pb-safe ${
        theme === 'dark' 
        ? 'bg-slate-900/90 backdrop-blur-md border-slate-800 shadow-[0_-4px_20px_-1px_rgba(0,0,0,0.5)]' 
        : 'bg-white/90 backdrop-blur-md border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]'
    }`}>
            <Link to={createPageUrl('Dashboard')} className={`flex flex-col items-center gap-1 transition-all ${isActive('Dashboard') ? activeClass : inactiveClass}`}>
                <LayoutDashboard className="w-6 h-6" />
                <span className="text-[10px] font-medium">Dashboard</span>
            </Link>

            <Link to={createPageUrl('Leads')} className={`flex flex-col items-center gap-1 transition-all ${isActive('Leads') ? activeClass : inactiveClass}`}>
                <Users className="w-6 h-6" />
                <span className="text-[10px] font-medium">Leads</span>
            </Link>

            {/* Center FAB for Quick Actions */}
            <div className="relative -top-5">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center p-0 transition-all duration-300 ${
                            theme === 'dark'
                            ? 'bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] text-slate-900'
                            : 'bg-red-600 hover:bg-red-700 shadow-red-600/30 text-white'
                        }`}>
                            <Plus className="w-8 h-8" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" side="top" className={`mb-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200' : ''}`}>
                        <DropdownMenuItem asChild>
                             <Link to={`${createPageUrl('Leads')}?action=new`} className="cursor-pointer flex items-center gap-2">
                                <Users className="w-4 h-4" /> New Lead
                             </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                             <Link to={`${createPageUrl('Opportunities')}?action=new`} className="cursor-pointer flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> New Opportunity
                             </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                             <Link to={`${createPageUrl('Leads')}?action=ai-import`} className="cursor-pointer flex items-center gap-2 text-purple-700 bg-gradient-to-r from-purple-50 to-blue-50">
                                <Sparkles className="w-4 h-4" /> Import AI Lead
                             </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Link to={createPageUrl('Opportunities')} className={`flex flex-col items-center gap-1 transition-all ${isActive('Opportunities') ? activeClass : inactiveClass}`}>
                <Briefcase className="w-6 h-6" />
                <span className="text-[10px] font-medium">Deals</span>
            </Link>

            <Link to={createPageUrl('Settings')} className={`flex flex-col items-center gap-1 transition-all ${isActive('Settings') ? activeClass : inactiveClass}`}>
                <Menu className="w-6 h-6" />
                <span className="text-[10px] font-medium">Settings</span>
            </Link>
        </div>);

}