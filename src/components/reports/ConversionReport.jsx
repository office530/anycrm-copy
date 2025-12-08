import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, ArrowLeftRight, Percent } from "lucide-react";
import { useSettings } from "@/components/context/SettingsContext";

const COLORS = ['#ef4444', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function ConversionReport({ leads, opportunities, timeRange }) {
  const { theme } = useSettings();
  
  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const convertedLeads = leads.filter(l => l.lead_status === 'Converted' || l.lead_status?.includes('הומר')).length;
    const totalOpps = opportunities.length;
    const closedWon = opportunities.filter(o => o.deal_stage?.includes("Won") || o.deal_stage?.includes("בהצלחה")).length;

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const winRate = totalOpps > 0 ? (closedWon / totalOpps) * 100 : 0;

    return {
      totalLeads,
      convertedLeads,
      totalOpps,
      closedWon,
      conversionRate,
      winRate
    };
  }, [leads, opportunities]);

  const funnelData = [
    {
      "value": stats.totalLeads,
      "name": "סה\"כ לידים",
      "fill": "#ef4444"
    },
    {
      "value": stats.convertedLeads,
      "name": "הומרו להזדמנות",
      "fill": "#8b5cf6"
    },
    {
      "value": stats.totalOpps,
      "name": "הזדמנויות פעילות", // Assuming converted leads roughly equals opps, but practically might differ
      "fill": "#f59e0b"
    },
    {
      "value": stats.closedWon,
      "name": "נסגרו בהצלחה",
      "fill": "#10b981"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-red-200' : ''}`}>יחס המרה (ליד להזדמנות)</CardTitle>
            <ArrowLeftRight className={`h-4 w-4 ${theme === 'dark' ? 'text-red-400 drop-shadow-sm' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-red-400' : ''}`}>{stats.conversionRate.toFixed(1)}%</div>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{stats.convertedLeads} מתוך {stats.totalLeads} לידים</p>
          </CardContent>
        </Card>

        <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-emerald-200' : ''}`}>יחס סגירה (Win Rate)</CardTitle>
            <Percent className={`h-4 w-4 ${theme === 'dark' ? 'text-emerald-400 drop-shadow-sm' : 'text-green-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-emerald-400' : ''}`}>{stats.winRate.toFixed(1)}%</div>
            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{stats.closedWon} מתוך {stats.totalOpps} הזדמנויות</p>
          </CardContent>
        </Card>
        
        <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-purple-200' : ''}`}>איכות לידים</CardTitle>
                <Users className={`h-4 w-4 ${theme === 'dark' ? 'text-purple-400 drop-shadow-sm' : 'text-purple-500'}`} />
            </CardHeader>
            <CardContent>
                {/* Dummy logic for example */}
                <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-purple-400' : ''}`}>גבוהה</div>
                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>מבוסס על אחוזי המרה</p>
            </CardContent>
        </Card>
      </div>

      <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
        <CardHeader>
          <CardTitle className={theme === 'dark' ? 'text-white' : ''}>משפך המרות (Sales Funnel)</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip />
              <Funnel
                data={funnelData}
                dataKey="value"
              >
                {/* <LabelList position="right" fill="#000" stroke="none" dataKey="name" /> */}
                <LabelList position="right" fill="#666" stroke="none" dataKey="value" />
                {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            {funnelData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>{item.name}: <strong className={theme === 'dark' ? 'text-white' : ''}>{item.value}</strong></span>
                </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}