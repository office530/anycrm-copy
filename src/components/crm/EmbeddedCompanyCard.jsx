import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight } from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useSettings } from '@/components/context/SettingsContext';

export default function EmbeddedCompanyCard({ companyId }) {
    const { theme } = useSettings();
    
    const { data: company, isLoading } = useQuery({
        queryKey: ['embedded_company', companyId],
        queryFn: async () => {
             if(!companyId) return null;
             const res = await base44.entities.Company.list({ id: companyId });
             return res[0];
        },
        enabled: !!companyId
    });

    if (!companyId) return null;
    if (isLoading) return <div className="h-20 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />;
    if (!company) return null;

    return (
        <div className={`p-4 rounded-xl border flex items-center justify-between group transition-all ${
            theme === 'dark' 
                ? 'bg-slate-900/50 border-slate-700 hover:border-slate-600' 
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
        }`}>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                    {company.logo_url ? (
                        <img src={company.logo_url} alt={company.name} className="w-8 h-8 object-contain" />
                    ) : (
                        <Building2 className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                    )}
                </div>
                <div>
                    <div className={`text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Linked Company</div>
                    <div className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{company.name}</div>
                </div>
            </div>
            
            <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Link to={createPageUrl(`CompanyProfile?id=${company.id}`)}>
                    View Profile <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
            </Button>
        </div>
    );
}