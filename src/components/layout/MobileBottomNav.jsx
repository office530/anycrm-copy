import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LayoutDashboard, Users, Briefcase, Plus, Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MobileBottomNav() {
    const location = useLocation();
    const currentPath = location.pathname.split('/').pop() || 'Dashboard';

    const isActive = (path) => currentPath === path;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 px-6 flex items-center justify-between z-50 lg:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <Link to={createPageUrl('Dashboard')} className={`flex flex-col items-center gap-1 ${isActive('Dashboard') ? 'text-red-600' : 'text-slate-400'}`}>
                <LayoutDashboard className="w-6 h-6" />
                <span className="text-[10px] font-medium">ראשי</span>
            </Link>

            <Link to={createPageUrl('Leads')} className={`flex flex-col items-center gap-1 ${isActive('Leads') ? 'text-red-600' : 'text-slate-400'}`}>
                <Users className="w-6 h-6" />
                <span className="text-[10px] font-medium">לידים</span>
            </Link>

            {/* Center FAB for Quick Actions */}
            <div className="relative -top-5">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30 flex items-center justify-center p-0">
                            <Plus className="w-8 h-8 text-white" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" side="top" className="mb-2">
                        <DropdownMenuItem asChild>
                             <Link to={createPageUrl('Leads')} state={{ openCreate: true }} className="cursor-pointer flex items-center gap-2">
                                <Users className="w-4 h-4" /> ליד חדש
                             </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                             <Link to={createPageUrl('Opportunities')} state={{ openCreate: true }} className="cursor-pointer flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> הזדמנות חדשה
                             </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Link to={createPageUrl('Opportunities')} className={`flex flex-col items-center gap-1 ${isActive('Opportunities') ? 'text-red-600' : 'text-slate-400'}`}>
                <Briefcase className="w-6 h-6" />
                <span className="text-[10px] font-medium">עסקאות</span>
            </Link>

            <Link to={createPageUrl('Settings')} className={`flex flex-col items-center gap-1 ${isActive('Settings') ? 'text-red-600' : 'text-slate-400'}`}>
                <Menu className="w-6 h-6" />
                <span className="text-[10px] font-medium">עוד</span>
            </Link>
        </div>
    );
}