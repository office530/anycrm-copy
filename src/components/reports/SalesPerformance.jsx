import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, Trophy, Target, TrendingUp } from "lucide-react";

const COLORS = ['#ef4444', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function SalesPerformance({ leads, opportunities, timeRange }) {
  
  const stats = useMemo(() => {
    const closedWon = opportunities.filter(o => o.deal_stage?.includes("Won") || o.deal_stage?.includes("בהצלחה"));
    const totalRevenue = closedWon.reduce((sum, o) => sum + (o.loan_amount_requested || 0), 0);
    const avgDealSize = closedWon.length > 0 ? totalRevenue / closedWon.length : 0;
    
    const pipelineValue = opportunities
      .filter(o => !o.deal_stage?.includes("Won") && !o.deal_stage?.includes("בהצלחה") && !o.deal_stage?.includes("Lost") && !o.deal_stage?.includes("אבוד"))
      .reduce((sum, o) => sum + (o.loan_amount_requested || 0), 0);

    return {
      totalRevenue,
      closedCount: closedWon.length,
      avgDealSize,
      pipelineValue
    };
  }, [opportunities, timeRange]);

  const productData = useMemo(() => {
    const counts = {};
    opportunities.forEach(o => {
      const prod = o.product_type || "Other";
      counts[prod] = (counts[prod] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [opportunities]);

  const stageData = useMemo(() => {
    const counts = {};
    opportunities.forEach(o => {
      // Simplify stage name for chart
      const stageName = o.deal_stage?.split('(')[0]?.trim() || "Unknown";
      counts[stageName] = (counts[stageName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [opportunities]);

  const formatCurrency = (val) => `₪${(val || 0).toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הכנסות שנסגרו</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-green-600 truncate" title={formatCurrency(stats.totalRevenue)}>{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-neutral-500">סה"כ עסקאות שנסגרו בהצלחה</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">עסקאות שנסגרו</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.closedCount}</div>
            <p className="text-xs text-neutral-500">מספר עסקאות בסטטוס זכייה</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">שווי עסקה ממוצע</CardTitle>
            <Target className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold truncate">{formatCurrency(stats.avgDealSize)}</div>
            <p className="text-xs text-neutral-500">ממוצע לעסקה שנסגרה</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">שווי צנרת פתוח</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold truncate">{formatCurrency(stats.pipelineValue)}</div>
            <p className="text-xs text-neutral-500">פוטנציאל עסקאות פתוחות</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>התפלגות מוצרים</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>הזדמנויות לפי שלב</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} layout="vertical" margin={{ left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '10px' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} name="כמות" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}