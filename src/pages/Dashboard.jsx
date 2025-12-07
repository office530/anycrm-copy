import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area } from
'recharts';
import { Users, DollarSign, Activity, CheckCircle2, Clock, Calendar, AlertCircle } from 'lucide-react';
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
  const { theme } = useSettings();

  const { data: leads = [], isLoading: isLoadingLeads } = useQuery({ queryKey: ['leads'], queryFn: () => base44.entities.Lead.list() });
  const { data: opportunities = [], isLoading: isLoadingOpps } = useQuery({ queryKey: ['opportunities'], queryFn: () => base44.entities.Opportunity.list() });
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list() });

  // סינון נתונים לפי טווח זמן
  const { filteredLeads, filteredOpps, dateRangeLabel } = useMemo(() => {
    let start = moment();
    let label = "";

    switch (timeRange) {
      case 'month':
        start = moment().startOf('month');
        label = "החודש הנוכחי";
        break;
      case 'quarter':
        start = moment().startOf('quarter');
        label = "הרבעון הנוכחי";
        break;
      case 'year':
        start = moment().startOf('year');
        label = "השנה הנוכחית";
        break;
      default:
        start = moment('2000-01-01');
        label = "כל הזמן";
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
    const newLeads = filteredLeads.filter((l) => l.lead_status === 'New' || l.lead_status === 'חדש').length;
    const convertedLeads = filteredLeads.filter((l) => l.lead_status?.includes('Converted') || l.lead_status?.includes('הומר')).length;

    const totalOpps = filteredOpps.length;
    const wonOpps = filteredOpps.filter((o) => o.deal_stage?.includes('Won') || o.deal_stage?.includes('בהצלחה'));
    const totalWonValue = wonOpps.reduce((sum, o) => sum + (o.loan_amount_requested || 0), 0);

    // חלוקה לשלבים עבור הזדמנויות
    const oppsByStage = filteredOpps.reduce((acc, o) => {
      const stage = o.deal_stage?.split('(')[0]?.trim() || 'Other';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});
    const stageData = Object.entries(oppsByStage).map(([name, value]) => ({ name, value }));

    // נתונים לגרף מגמות מכירה (לידים vs עסקאות סגורות)
    const trendMap = {};
    // אתחול המפה לפי טווח הזמן הנבחר (יומי/שבועי/חודשי)
    // לפשטות נציג לפי ימים ב-30 יום האחרונים או לפי חודשים בשנה
    const dateFormat = timeRange === 'year' ? 'MMM' : 'DD/MM';

    filteredLeads.forEach((l) => {
      const date = moment(l.created_date).format(dateFormat);
      if (!trendMap[date]) trendMap[date] = { date, leads: 0, sales: 0 };
      trendMap[date].leads++;
    });

    wonOpps.forEach((o) => {
      const date = moment(o.updated_date || o.created_date).format(dateFormat); // שימוש בתאריך עדכון לזכייה אם אפשר
      if (!trendMap[date]) trendMap[date] = { date, leads: 0, sales: 0 };
      trendMap[date].sales++;
    });

    // המרה למערך ומיון
    const trendData = Object.values(trendMap).sort((a, b) => {
      // לוגיקת מיון פשוטה לפי מחרוזת תאריך - במצב אמת צריך לוגיקה חכמה יותר
      return 0;
    });

    // משימות
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
          theme === 'dark' 
              ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' 
              : 'bg-gradient-to-br from-white to-neutral-50/50 md:bg-white border-neutral-100'
      }`}>
          <div className="relative z-10 max-w-lg text-center md:text-right w-full md:w-auto">
              <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>ברוכים הבאים </h1>
              <p className={`text-base md:text-lg mb-6 ${theme === 'dark' ? 'text-cyan-400' : 'text-neutral-600'}`}>Old Leads Database</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link to={createPageUrl('Leads')}>
                  <Button className={`rounded-full px-6 text-white transition-all ${
                      theme === 'dark' 
                          ? 'bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/50' 
                          : 'bg-red-700 hover:bg-red-800'
                  }`}>
                      הוסף נתונים חדשים
                  </Button>
                </Link>
                <Link to={createPageUrl('Reports')}>
                  <Button variant="outline" className={`rounded-full px-6 transition-all ${
                      theme === 'dark' 
                          ? 'border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10' 
                          : 'bg-zinc-200 text-red-700 border-red-200 hover:bg-red-50'
                  }`}>
                      צפה בדוחות
                  </Button>
                </Link>
              </div>
          </div>
          <div className="relative z-10">
              <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69360168d7acf9f690aed166/c1a956565_image.png"
              alt="AnyCRM Logo"
              className="h-32 object-contain" />

          </div>
          {/* Decorative Background */}
          <div className={`absolute right-0 top-0 w-full md:w-1/3 h-full bg-gradient-to-b md:bg-gradient-to-l opacity-50 pointer-events-none ${
              theme === 'dark' 
                  ? 'from-cyan-500/20 md:from-cyan-500/20 to-transparent' 
                  : 'from-red-50/50 md:from-red-50 to-transparent'
          }`}></div>
          </div>

      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-8 text-center md:text-right">
        <div className="w-full md:w-auto">
            <h2 className="text-2xl font-bold text-neutral-800">סקירת ביצועים</h2>
            <p className="text-neutral-600">נתונים עבור: {dateRangeLabel}</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] bg-white border-red-100 focus:ring-red-200">
                <Calendar className="w-4 h-4 ml-2 text-neutral-600" />
                <SelectValue placeholder="בחר טווח זמן" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="month">החודש הנוכחי</SelectItem>
                <SelectItem value="quarter">הרבעון הנוכחי</SelectItem>
                <SelectItem value="year">השנה הנוכחית</SelectItem>
                <SelectItem value="all">כל הזמן</SelectItem>
            </SelectContent>
        </Select>
      </div>

      {/* KPIs Row 1: Leads Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="סה״כ לידים" value={stats.totalLeads} icon={Users} color="bg-red-500" subtext={`${stats.newLeads} חדשים בתקופה זו`} />
        <KpiCard title="לידים שהומרו" value={stats.convertedLeads} icon={Activity} color="bg-purple-500" subtext={`${(stats.convertedLeads / (stats.totalLeads || 1) * 100).toFixed(1)}% יחס המרה`} />
        <KpiCard title="הכנסות בפועל" value={`₪${stats.totalWonValue.toLocaleString()}`} icon={DollarSign} color="bg-emerald-500" subtext={`${stats.wonOppsCount} עסקאות סגורות`} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Charts */}
          <div className="space-y-6 lg:col-span-2">
              
              {/* Sales Trend Chart */}
              <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-neutral-200">
                  <CardHeader>
                      <CardTitle className="text-slate-800 text-lg font-semibold tracking-tight flex items-center gap-2">
                          <Activity className="w-5 h-5 text-neutral-500" /> מגמות לידים ומכירות
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
                            <Area type="monotone" dataKey="leads" name="לידים" stroke="#a3a3a3" fill="url(#colorLeads)" strokeWidth={2} />
                            <Area type="monotone" dataKey="sales" name="מכירות" stroke="#b91c1c" fill="url(#colorSales)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
              </Card>

              {/* Opportunity Stages */}
              <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-neutral-200">
                  <CardHeader>
                      <CardTitle className="text-slate-800 text-lg font-semibold tracking-tight">הזדמנויות לפי שלב</CardTitle>
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
          </div>

          {/* Right Column: Pipeline Summary & Tasks */}
          <div className="space-y-6">
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl p-6 md:p-8 relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                  {/* Header */}
                  <div>
                      <div className="text-slate-500 mb-2 text-sm font-medium tracking-wide">סטטוס Pipeline</div>
                      <div className="text-4xl md:text-5xl font-bold mb-1 text-slate-900">{stats.totalOpps - stats.wonOppsCount}</div>
                      <div className="text-slate-600 text-sm">הזדמנויות פעילות</div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                          <div className="text-2xl font-bold text-red-700">₪{(filteredOpps.reduce((sum, o) => sum + (o.loan_amount_requested || 0), 0) / 1000000).toFixed(1)}M</div>
                          <div className="text-xs text-slate-600 mt-1">סה״כ ערך Pipeline</div>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                          <div className="text-2xl font-bold text-emerald-700">{stats.wonOppsCount}</div>
                          <div className="text-xs text-slate-600 mt-1">עסקאות נסגרו</div>
                      </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-600">
                          <span>יחס הצלחה</span>
                          <span className="font-bold text-slate-900">{(stats.wonOppsCount / (stats.totalOpps || 1) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all duration-500" style={{ width: `${stats.wonOppsCount / (stats.totalOpps || 1) * 100}%` }}></div>
                      </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">ממוצע ערך עסקה</span>
                          <span className="font-bold text-slate-900">₪{(filteredOpps.reduce((sum, o) => sum + (o.loan_amount_requested || 0), 0) / (filteredOpps.length || 1)).toLocaleString('he-IL', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">בשלב מתקדם</span>
                          <span className="font-bold text-slate-900">{filteredOpps.filter(o => o.deal_stage?.includes('Documents') || o.deal_stage?.includes('Harel')).length}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">זכייה צפויה החודש</span>
                          <span className="font-bold text-slate-900">₪{(filteredOpps.filter(o => o.expected_close_date && moment(o.expected_close_date).isSame(moment(), 'month')).reduce((sum, o) => sum + ((o.loan_amount_requested || 0) * (o.probability || 0) / 100), 0)).toLocaleString('he-IL', { maximumFractionDigits: 0 })}</span>
                      </div>
                  </div>
              </div>
              {/* Decorations */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-red-50 blur-3xl rounded-full pointer-events-none"></div>
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-slate-50 blur-2xl rounded-full pointer-events-none"></div>
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
        theme === 'dark' 
            ? 'bg-slate-800 border-slate-700 hover:border-cyan-500/50' 
            : 'bg-white border-neutral-100'
    }`}>
            <div className="relative z-10 text-center">
                <div className="flex items-center justify-center mb-4">
                    <div className={`p-3 rounded-2xl ${color} ${theme === 'dark' ? 'bg-opacity-20' : 'bg-opacity-10'}`}>
                        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                    </div>
                    {total && <span className={`text-xs font-bold px-2 py-1 rounded-full mr-2 ${
                        theme === 'dark' ? 'text-cyan-400 bg-slate-700' : 'text-neutral-500 bg-neutral-50'
                    }`}>{total} סה״כ</span>}
                </div>
                <h3 className={`text-2xl md:text-3xl font-bold mb-1 ${theme === 'dark' ? 'text-white' : 'text-neutral-800'}`}>{value}</h3>
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-600'}`}>{title}</p>
                <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>{subtext}</p>
            </div>
        </div>);

}