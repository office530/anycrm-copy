import React, { useState, useMemo } from 'react';
import { 
    Users, Mail, MessageSquare, CalendarCheck, TrendingUp, 
    AlertTriangle, PauseCircle, PlayCircle, MoreHorizontal,
    ArrowRight, Filter, Download, Plus, Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useSettings } from '@/components/context/SettingsContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function MarketingDashboard() {
    const navigate = useNavigate();
    const { theme } = useSettings();
    const queryClient = useQueryClient();

    // Fetch Sequences
    const { data: sequences = [], isLoading } = useQuery({
        queryKey: ['marketing_sequences'],
        queryFn: () => base44.entities.MarketingSequence.list(),
    });

    // Mock KPI Data Calculation (Replace with real aggregation when available)
    const kpiData = useMemo(() => {
        const totalActive = sequences.filter(s => s.status === 'ACTIVE').length;
        // In a real app, we'd sum up enrollments from a SequenceEnrollment query
        return [
            { title: "Active Sequences", value: totalActive, icon: Users, color: "text-blue-500", bg: "bg-blue-100" },
            { title: "Total Campaigns", value: sequences.length, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-100" },
            { title: "Meetings Booked", value: "0", icon: CalendarCheck, color: "text-purple-500", bg: "bg-purple-100" }, // Placeholder
            { title: "Pipeline Generated", value: "$0.00", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-100" }, // Placeholder
        ];
    }, [sequences]);

    const funnelData = [
        { name: 'Sent', value: 0, fill: '#94a3b8' },
        { name: 'Opened', value: 0, fill: '#60a5fa' },
        { name: 'Replied', value: 0, fill: '#818cf8' },
        { name: 'Booked', value: 0, fill: '#34d399' },
    ];

    const toggleStatusMutation = useMutation({
        mutationFn: async ({ id, currentStatus }) => {
            const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
            return base44.entities.MarketingSequence.update(id, { status: newStatus });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['marketing_sequences']);
        }
    });

    const cardClass = theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
    const subTextClass = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Marketing Performance</h1>
                    <p className={subTextClass}>Revenue-focused overview of your campaigns</p>
                </div>
                <div className="flex gap-2">
                     <Button variant="outline" className={theme === 'dark' ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : ''}>
                        <Download className="w-4 h-4 mr-2" /> Export Report
                    </Button>
                    <Button onClick={() => navigate(createPageUrl('SequenceBuilder'))} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-5 h-5 mr-2" /> Create Sequence
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {kpiData.map((kpi, index) => (
                    <Card key={index} className={`${cardClass} shadow-sm hover:shadow-md transition-shadow`}>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium ${subTextClass}`}>{kpi.title}</p>
                                <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{kpi.value}</p>
                            </div>
                            <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-opacity-20' : ''} ${kpi.bg}`}>
                                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Funnel Fallout Chart */}
                <Card className={`lg:col-span-2 ${cardClass}`}>
                    <CardHeader>
                        <CardTitle className={theme === 'dark' ? 'text-white' : ''}>Funnel Fallout (Aggregate)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                                <XAxis type="number" tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} />
                                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12, fill: theme === 'dark' ? '#94a3b8' : '#64748b'}} />
                                <Tooltip 
                                    cursor={{fill: 'transparent'}} 
                                    contentStyle={{ 
                                        backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                                        borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                                        color: theme === 'dark' ? '#fff' : '#000'
                                    }}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32} label={{ position: 'right', fill: theme === 'dark' ? '#94a3b8' : '#64748b' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Negative Sentiment Watchlist */}
                <Card className={cardClass}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-red-600 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Negative Sentiment
                        </CardTitle>
                        <Badge variant="outline" className={`bg-red-50 text-red-600 border-red-200 ${theme === 'dark' ? 'bg-red-900/20 border-red-800' : ''}`}>Risk Watch</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="text-sm text-slate-500 italic text-center py-4">No negative sentiment detected recently.</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sequence Leaderboard */}
            <Card className={cardClass}>
                <CardHeader>
                    <CardTitle className={theme === 'dark' ? 'text-white' : ''}>Sequence Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className={`${theme === 'dark' ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-50 text-slate-500'} uppercase font-semibold`}>
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Sequence Name</th>
                                    <th className="px-4 py-3">Owner</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Created</th>
                                    <th className="px-4 py-3 text-right rounded-r-lg">Action</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700' : 'divide-slate-100'}`}>
                                {sequences.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                                            No sequences found. Create your first one!
                                        </td>
                                    </tr>
                                ) : (
                                    sequences.map((seq) => (
                                        <tr key={seq.id} className={`${theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/50'} cursor-pointer`} onClick={() => navigate(createPageUrl('SequenceBuilder') + `?id=${seq.id}`)}>
                                            <td className={`px-4 py-3 font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{seq.name}</td>
                                            <td className={`px-4 py-3 ${subTextClass}`}>{seq.created_by || 'Unknown'}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant="secondary" className={`${
                                                    seq.status === 'ACTIVE' 
                                                        ? (theme === 'dark' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                                                        : (theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600')
                                                }`}>
                                                    {seq.status}
                                                </Badge>
                                            </td>
                                            <td className={`px-4 py-3 ${subTextClass}`}>{new Date(seq.created_date).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    onClick={() => toggleStatusMutation.mutate({ id: seq.id, currentStatus: seq.status })}
                                                    className={seq.status === 'ACTIVE' ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"}
                                                >
                                                    {seq.status === 'ACTIVE' ? <PauseCircle className="w-4 h-4 mr-1" /> : <PlayCircle className="w-4 h-4 mr-1" />}
                                                    {seq.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}