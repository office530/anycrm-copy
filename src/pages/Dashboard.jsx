import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Calendar,
  Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import moment from 'moment';

export default function Dashboard() {
  // Fetch Data
  const { data: leads = [], isLoading: isLoadingLeads } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list(),
  });

  const { data: opportunities = [], isLoading: isLoadingOpps } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list(),
  });

  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list({ sort: { date: -1 }, limit: 5 }),
  });

  // Calculate Metrics
  const metrics = useMemo(() => {
    const today = moment().startOf('day');
    
    const newLeadsToday = leads.filter(l => moment(l.created_date).isSame(today, 'day')).length;
    
    const activePipelineValue = opportunities
      .filter(o => !['Closed Lost', 'Closed Won'].includes(o.deal_stage))
      .reduce((sum, o) => sum + (o.loan_amount_requested || 0), 0);

    // Data for Charts
    
    // 1. Leads by Status (Pie)
    const statusCounts = leads.reduce((acc, lead) => {
      acc[lead.lead_status] = (acc[lead.lead_status] || 0) + 1;
      return acc;
    }, {});
    const leadsByStatusData = Object.keys(statusCounts).map(status => ({
      name: status,
      value: statusCounts[status]
    }));

    // 2. Opportunities by Stage (Bar)
    const stageCounts = opportunities.reduce((acc, opp) => {
      acc[opp.deal_stage] = (acc[opp.deal_stage] || 0) + 1;
      return acc;
    }, {});
    const oppsByStageData = Object.keys(stageCounts).map(stage => ({
      name: stage.split('(')[0].trim(), // Shorten name for chart
      count: stageCounts[stage]
    }));

    // 3. New Leads Trend - Last 7 Days (Line)
    const last7Days = Array.from({ length: 7 }, (_, i) => moment().subtract(6 - i, 'days').format('YYYY-MM-DD'));
    const leadsTrendData = last7Days.map(date => ({
      date: moment(date).format('DD/MM'),
      leads: leads.filter(l => moment(l.created_date).format('YYYY-MM-DD') === date).length
    }));

    return {
      totalLeads: leads.length,
      newLeadsToday,
      activePipelineValue,
      leadsByStatusData,
      oppsByStageData,
      leadsTrendData
    };
  }, [leads, opportunities]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(value);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  if (isLoadingLeads || isLoadingOpps || isLoadingActivities) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">לוח בקרה</h1>
        <p className="text-slate-500">סקירה כללית של הפעילות העסקית</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="סך הכל לידים" 
          value={metrics.totalLeads} 
          icon={Users} 
          description="כל הלידים במערכת"
          color="text-blue-600"
          bg="bg-blue-100"
        />
        <StatsCard 
          title="לידים חדשים היום" 
          value={metrics.newLeadsToday} 
          icon={Calendar} 
          description="נוספו ב-24 שעות האחרונות"
          color="text-emerald-600"
          bg="bg-emerald-100"
        />
        <StatsCard 
          title="שווי צנרת פעיל" 
          value={formatCurrency(metrics.activePipelineValue)} 
          icon={DollarSign} 
          description="הזדמנויות פתוחות (סכום מבוקש)"
          color="text-violet-600"
          bg="bg-violet-100"
        />
        <StatsCard 
          title="הזדמנויות פתוחות" 
          value={opportunities.length} 
          icon={Briefcase} 
          description="סך כל העסקאות בתהליך"
          color="text-orange-600"
          bg="bg-orange-100"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Leads Trend */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              מגמת לידים חדשים (7 ימים אחרונים)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.leadsTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="leads" 
                  name="לידים"
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leads by Status */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              <Users className="w-5 h-5" />
              התפלגות לידים לפי סטטוס
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics.leadsByStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {metrics.leadsByStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Opportunities by Stage */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              הזדמנויות לפי שלב
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.oppsByStageData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="count" name="כמות" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              פעילות אחרונה
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-slate-400 text-center py-8">אין פעילות מתועדת</p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className={`mt-1 p-1.5 rounded-full ${
                      activity.type === 'Call' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'Meeting' ? 'bg-purple-100 text-purple-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      <Activity className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{activity.summary || activity.type}</p>
                      <p className="text-xs text-slate-500">
                        {moment(activity.date).format('DD/MM HH:mm')} • {activity.status}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, description, color, bg }) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
            {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
          </div>
          <div className={`p-3 rounded-full ${bg} ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-6" dir="rtl">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-[350px] w-full rounded-xl" />
        <Skeleton className="h-[350px] w-full rounded-xl" />
      </div>
    </div>
  );
}