import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

export default function LeadSelector({ onSelect }) {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: leads, isLoading } = useQuery({
        queryKey: ['lead-search', debouncedSearch],
        queryFn: async () => {
            // If search is empty, return recent leads
            if (!debouncedSearch) return base44.entities.Lead.list('created_date', 10);
            
            // Filter locally if regex not supported or list all
            const all = await base44.entities.Lead.list();
            return all.filter(l => 
                l.full_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                l.phone_number?.includes(debouncedSearch)
            ).slice(0, 10);
        },
        enabled: true
    });

    return (
        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
            <div className="flex items-center gap-2 mb-2">
                <div className="bg-red-100 p-1.5 rounded-full">
                    <User className="w-4 h-4 text-red-600" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">בחר ליד לשיוך (חובה)</h3>
            </div>
            
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                    placeholder="חפש לפי שם או טלפון..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pr-9 bg-white"
                />
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                {isLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
                ) : leads?.length > 0 ? (
                    leads.map(lead => (
                        <Card 
                            key={lead.id} 
                            className="p-3 hover:border-red-300 cursor-pointer transition-colors flex justify-between items-center group"
                            onClick={() => onSelect(lead)}
                        >
                            <div>
                                <div className="font-bold text-slate-800 text-sm group-hover:text-red-700">{lead.full_name}</div>
                                <div className="text-xs text-slate-500">{lead.phone_number} • {lead.city || 'ללא עיר'}</div>
                            </div>
                            <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                <Check className="w-4 h-4 text-green-600" />
                            </Button>
                        </Card>
                    ))
                ) : (
                    <div className="text-center text-xs text-slate-400 py-2">לא נמצאו תוצאות</div>
                )}
            </div>
        </div>
    );
}