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

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('month'); // 'month', 'quarter', 'year', 'all'

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
      <div className="bg-gradient-to-br from-white to-neutral-50/50 md:bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 md:border-neutral-100 border-transparent flex flex-col-reverse md:flex-row items-center justify-between overflow-hidden relative gap-6 md:gap-0">
          <div className="relative z-10 max-w-lg text-center md:text-right w-full md:w-auto">
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">ברוכים הבאים </h1>
              <p className="text-neutral-600 text-base md:text-lg mb-6">Old Leads Database</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link to={createPageUrl('Leads')}>
                  <Button className="bg-red-700 hover:bg-red-800 text-white rounded-full px-6">
                      הוסף נתונים חדשים
                  </Button>
                </Link>
                <Link to={createPageUrl('Reports')}>
                  <Button variant="outline" className="bg-zinc-200 text-red-700 px-6 py-2 text-sm font-medium rounded-full inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:text-accent-foreground h-9 border-red-200 hover:bg-red-50">
                      צפה בדוחות
                  </Button>
                </Link>
              </div>
          </div>
          <div className="relative z-10">
              <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/692ea53ece3f48d4695254eb/413fe96bb_image.png"
            alt="Gishers Logo"
            className="h-32 object-contain" />

          </div>
          {/* Decorative Background */}
          <div className="absolute right-0 top-0 w-full md:w-1/3 h-full bg-gradient-to-b md:bg-gradient-to-l from-red-50/50 md:from-red-50 to-transparent opacity-50 pointer-events-none"></div>
      </div>

      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-8">
        <div>
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
          
          {/* Left Column: Charts (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
              
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

          {/* Right Column: Tasks & Quick Stats */}
          <div className="space-y-6">
              
              {/* Tasks List */}
              <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-neutral-200 h-full max-h-[600px] flex flex-col">
                  <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center justify-between">
                          <span className="text-zinc-800 flex items-center gap-2">משימות קרובות</span>
                          <Badge variant="outline" className="text-slate-800 px-2.5 py-0.5 text-xs font-semibold rounded-md inline-flex items-center border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">{stats.upcomingTasks.length}</Badge>
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto pr-2">
                      {stats.upcomingTasks.length === 0 ?
              <div className="text-center py-10 text-neutral-500">
                              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                              <p>אין משימות דחופות</p>
                          </div> :

              <div className="space-y-3">
                              {stats.upcomingTasks.map((task) => {
                  const isToday = moment(task.due_date).isSame(moment(), 'day');
                  const isOverdue = moment(task.due_date).isBefore(moment(), 'day');

                  return (
                    <div key={task.id} className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 group hover:border-red-200 transition-colors">
                                          <div className="flex justify-between items-start mb-1">
                                              <h4 className="font-medium text-sm line-clamp-1">{task.title}</h4>
                                              {isOverdue ?
                        <Badge variant="destructive" className="text-[10px] h-5 px-1.5">באיחור</Badge> :
                        isToday ?
                        <Badge className="bg-orange-500 text-[10px] h-5 px-1.5">היום</Badge> :

                        <span className="text-xs text-neutral-500">{moment(task.due_date).format('DD/MM')}</span>
                        }
                                          </div>
                                          <p className="text-xs text-neutral-600 line-clamp-1">{task.description || "ללא תיאור"}</p>
                                          <div className="mt-2 flex items-center gap-2 text-[10px] text-neutral-500">
                                              {task.priority && <Badge variant="outline" className="text-[10px] py-0 h-4">{task.priority}</Badge>}
                                          </div>
                                      </div>);

                })}
                          </div>
              }
                  </CardContent>
                  <div className="p-4 border-t border-neutral-100 dark:border-neutral-300">
                      <Button variant="ghost" className="w-full text-neutral-600 text-xs h-8" onClick={() => window.location.href = '/tasks'}>
                          כל המשימות
                      </Button>
                  </div>
              </Card>

              {/* Pipeline Summary Mini-Card */}
              <Card className="bg-red-900 text-white border-none rounded-2xl p-6 relative overflow-hidden">
                  <div className="relative z-10">
                      <div className="text-slate-50 mb-1 text-sm">הזדמנויות פתוחות</div>
                      <div className="text-3xl font-bold mb-4">{stats.totalOpps - stats.wonOppsCount}</div>
                      <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-xs opacity-80">
                              <span>התחלה</span>
                              <span>סגירה</span>
                          </div>
                          <div className="w-full bg-red-950 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-red-500 h-full rounded-full" style={{ width: `${stats.wonOppsCount / (stats.totalOpps || 1) * 100}%` }}></div>
                          </div>
                          <div className="text-right text-xs text-white/80 mt-1">
                              {(stats.wonOppsCount / (stats.totalOpps || 1) * 100).toFixed(0)}% הצלחה
                          </div>
                      </div>
                  </div>
                  {/* Decoration */}
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-red-600/20 blur-3xl rounded-full pointer-events-none"></div>
              </Card>
          </div>
      </div>
    </div>);

}

function KpiCard({ title, value, subtext, icon: Icon, color, total }) {
  return (
    <div className="bg-white dark:bg-neutral-200 p-5 md:p-6 rounded-3xl shadow-sm border border-neutral-100 dark:border-neutral-300 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600 dark:bg-opacity-20`}>
                        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                    </div>
                    {total && <span className="text-xs font-bold text-neutral-500 dark:text-neutral-600 bg-neutral-50 dark:bg-red-950 px-2 py-1 rounded-full">{total} סה״כ</span>}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-neutral-800 dark:text-neutral-800 mb-1">{value}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-700 font-medium">{title}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-600 mt-2">{subtext}</p>
            </div>
        </div>);

}