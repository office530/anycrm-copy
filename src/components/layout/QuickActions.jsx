import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, UserPlus, Briefcase, CheckSquare, Mail, X, 
    Sparkles, MessageSquare 
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
                                <span className={`text-sm font-medium px-2 py-1 rounded-md shadow-sm backdrop-blur-sm ${
                                    theme === 'dark' ? 'bg-slate-900/80 text-white' : 'bg-white/80 text-slate-700'
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
                    h-16 w-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300
                    ${isOpen ? 'rotate-45 bg-slate-800' : `bg-${branding.primaryColor}-600`}
                    text-white border-4 ${theme === 'dark' ? 'border-slate-800' : 'border-white'}
                `}
            >
                <Plus className={`w-8 h-8 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
            </motion.button>
        </div>
    );
}