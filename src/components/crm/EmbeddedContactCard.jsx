import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Contact, ArrowRight, Mail } from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useSettings } from '@/components/context/SettingsContext';

export default function EmbeddedContactCard({ contactId }) {
    const { theme } = useSettings();
    
    const { data: contact, isLoading } = useQuery({
        queryKey: ['embedded_contact', contactId],
        queryFn: async () => {
             if(!contactId) return null;
             const res = await base44.entities.Contact.list({ id: contactId });
             return res[0];
        },
        enabled: !!contactId
    });

    if (!contactId) return null;
    if (isLoading) return <div className="h-20 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />;
    if (!contact) return null;

    return (
        <div className={`p-4 rounded-xl border flex items-center justify-between group transition-all ${
            theme === 'dark' 
                ? 'bg-slate-900/50 border-slate-700 hover:border-slate-600' 
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
        }`}>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-white shadow-sm text-slate-500'}`}>
                    {contact.full_name?.charAt(0) || <Contact className="w-5 h-5" />}
                </div>
                <div>
                    <div className={`text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Primary Contact</div>
                    <div className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{contact.full_name}</div>
                    {contact.email && <div className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {contact.email}</div>}
                </div>
            </div>
            
            <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Link to={createPageUrl(`ContactDetails?id=${contact.id}`)}>
                    View <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
            </Button>
        </div>
    );
}