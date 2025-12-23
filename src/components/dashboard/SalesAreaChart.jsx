import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useSettings } from '@/components/context/SettingsContext';

export function SalesAreaChart({ data }) {
  const { theme } = useSettings();
  const isDark = theme === 'dark';

  return (
    <Card className="h-full col-span-2">
      <CardHeader>
        <CardTitle>Revenue & Leads Trend</CardTitle>
      </CardHeader>
      <CardContent className="pl-0">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `$${value}`} 
              />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#333" : "#eee"} />
              <Tooltip 
                contentStyle={{ 
                    backgroundColor: isDark ? '#1e293b' : '#fff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8b5cf6" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="leads" 
                stroke="#06b6d4" 
                fillOpacity={1} 
                fill="url(#colorLeads)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}