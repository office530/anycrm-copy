import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Users, CheckCircle2, Calendar } from "lucide-react";
import SalesPerformance from '@/components/reports/SalesPerformance';
import OpportunityAdvancedReport from '@/components/reports/OpportunityAdvancedReport';
import OpportunitiesListReport from '@/components/reports/OpportunitiesListReport'; // Fixed import
import ConversionReport from '@/components/reports/ConversionReport';
import ActivityReport from '@/components/reports/ActivityReport';
import CustomReports from '@/components/reports/CustomReports';
import CustomDashboard from '@/components/reports/CustomDashboard';
import AiInsights from '@/components/reports/AiInsights';
import { BrainCircuit } from "lucide-react";

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState('all');

  // Fetch all necessary data
  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list(),
    initialData: []
  });

  const { data: opportunities, isLoading: oppsLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => base44.entities.Opportunity.list(),
    initialData: []
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
    initialData: []
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list(),
    initialData: []
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: []
  });

  const isLoading = leadsLoading || oppsLoading || tasksLoading || activitiesLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>;
  }

  return (
    <div className="space-y-8" dir="rtl">
      <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">דוחות וניתוח נתונים</h1>
          <p className="text-neutral-500 mt-1">סקירה מקיפה של ביצועים, המרות ופעילות עסקית</p>
        </div>
        
        <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-neutral-600 hidden md:inline-block">טווח תצוגה:</span>
            <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] bg-white border-neutral-200">
                <SelectValue placeholder="טווח זמן" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">כל הזמנים</SelectItem>
                <SelectItem value="this_month">החודש הנוכחי</SelectItem>
                <SelectItem value="last_month">חודש שעבר</SelectItem>
                <SelectItem value="this_year">השנה הנוכחית</SelectItem>
            </SelectContent>
            </Select>
        </div>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="flex flex-wrap lg:flex-nowrap justify-start w-full h-auto p-1 gap-1 bg-neutral-100/50 rounded-xl mb-6 overflow-x-auto">
          <TabsTrigger value="list" className="flex-1 min-w-[120px] rounded-lg data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all py-2.5">דוח מפורט</TabsTrigger>
          <TabsTrigger value="advanced" className="flex-1 min-w-[120px] rounded-lg data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all py-2.5">דשבורד הזדמנויות</TabsTrigger>
          <TabsTrigger value="sales" className="flex-1 min-w-[120px] rounded-lg data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all py-2.5">ביצועי מכירות</TabsTrigger>
          <TabsTrigger value="conversion" className="flex-1 min-w-[120px] rounded-lg data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all py-2.5">יחסי המרה</TabsTrigger>
          <TabsTrigger value="activity" className="flex-1 min-w-[120px] rounded-lg data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all py-2.5">דוח פעילות</TabsTrigger>
          <TabsTrigger value="custom_reports" className="flex-1 min-w-[120px] rounded-lg data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all py-2.5">דוחות מותאמים</TabsTrigger>
          <TabsTrigger value="custom_dashboard" className="flex-1 min-w-[120px] rounded-lg data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all py-2.5">דשבורד אישי</TabsTrigger>
          <TabsTrigger value="ai_insights" className="flex-1 min-w-[120px] rounded-lg text-indigo-600 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 transition-all py-2.5">
            <BrainCircuit className="w-4 h-4 mr-2 inline-block" />
            תובנות AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <OpportunitiesListReport opportunities={opportunities} />
        </TabsContent>

        <TabsContent value="advanced" className="mt-6">
            <OpportunityAdvancedReport leads={leads} opportunities={opportunities} />
        </TabsContent>

        <TabsContent value="sales" className="mt-6">
          <SalesPerformance leads={leads} opportunities={opportunities} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="conversion" className="mt-6">
          <ConversionReport leads={leads} opportunities={opportunities} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ActivityReport tasks={tasks} activities={activities} leads={leads} users={users} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="custom_reports" className="mt-6">
          <CustomReports />
        </TabsContent>

        <TabsContent value="custom_dashboard" className="mt-6">
          <CustomDashboard />
        </TabsContent>

        <TabsContent value="ai_insights" className="mt-6">
          <AiInsights />
        </TabsContent>
      </Tabs>
    </div>
  );
}