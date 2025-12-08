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
import { useSettings } from "@/components/context/SettingsContext";

export default function ReportsPage() {
  const { theme } = useSettings();
  const [timeRange, setTimeRange] = useState('all');
  const [activeReport, setActiveReport] = useState('list');

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

  const reports = [
      { id: 'list', name: 'דוח מפורט', icon: Users },
      { id: 'advanced', name: 'דשבורד הזדמנויות', icon: TrendingUp },
      { id: 'sales', name: 'ביצועי מכירות', icon: TrendingUp },
      { id: 'conversion', name: 'יחסי המרה', icon: CheckCircle2 },
      { id: 'activity', name: 'דוח פעילות', icon: Calendar },
      { id: 'custom_reports', name: 'דוחות מותאמים', icon: Users },
      { id: 'custom_dashboard', name: 'דשבורד אישי', icon: Users },
      { id: 'ai_insights', name: 'תובנות AI', icon: BrainCircuit, color: 'text-indigo-600' }
  ];

  return (
    <div className={`min-h-screen p-6 transition-colors ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50/50'}`} dir="rtl">
      <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header */}
          <div className={`rounded-xl shadow-sm border p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors ${
              theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-neutral-100'
          }`}>
            <div>
              <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>דוחות וניתוח נתונים</h1>
              <p className={`mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-500'}`}>סקירה מקיפה של ביצועים, המרות ופעילות עסקית</p>
            </div>
            
            <div className="flex items-center gap-3">
                <span className={`text-sm font-medium hidden md:inline-block ${theme === 'dark' ? 'text-slate-300' : 'text-neutral-600'}`}>טווח תצוגה:</span>
                <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className={`w-[180px] ${
                    theme === 'dark' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-neutral-200'
                }`}>
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

          <div className="grid grid-cols-12 gap-6 items-start">
              {/* Mobile Navigation (Dropdown) */}
              <div className="col-span-12 lg:hidden mb-4">
                  <Select value={activeReport} onValueChange={setActiveReport}>
                      <SelectTrigger className="w-full bg-white border-neutral-200">
                          <SelectValue placeholder="בחר דוח להצגה" />
                      </SelectTrigger>
                      <SelectContent>
                          {reports.map((report) => (
                              <SelectItem key={report.id} value={report.id}>
                                  <div className="flex items-center gap-2">
                                      <report.icon className="w-4 h-4 text-slate-500" />
                                      {report.name}
                                  </div>
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>

              {/* Sidebar Navigation (Desktop) */}
              <div className="hidden lg:block lg:col-span-2 space-y-1">
                  {reports.map((report) => {
                      const isActive = activeReport === report.id;
                      const Icon = report.icon;
                      return (
                          <button
                              key={report.id}
                              onClick={() => setActiveReport(report.id)}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium text-right
                                  ${isActive 
                                      ? theme === 'dark'
                                          ? 'bg-slate-700 text-cyan-400 shadow-sm border border-cyan-500/30 font-bold'
                                          : 'bg-white text-red-700 shadow-sm border border-red-100 font-bold'
                                      : theme === 'dark'
                                          ? 'text-slate-400 hover:bg-slate-800 hover:text-cyan-400'
                                          : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                                  }
                              `}
                          >
                              <Icon className={`w-4 h-4 ${isActive ? (theme === 'dark' ? 'text-cyan-400' : 'text-red-600') : report.color || 'text-slate-400'}`} />
                              {report.name}
                          </button>
                      );
                  })}
              </div>

              {/* Main Content Area */}
              <div className="col-span-12 lg:col-span-10">
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {activeReport === 'list' && <OpportunitiesListReport opportunities={opportunities} />}
                      {activeReport === 'advanced' && <OpportunityAdvancedReport leads={leads} opportunities={opportunities} />}
                      {activeReport === 'sales' && <SalesPerformance leads={leads} opportunities={opportunities} timeRange={timeRange} />}
                      {activeReport === 'conversion' && <ConversionReport leads={leads} opportunities={opportunities} timeRange={timeRange} />}
                      {activeReport === 'activity' && <ActivityReport tasks={tasks} activities={activities} leads={leads} users={users} timeRange={timeRange} />}
                      {activeReport === 'custom_reports' && <CustomReports />}
                      {activeReport === 'custom_dashboard' && <CustomDashboard />}
                      {activeReport === 'ai_insights' && <AiInsights />}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}