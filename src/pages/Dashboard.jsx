import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area } from
'recharts';
import { Users, DollarSign, Activity, CheckCircle2, Clock, Calendar, AlertCircle, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import moment from 'moment';
import TasksWidget from '@/components/dashboard/TasksWidget';
import { useSettings } from '@/components/context/SettingsContext';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('month'); // 'month', 'quarter', 'year', 'all'
  const { theme, branding } = useSettings();

  const { data: leads = [], isLoading: isLoadingLeads } = useQuery({ queryKey: ['leads'], queryFn: () => base44.entities.Lead.list() });
  const { data: opportunities = [], isLoading: isLoadingOpps } = useQuery({ queryKey: ['opportunities'], queryFn: () => base44.entities.Opportunity.list() });
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list() });

  // Filter data by time range
  const { filteredLeads, filteredOpps, dateRangeLabel } = useMemo(() => {
    let start = moment();
    let label = "";

    switch (timeRange) {
      case 'month':
        start = moment().startOf('month');
        label = "Current Month";
        break;
      case 'quarter':
        start = moment().startOf('quarter');
        label = "Current Quarter";
        break;
      case 'year':
        start = moment().startOf('year');
        label = "Current Year";
        break;
      default:
        start = moment('2000-01-01');
        label = "All Time";
    }

    return {
      filteredLeads: leads.filter((l) => moment(l.created_date).isSameOrAfter(start)),
      filteredOpps: opportunities.filter((o) => moment(o.created_date).isSameOrAfter(start)),
      dateRangeLabel: label
    };
  }, [leads, opportunities, timeRange]);

  // חישוב מדדים (KPIs)
  const stats = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const newLeads = filteredLeads.filter((l) => l.lead_status === 'New').length;
    const convertedLeads = filteredLeads.filter((l) => l.lead_status?.includes('Converted')).length;

    const totalOpps = filteredOpps.length;
    const wonOpps = filteredOpps.filter((o) => o.deal_stage?.includes('Won'));
    const totalWonValue = wonOpps.reduce((sum, o) => sum + (o.loan_amount_requested || 0), 0);

    // Opportunity Stages
    const oppsByStage = filteredOpps.reduce((acc, o) => {
      const stage = o.deal_stage?.split('(')[0]?.trim() || 'Other';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});
    const stageData = Object.entries(oppsByStage).map(([name, value]) => ({ name, value }));

    // Sales Trends Data (Leads vs Won Deals)
    const trendMap = {};
    const dateFormat = timeRange === 'year' ? 'MMM' : 'DD/MM';

    filteredLeads.forEach((l) => {
      const date = moment(l.created_date).format(dateFormat);
      if (!trendMap[date]) trendMap[date] = { date, leads: 0, sales: 0 };
      trendMap[date].leads++;
    });

    wonOpps.forEach((o) => {
      const date = moment(o.updated_date || o.created_date).format(dateFormat);
      if (!trendMap[date]) trendMap[date] = { date, leads: 0, sales: 0 };
      trendMap[date].sales++;
    });

    const trendData = Object.values(trendMap).sort((a, b) => 0); // Simple sort

    // Tasks
    const today = moment().endOf('day');
    const upcomingTasks = tasks.filter((t) => {
      if (t.status === 'done') return false;
      const due = moment(t.due_date);
      return due.isValid() && due.isSameOrBefore(today.clone().add(7, 'days'));
    }).sort((a, b) => moment(a.due_date).valueOf() - moment(b.due_date).valueOf()).slice(0, 5);

    return {
      totalLeads, newLeads, convertedLeads,
      totalOpps, wonOppsCount: wonOpps.length, totalWonValue,
      stageData, trendData, upcomingTasks
    };
  }, [filteredLeads, filteredOpps, tasks, timeRange]);

  if (isLoadingLeads || isLoadingOpps || isLoadingTasks) return <div className="p-8"><Skeleton className="h-96 w-full rounded-3xl" /></div>;

  return (
    <div className="space-y-6 md:space-y-8 pb-10 max-w-7xl mx-auto">

      {/* Branding Hero Section */}
      <div className={`rounded-3xl p-6 md:p-8 shadow-sm border flex flex-col-reverse md:flex-row items-center justify-between overflow-hidden relative gap-6 md:gap-0 transition-colors duration-300 ${
      theme === 'dark' ?
      'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' :
      'bg-gradient-to-br from-white to-neutral-50/50 md:bg-white border-neutral-100'}`
      }>
          <div className="relative z-10 max-w-lg text-center md:text-left w-full md:w-auto">
              <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${theme === 'dark' ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400' : 'text-neutral-900'}`}>Welcome Back</h1>
              <p className="text-base md:text-lg mb-6 text-cyan-400">Leads Database</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link to={createPageUrl('Leads')}>
                  <Button className={`rounded-full px-6 text-white transition-all ${
              theme === 'dark' ?
              'bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/50' :
              'bg-red-700 hover:bg-red-800'}`
              }>
                      Add New Data
                  </Button>
                </Link>
                <Link to={createPageUrl('Reports')}>
                  <Button variant="outline" className={`rounded-full px-6 transition-all border-2 ${
              theme === 'dark' ?
              'border-purple-500/60 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 hover:text-purple-300 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]' :
              'bg-white border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300'}`
              }>
                      View Reports
                  </Button>
                </Link>
              </div>
          </div>
          <div className="relative z-10">
              <img
                src={branding.logoUrl}
                alt="AnyCRM Logo"
                className={`h-40 object-contain rounded-full transition-all duration-500 ${theme === 'dark' ? 'drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'drop-shadow-xl'}`} 
              />
          </div>
          {/* Decorative Background */}
          <div className={`absolute right-0 top-0 w-full md:w-1/3 h-full bg-gradient-to-b md:bg-gradient-to-l opacity-50 pointer-events-none ${
        theme === 'dark' ?
        'from-cyan-500/20 md:from-cyan-500/20 to-transparent' :
        'from-red-50/50 md:from-red-50 to-transparent'}`
        }></div>
          </div>

      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-8 text-center md:text-left">
        <div className="w-full md:w-auto">
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-800'}`}>Performance Overview</h2>
            <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-neutral-600'}`}>Data for: {dateRangeLabel}</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className={`w-[180px] ${
          theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-red-100 focus:ring-red-200'}`
          }>
                <Calendar className="w-4 h-4 mr-2 text-neutral-600" />
                <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="month">Current Month</SelectItem>
                <SelectItem value="quarter">Current Quarter</SelectItem>
                <SelectItem value="year">Current Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
        </Select>
      </div>

      {/* KPIs Row 1: Leads Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Total Leads" value={stats.totalLeads} icon={Users} color="bg-red-500" subtext={`${stats.newLeads} new this period`} />
        <KpiCard title="Converted Leads" value={stats.convertedLeads} icon={Activity} color="bg-purple-500" subtext={`${(stats.convertedLeads / (stats.totalLeads || 1) * 100).toFixed(1)}% conversion rate`} />
        <KpiCard title="Won Revenue" value={`₪${stats.totalWonValue.toLocaleString()}`} icon={DollarSign} color="bg-emerald-500" subtext={`${stats.wonOppsCount} deals won`} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Charts */}
          <div className="space-y-6 lg:col-span-2">
              
              {/* Sales Trend Chart */}
              <Card className={`border-none shadow-sm rounded-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
                  <CardHeader>
                      <CardTitle className="text-[#f5b638] text-lg font-semibold tracking-tight flex items-center gap-2">
                          <Activity className="w-5 h-5 text-neutral-500" /> Sales & Leads Trend
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.trendData}>
                            <defs>
                                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a3a3a3" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#a3a3a3" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#b91c1c" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#b91c1c" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="leads" name="Leads" stroke="#a3a3a3" fill="url(#colorLeads)" strokeWidth={2} />
                            <Area type="monotone" dataKey="sales" name="Sales" stroke="#b91c1c" fill="url(#colorSales)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
              </Card>

              {/* Opportunity Stages */}
              <Card className={`border-none shadow-sm rounded-2xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
                  <CardHeader>
                      <CardTitle className="text-[#f5b638] text-lg font-semibold tracking-tight">Opportunities by Stage</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.stageData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} interval={0} />
                            <YAxis hide />
                            <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                            <Bar dataKey="value" fill="#b91c1c" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
              </Card>

              {/* Add Report Placeholder */}
              <Link to={createPageUrl('Reports')}>
                <Card className={`h-[180px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group ${
                  theme === 'dark' ? 
                  'bg-slate-800/50 border-slate-700 hover:border-purple-500/50 hover:bg-slate-800 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 
                  'bg-neutral-50/50 border-neutral-200 hover:border-purple-200 hover:bg-white'
                }`}>
                  <div className={`p-3 rounded-full mb-3 transition-all duration-300 ${
                    theme === 'dark' ? 'bg-slate-800 group-hover:bg-purple-500/20 text-slate-400 group-hover:text-purple-400 group-hover:scale-110' : 'bg-white group-hover:bg-purple-50 text-slate-400 group-hover:text-purple-600 shadow-sm group-hover:scale-110'
                  }`}>
                    <Plus className="w-8 h-8" />
                  </div>
                  <span className={`font-medium text-lg ${theme === 'dark' ? 'text-slate-400 group-hover:text-purple-300' : 'text-slate-600 group-hover:text-purple-700'}`}>
                    Add New Report
                  </span>
                </Card>
              </Link>
          </div>

          {/* Right Column: Pipeline Summary & Tasks */}
          <div className="space-y-6">
          <Card className={`shadow-sm rounded-2xl p-6 md:p-8 relative overflow-hidden transition-colors ${
          theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`
          }>
              <div className="relative z-10 space-y-6">
                  {/* Header */}
                  <div>
                      <div className={`mb-2 text-sm font-medium tracking-wide ${theme === 'dark' ? 'text-cyan-400' : 'text-slate-500'}`}>Pipeline Status</div>
                      <div className={`text-4xl md:text-5xl font-bold mb-1 ${theme === 'dark' ? 'text-white drop-shadow-sm' : 'text-slate-900'}`}>{stats.totalOpps - stats.wonOppsCount}</div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Active Opportunities</div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                      <div className={`rounded-xl p-4 border ${theme === 'dark' ? 'bg-red-950/20 border-red-900/30' : 'bg-red-50 border-red-100'}`}>
                          <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>₪{(filteredOpps.reduce((sum, o) => sum + (o.loan_amount_requested || 0), 0) / 1000000).toFixed(1)}M</div>
                          <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Total Pipeline Value</div>
                      </div>
                      <div className={`rounded-xl p-4 border ${theme === 'dark' ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-emerald-50 border-emerald-100'}`}>
                          <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>{stats.wonOppsCount}</div>
                          <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Deals Won</div>
                      </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                      <div className={`flex justify-between text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                          <span>Success Rate</span>
                          <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{(stats.wonOppsCount / (stats.totalOpps || 1) * 100).toFixed(0)}%</span>
                      </div>
                      <div className={`w-full rounded-full h-2.5 overflow-hidden ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`}>
                          <div className={`bg-gradient-to-r h-full rounded-full transition-all duration-500 ${theme === 'dark' ? 'from-cyan-500 to-purple-500' : 'from-red-500 to-red-600'}`} style={{ width: `${stats.wonOppsCount / (stats.totalOpps || 1) * 100}%` }}></div>
                      </div>
                  </div>

                  {/* Quick Stats */}
                  <div className={`space-y-3 pt-4 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                      <div className="flex justify-between items-center text-sm">
                          <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Avg. Deal Value</span>
                          <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>₪{(filteredOpps.reduce((sum, o) => sum + (o.loan_amount_requested || 0), 0) / (filteredOpps.length || 1)).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Advanced Stage</span>
                          <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{filteredOpps.filter((o) => o.deal_stage?.includes('Documents') || o.deal_stage?.includes('Harel')).length}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>Expected Win This Month</span>
                          <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>₪{filteredOpps.filter((o) => o.expected_close_date && moment(o.expected_close_date).isSame(moment(), 'month')).reduce((sum, o) => sum + (o.loan_amount_requested || 0) * (o.probability || 0) / 100, 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                      </div>
                  </div>
              </div>
              {/* Decorations */}
              <div className={`absolute -bottom-20 -right-20 w-64 h-64 blur-3xl rounded-full pointer-events-none transition-colors ${theme === 'dark' ? 'bg-red-900/5' : 'bg-red-50'}`}></div>
              <div className={`absolute -top-10 -left-10 w-40 h-40 blur-2xl rounded-full pointer-events-none transition-colors ${theme === 'dark' ? 'bg-slate-800/5' : 'bg-slate-50'}`}></div>
              </Card>

              {/* Tasks Widget */}
              <TasksWidget />
              </div>
              </div>
    </div>);

}

function KpiCard({ title, value, subtext, icon: Icon, color, total }) {
  const { theme } = useSettings();
  return (
    <div className={`p-5 md:p-6 rounded-3xl shadow-sm border relative overflow-hidden group hover:shadow-md transition-all ${
    theme === 'dark' ?
    'bg-slate-800 border-slate-700 hover:border-cyan-500/50' :
    'bg-white border-neutral-100'}`
    }>
            <div className="relative z-10 text-center">
                <div className="flex items-center justify-center mb-4">
                    <div className={`p-3 rounded-2xl ${color} ${theme === 'dark' ? 'bg-opacity-20' : 'bg-opacity-10'}`}>
                        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                    </div>
                    {total && <span className={`text-xs font-bold px-2 py-1 rounded-full ml-2 ${
          theme === 'dark' ? 'text-cyan-400 bg-slate-700' : 'text-neutral-500 bg-neutral-50'}`
          }>{total} Total</span>}
                </div>
                <h3 className={`text-2xl md:text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-neutral-800'}`}>{value}</h3>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-600'}`}>{title}</p>
                <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>{subtext}</p>
            </div>
        </div>);

}