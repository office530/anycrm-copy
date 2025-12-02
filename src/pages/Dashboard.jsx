import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  DollarSign,
  Clock,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { format, isToday, parseISO, subDays } from 'date-fns';
import { he } from 'date-fns/locale';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Dashboard() {
  // Fetch data
  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads', 'summary'],
    queryFn: () => base44.entities.Lead.list(),
    initialData: []
  });

  const { data: opportunities, isLoading: oppsLoading } = useQuery({
    queryKey: ['opportunities', 'summary'],
    queryFn: () => base44.entities.Opportunity.list(),
    initialData: []
  });

  // Process Data for Charts & Stats
  const analytics = useMemo(() => {
    if (leadsLoading || oppsLoading) return null;

    const today = new Date();
    const newLeadsToday = leads.filter(l => l.created_date && isToday(parseISO(l.created_date))).length;
    
    // Pipeline Value
    const pipelineValue = opportunities.reduce((sum, opp) => {
      if (!opp.deal_stage.includes('Closed')) {
        return sum + (opp.loan_amount_requested || 0);
      }
      return sum;
    }, 0);

    // Leads by Status (Pie Chart)
    const leadsByStatusMap = leads.reduce((acc, lead) => {
      acc[lead.lead_status] = (acc[lead.lead_status] || 0) + 1;
      return acc;
    }, {});
    
    const leadsByStatusData = Object.entries(leadsByStatusMap).map(([name, value]) => ({
      name: name.replace(/\(.*\)/, '').trim(), // Clean Hebrew if mixed
      value
    }));

    // Opportunities by Stage (Bar Chart)
    const oppsByStageMap = opportunities.reduce((acc, opp) => {
      const stage = opp.deal_stage.split('(')[0].trim(); // Shorten name
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});

    const oppsByStageData = Object.entries(oppsByStageMap).map(([name, value]) => ({
      name,
      value
    }));

    // Leads Trend (Line Chart - Last 7 Days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(today, 6 - i);
        return format(d, 'yyyy-MM-dd');
    });

    const leadsTrendData = last7Days.map(dateStr => {
        const count = leads.filter(l => l.created_date && l.created_date.startsWith(dateStr)).length;
        return {
            date: format(parseISO(dateStr), 'dd/MM', { locale: he }),
            count
        };
    });

    return {
      totalLeads: leads.length,
      newLeadsToday,
      activeOpps: opportunities.filter(o => !o.deal_stage.includes('Closed')).length,
      pipelineValue,
      leadsByStatusData,
      oppsByStageData,
      leadsTrendData
    };
  }, [leads, opportunities, leadsLoading, oppsLoading]);

  const recentActivities = leads
    .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
    .slice(0, 5);

  if (leadsLoading || oppsLoading || !analytics) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-2" dir="rtl">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="סה״כ לידים" 
          value={analytics.totalLeads} 
          icon={Users}
          trend="מאגר הלקוחות שלך"
          color="bg-blue-500"
        />
        <StatsCard 
          title="לידים חדשים היום" 
          value={analytics.newLeadsToday} 
          icon={Activity}
          trend="הצטרפו ב-24 שעות אחרונות"
          color="bg-green-500"
        />
        <StatsCard 
          title="הזדמנויות פעילות" 
          value={analytics.activeOpps} 
          icon={Briefcase}
          trend="עסקאות בתהליך"
          color="bg-purple-500"
        />
        <StatsCard 
          title="שווי צנרת" 
          value={`₪${analytics.pipelineValue.toLocaleString()}`} 
          icon={DollarSign}
          trend="פוטנציאל הכנסות"
          color="bg-emerald-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Leads by Status - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>התפלגות לידים לפי סטטוס</CardTitle>
            <CardDescription>מצב נוכחי של כל הלידים במערכת</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.leadsByStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.leadsByStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leads Trend - Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>מגמת הצטרפות לידים</CardTitle>
            <CardDescription>7 ימים אחרונים</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.leadsTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} allowDecimals={false} />
                <Tooltip 
                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Line type="monotone" dataKey="count" name="לידים חדשים" stroke="#2563eb" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Opportunities by Stage - Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>הזדמנויות לפי שלב</CardTitle>
            <CardDescription>כמות עסקאות בכל שלב בתהליך המכירה</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.oppsByStageData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#888888" fontSize={12} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} width={150} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="value" name="כמות עסקאות" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={32}>
                    {analytics.oppsByStageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      {/* Recent Activity List */}
      <Card>
        <CardHeader>
            <CardTitle>פעילות אחרונה במערכת</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
            {recentActivities.map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                    lead.original_status_color === 'Green' ? 'bg-green-500' :
                    lead.original_status_color === 'Red' ? 'bg-red-500' :
                    lead.original_status_color === 'Orange' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}>
                    {lead.full_name.charAt(0)}
                    </div>
                    <div>
                    <Link to={`${createPageUrl('LeadDetails')}?id=${lead.id}`} className="font-medium text-slate-900 hover:text-blue-600 hover:underline">
                        {lead.full_name}
                    </Link>
                    <p className="text-sm text-slate-500">{lead.city || 'לא צוינה עיר'} • {lead.phone_number}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {lead.lead_status}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                        עודכן: {format(parseISO(lead.updated_date), 'dd/MM/yy HH:mm')}
                    </p>
                </div>
                </div>
            ))}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, trend, color }) {
  return (
    <Card className="overflow-hidden border-t-4 border-t-transparent hover:border-t-blue-500 transition-all shadow-sm hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <h3 className="text-3xl font-bold mt-2 text-slate-900">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-white shadow-sm`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
            <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
            <span className="font-medium">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}