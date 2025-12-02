import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  DollarSign,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  // Fetch summary data
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

  const stats = React.useMemo(() => {
    if (leadsLoading || oppsLoading) return null;

    const totalLeads = leads.length;
    const newLeads = leads.filter(l => l.lead_status === 'New').length;
    const activeOpps = opportunities.filter(o => 
      !o.deal_stage.includes('Closed')
    ).length;
    
    const pipelineValue = opportunities.reduce((sum, opp) => {
      if (!opp.deal_stage.includes('Closed')) {
        return sum + (opp.loan_amount_requested || 0);
      }
      return sum;
    }, 0);

    const conversionRate = totalLeads ? ((opportunities.length / totalLeads) * 100).toFixed(1) : 0;

    return {
      totalLeads,
      newLeads,
      activeOpps,
      pipelineValue,
      conversionRate
    };
  }, [leads, opportunities, leadsLoading, oppsLoading]);

  const recentActivities = leads
    .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
    .slice(0, 5);

  if (leadsLoading || oppsLoading) {
    return <div className="p-8 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="שווי צנרת עסקאות" 
          value={`₪${stats.pipelineValue.toLocaleString()}`} 
          icon={DollarSign}
          trend="+12% מהחודש שעבר"
          color="bg-emerald-500"
        />
        <StatsCard 
          title="הזדמנויות פעילות" 
          value={stats.activeOpps} 
          icon={TrendingUp}
          trend="5 צפויות להיסגר החודש"
          color="bg-blue-500"
        />
        <StatsCard 
          title="לידים חדשים" 
          value={stats.newLeads} 
          icon={Users}
          trend={`${stats.conversionRate}% אחוז המרה`}
          color="bg-orange-500"
        />
        <StatsCard 
          title="דרוש מעקב (Follow-up)" 
          value={leads.filter(l => l.lead_status.includes('Attempt')).length} 
          icon={Clock}
          trend="לטיפול היום"
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>פעילות לידים אחרונה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      lead.original_status_color === 'Green' ? 'bg-green-500' :
                      lead.original_status_color === 'Red' ? 'bg-red-500' :
                      lead.original_status_color === 'Orange' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}>
                      {lead.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{lead.full_name}</p>
                      <p className="text-sm text-slate-500">{lead.city} • {lead.phone_number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {lead.lead_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>שלבי העסקאות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                "Discovery Call (שיחת בירור צרכים)",
                "Meeting Scheduled (נקבעת פגישה)",
                "Documents Collection (איסוף מסמכים)",
                "Request Sent to Harel (בקשה נשלחה להראל)"
                ].map(stage => {
                const count = opportunities.filter(o => o.deal_stage === stage).length;
                const total = opportunities.length || 1; 
                const percentage = Math.round((count / total) * 100);
                
                // Get Hebrew part for display
                const displayStage = stage.split('(')[1]?.replace(')', '') || stage;
                
                return (
                  <div key={stage} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700 font-medium truncate max-w-[70%]">{displayStage}</span>
                      <span className="text-slate-500">{count} עסקאות</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, trend, color }) {
  return (
    <Card className="overflow-hidden">
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
          <div className="mt-4 flex items-center text-sm text-slate-600">
            <span className="font-medium">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}