import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, UserPlus, Briefcase, CheckSquare, Mail, X, 
    Sparkles, MessageSquare, Brain 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useSettings } from '@/components/context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function QuickActions() {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, branding } = useSettings();
    const navigate = useNavigate();

    const actions = [
        { 
            label: 'Act Now Engine', 
            icon: Brain, 
            color: 'bg-indigo-500', 
            onClick: () => navigate(createPageUrl('ActNow')) 
        },
        { 
            label: 'Import AI Lead', 
            icon: Sparkles, 
            color: 'bg-pink-500', 
            onClick: () => navigate(createPageUrl('Leads') + '?action=ai-import') 
        },
        { 
            label: 'New Task', 
            icon: CheckSquare, 
            color: 'bg-emerald-500', 
            onClick: () => navigate(createPageUrl('Tasks') + '?action=new') 
        },
        { 
            label: 'Send Campaign', 
            icon: Mail, 
            color: 'bg-purple-500', 
            onClick: () => navigate(createPageUrl('SequenceBuilder')) 
        },
        { 
            label: 'New Opportunity', 
            icon: Briefcase, 
            color: 'bg-amber-500', 
            onClick: () => navigate(createPageUrl('Opportunities') + '?action=new') 
        },
        { 
            label: 'Add Lead', 
            icon: UserPlus, 
            color: 'bg-blue-500', 
            onClick: () => navigate(createPageUrl('Leads') + '?action=new') 
        },
    ];

    return (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4 hidden md:flex">
            <AnimatePresence>
                {isOpen && (
                    <div className="flex flex-col gap-3 items-end mb-2">
                        {actions.map((action, index) => (
                            <motion.div
                                key={action.label}
                                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                className="flex items-center gap-3"
                            >
                                <span className={`text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-md border ${
                                    theme === 'dark' 
                                      ? 'bg-slate-900/60 text-white border-white/10' 
                                      : 'bg-white/60 text-slate-800 border-white/40'
                                }`}>
                                    {action.label}
                                </span>
                                <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="icon"
                                                onClick={() => {
                                                    action.onClick();
                                                    setIsOpen(false);
                                                }}
                                                className={`h-12 w-12 rounded-full shadow-lg border-2 border-white/20 hover:scale-110 transition-transform ${action.color} text-white`}
                                            >
                                                <action.icon className="w-5 h-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="left">
                                            <p>{action.label}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 backdrop-blur-sm
                    ${isOpen ? 'rotate-45' : ''}
                    ${theme === 'dark' 
                        ? 'bg-cyan-500/90 text-slate-900 hover:bg-cyan-400 border border-white/20 shadow-[0_0_30px_rgba(34,211,238,0.5)]' 
                        : 'bg-red-600/90 text-white hover:bg-red-700 border border-white/20 shadow-[0_8px_30px_rgba(220,38,38,0.4)]'}
                `}
            >
                <Plus className={`w-8 h-8 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
            </motion.button>
        </div>
    );
}