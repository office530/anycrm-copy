import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, TrendingUp, Users, CheckCircle2, Calendar } from "lucide-react";
import SalesPerformance from '@/components/reports/SalesPerformance';
import ConversionReport from '@/components/reports/ConversionReport';
import ActivityReport from '@/components/reports/ActivityReport';

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

  const isLoading = leadsLoading || oppsLoading || tasksLoading || activitiesLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">דוחות וניתוח נתונים</h1>
          <p className="text-slate-500">סקירה מקיפה של ביצועים, המרות ופעילות</p>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
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

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
          <TabsTrigger value="sales">ביצועי מכירות</TabsTrigger>
          <TabsTrigger value="conversion">יחסי המרה</TabsTrigger>
          <TabsTrigger value="activity">דוח פעילות</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-6">
          <SalesPerformance leads={leads} opportunities={opportunities} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="conversion" className="mt-6">
          <ConversionReport leads={leads} opportunities={opportunities} timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ActivityReport tasks={tasks} activities={activities} timeRange={timeRange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}