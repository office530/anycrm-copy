import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { useSettings } from "@/components/context/SettingsContext";
import { differenceInDays } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from "@/components/ui/badge";

export default function StagnantDealsWidget({ opportunities }) {
    const { theme, branding } = useSettings();
    const isDark = theme === 'dark';

    const stagnantDeals = useMemo(() => {
        const thresholdDays = 14;
        const now = new Date();

        return opportunities
            .filter(o => !['Closed Won', 'Closed Lost'].includes(o.deal_stage))
            .map(o => ({
                ...o,
                daysInStage: differenceInDays(now, new Date(o.updated_date || o.created_date))
            }))
            .filter(o => o.daysInStage > thresholdDays)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 4);
    }, [opportunities]);

    return (
        <Card className="h-full border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    At Risk (Stagnant)
                </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-3">
                {stagnantDeals.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed ${isDark ? 'border-slate-800 bg-slate-800/20' : 'border-slate-200 bg-slate-50'}`}>
                        <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 mb-2">
                             <Clock className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">Pipeline is moving fast!</p>
                        <p className="text-xs text-slate-400">No deals stuck {'>'} 14 days</p>
                    </div>
                ) : (
                    stagnantDeals.map((deal) => (
                        <div 
                            key={deal.id}
                            className={`group relative p-3 rounded-xl border transition-all ${
                                isDark 
                                ? 'bg-slate-800/40 border-slate-700/50 hover:border-red-500/30' 
                                : 'bg-white border-slate-100 hover:border-red-200'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <div>
                                    <h4 className={`text-sm font-semibold truncate max-w-[140px] ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                        {deal.lead_name || 'Unknown Opportunity'}
                                    </h4>
                                    <p className="text-xs text-slate-500">{deal.deal_stage}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`text-sm font-bold font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                        {branding.currency}{deal.amount?.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                                <Badge variant="outline" className={`${isDark ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                    {deal.daysInStage} days stuck
                                </Badge>
                                <Link to={createPageUrl('Opportunities')} className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
                                    <ArrowRight className="w-3 h-3" />
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}