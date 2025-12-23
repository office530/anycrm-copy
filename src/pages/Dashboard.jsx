import React from 'react';
import { useSettings } from '@/components/context/SettingsContext';
import { KpiCardOps, AiInsightsWidget } from '@/components/dashboard/OperationalWidgets';
import { SalesAreaChart } from '@/components/dashboard/SalesAreaChart';
import { HotLeadsTable } from '@/components/dashboard/HotLeadsTable';
import { ActionCenter } from '@/components/dashboard/ActionCenter';
import { Users, DollarSign, Activity, TrendingUp } from 'lucide-react';

/**
 * MOCK DATA
 * Robust data set to ensure immediate, beautiful rendering.
 */
const MOCK_DATA = {
  user: {
    firstName: "Alex",
    highRiskLeads: 3
  },
  kpiStats: [
    {
      title: "Total Revenue",
      value: "$124,500",
      icon: DollarSign,
      trend: "up",
      trendValue: "12%",
      trendLabel: "vs last month"
    },
    {
      title: "Active Leads",
      value: "45",
      icon: Users,
      trend: "up",
      trendValue: "8%",
      trendLabel: "vs last week"
    },
    {
      title: "Win Rate",
      value: "24%",
      icon: Activity,
      trend: "down",
      trendValue: "2%",
      trendLabel: "vs target"
    },
    {
      title: "Avg. Deal Size",
      value: "$12,450",
      icon: TrendingUp,
      trend: "up",
      trendValue: "5%",
      trendLabel: "vs last quarter"
    }
  ],
  salesTrend: [
    { name: 'Jan', revenue: 4000, leads: 24 },
    { name: 'Feb', revenue: 3000, leads: 18 },
    { name: 'Mar', revenue: 5000, leads: 35 },
    { name: 'Apr', revenue: 4500, leads: 28 },
    { name: 'May', revenue: 6000, leads: 42 },
    { name: 'Jun', revenue: 7500, leads: 48 },
    { name: 'Jul', revenue: 8000, leads: 52 },
  ],
  insights: [
    "Lead 'Acme Corp' viewed pricing page 5 times today.",
    "3 high-value opportunities have stalled in 'Proposal' stage > 7 days.",
    "Competitor mentioned in recent call with 'Global Tech'."
  ],
  hotLeads: [
    { id: 1, name: "Sarah Connor", email: "sarah@skynet.com", status: "Negotiation", score: 85 },
    { id: 2, name: "John Wick", email: "j.wick@continental.com", status: "New", score: 45 },
    { id: 3, name: "Bruce Wayne", email: "bruce@wayneent.com", status: "Won", score: 100 },
    { id: 4, name: "Tony Stark", email: "tony@stark.com", status: "Proposal", score: 75 },
    { id: 5, name: "Peter Parker", email: "peter@dailybugle.com", status: "Qualifying", score: 60 },
  ],
  tasks: [
    { id: 1, time: "09:00 AM", title: "Team Sync", subtitle: "Weekly pipeline review", priority: "Medium" },
    { id: 2, time: "10:30 AM", title: "Call Sarah Connor", subtitle: "Discuss contract terms", priority: "High" },
    { id: 3, time: "02:00 PM", title: "Demo with Acme", subtitle: "Product walkthrough", priority: "High" },
    { id: 4, time: "04:30 PM", title: "Email Follow-up", subtitle: "Send proposal to Stark Ind", priority: "Medium" },
    { id: 5, time: "05:00 PM", title: "Update CRM", subtitle: "Log daily activities", priority: "Low" },
  ]
};

export default function Dashboard() {
  const { branding } = useSettings(); // Keep using context for consistency if needed, though we use mock data primarily.

  return (
    <div className="space-y-6 p-4 md:p-8 pt-6 max-w-[1600px] mx-auto">
      
      {/* HEADER: AI Daily Brief */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Good Morning, {MOCK_DATA.user.firstName}
          </h2>
          <p className="text-muted-foreground mt-1">
            You have <span className="font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 px-1 rounded">{MOCK_DATA.user.highRiskLeads} high-risk leads</span> to call today.
          </p>
        </div>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* ROW 1: KPI CARDS */}
        {MOCK_DATA.kpiStats.map((kpi, index) => (
          <div key={index} className="col-span-1 md:col-span-6 lg:col-span-3">
            <KpiCardOps {...kpi} />
          </div>
        ))}

        {/* ROW 2: MAIN CHART & AI INSIGHTS */}
        <div className="col-span-1 md:col-span-12 lg:col-span-8 h-[400px]">
          <SalesAreaChart data={MOCK_DATA.salesTrend} />
        </div>
        <div className="col-span-1 md:col-span-12 lg:col-span-4 h-[400px]">
          <AiInsightsWidget insights={MOCK_DATA.insights} />
        </div>

        {/* ROW 3: HOT LEADS & ACTION CENTER */}
        <div className="col-span-1 md:col-span-12 lg:col-span-8 h-[400px]">
          <HotLeadsTable leads={MOCK_DATA.hotLeads} />
        </div>
        <div className="col-span-1 md:col-span-12 lg:col-span-4 h-[400px]">
          <ActionCenter tasks={MOCK_DATA.tasks} />
        </div>

      </div>
    </div>
  );
}