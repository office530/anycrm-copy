import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bot } from 'lucide-react';
import SalesAssistantChat from './SalesAssistantChat';
import { useSettings } from '@/components/context/SettingsContext';

export default function SalesAssistantDialog({ open, onOpenChange }) {
    const { theme } = useSettings();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`max-w-2xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl border-none shadow-2xl ${
                theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
            }`}>
                <DialogHeader className={`px-6 py-4 border-b flex flex-row items-center gap-3 space-y-0 ${
                    theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50/80 border-slate-100'
                }`}>
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <Bot className="h-6 w-6" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold">AI Sales Assistant</DialogTitle>
                        <p className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            Your personal pipeline & content expert
                        </p>
                    </div>
                </DialogHeader>
                
                <div className="flex-1 overflow-hidden bg-opacity-50">
                    <SalesAssistantChat />
                </div>
            </DialogContent>
        </Dialog>
    );
}