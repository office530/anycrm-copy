import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Users, TrendingUp, DollarSign, Activity, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import moment from 'moment';

export default function Dashboard() {
  const { data: leads = [], isLoading } = useQuery({ queryKey: ['leads'], queryFn: () => base44.entities.Lead.list() });
  const { data: opportunities = [] } = useQuery({ queryKey: ['opportunities'], queryFn: () => base44.entities.Opportunity.list() });

  const metrics = useMemo(() => {
    const today = moment().startOf('day');
    const newLeadsToday = leads.filter(l => moment(l.created_date).isSame(today, 'day')).length;
    const activePipelineValue = opportunities.reduce((sum, o) => sum + (o.loan_amount_requested || 0), 0);
    
    // נתונים לגרף מגמה
    const trendData = Array.from({ length: 7 }, (_, i) => {
        const d = moment().subtract(6 - i, 'days');
        return {
            date: d.format('DD/MM'),
            value: leads.filter(l => moment(l.created_date).format('YYYY-MM-DD') === d.format('YYYY-MM-DD')).length
        };
    });

    return { totalLeads: leads.length, newLeadsToday, activePipelineValue, trendData };
  }, [leads, opportunities]);

  if (isLoading) return <div className="p-8"><Skeleton className="h-96 w-full rounded-3xl" /></div>;

  return (
    <div className="space-y-8 pb-10">
      {/* כותרת */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">סקירה כללית</h1>
        <p className="text-slate-500 dark:text-slate-400">ברוך הבא, הנה מה שקורה בעסק היום.</p>
      </div>

      {/* כרטיסי KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard 
            title="לידים חדשים היום" 
            value={metrics.newLeadsToday} 
            total={metrics.totalLeads}
            label="סה״כ במערכת"
            icon={Users} 
            color="bg-blue-500" 
        />
        <KpiCard 
            title="שווי צנרת פעיל" 
            value={`₪${metrics.activePipelineValue.toLocaleString()}`} 
            label="הזדמנויות פתוחות"
            icon={DollarSign} 
            color="bg-teal-500" 
        />
        <KpiCard 
            title="יחס המרה (משוער)" 
            value="12%" 
            label="עליה של 2% מהחודש שעבר"
            icon={TrendingUp} 
            color="bg-purple-500" 
        />
      </div>

      {/* גרפים ראשיים */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* גרף מגמת לידים */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900 dark:border dark:border-slate-800">
            <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 pb-4">
                <CardTitle className="text-lg text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-slate-400" /> מגמת לידים חדשים
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-white dark:bg-slate-900">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metrics.trendData}>
                            <defs>
                                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <RechartsTooltip 
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        {/* גרף פאי פשוט */}
        <Card className="border-none shadow-sm rounded-3xl bg-slate-900 text-white overflow-hidden relative">
             {/* רקע דקורטיבי */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -ml-10 -mb-10"></div>
            
            <CardHeader>
                <CardTitle className="text-lg font-medium text-slate-100">התפלגות מקורות</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px]">
                <div className="text-center space-y-2 relative z-10">
                    <div className="text-4xl font-bold text-teal-400">75%</div>
                    <div className="text-sm text-slate-400">מהלידים מגיעים<br/>מקמפיין פייסבוק</div>
                    <Button variant="outline" className="mt-4 border-slate-700 hover:bg-slate-800 text-white hover:text-white rounded-full text-xs h-8">
                        צפה בדוח מלא <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ title, value, label, icon: Icon, color, total }) {
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600 dark:bg-opacity-20`}>
                        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                    </div>
                    {total && <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">{total} סה״כ</span>}
                </div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1">{value}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{label}</p>
            </div>
        </div>
    );
}