import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckSquare, Phone, CalendarDays, ListTodo } from "lucide-react";

export default function ActivityReport({ tasks, activities, timeRange }) {
  
  const stats = useMemo(() => {
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const pendingTasks = tasks.filter(t => t.status !== 'done').length;
    
    const calls = activities.filter(a => a.type === 'Call').length;
    const meetings = activities.filter(a => a.type === 'Meeting').length;
    
    return {
      completedTasks,
      pendingTasks,
      calls,
      meetings,
      totalActivities: activities.length
    };
  }, [tasks, activities]);

  const activityTypeData = useMemo(() => {
    const counts = {};
    activities.forEach(a => {
        const type = a.type === 'Call' ? 'שיחות' : 
                     a.type === 'Meeting' ? 'פגישות' : 
                     a.type === 'Email' ? 'מיילים' : 
                     a.type === 'Note' ? 'הערות' : 
                     a.type === 'SMS' ? 'SMS' : 'אחר';
        counts[type] = (counts[type] || 0) + 1;
    });
    
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [activities]);

  const taskStatusData = [
    { name: 'בוצעו', value: stats.completedTasks },
    { name: 'פתוחות', value: stats.pendingTasks },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משימות שבוצעו</CardTitle>
            <CheckSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משימות פתוחות</CardTitle>
            <ListTodo className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">שיחות שבוצעו</CardTitle>
            <Phone className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.calls}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">פגישות שהתקיימו</CardTitle>
            <CalendarDays className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.meetings}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>התפלגות סוגי פעילויות</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" name="כמות" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>פעילויות אחרונות</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2">
                    {activities.slice(0, 5).map((act, i) => (
                        <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                            <div>
                                <p className="font-medium text-sm text-slate-800">
                                    {act.type === 'Call' ? '📞 שיחה' : act.type === 'Meeting' ? '📅 פגישה' : '📝 פעילות'}
                                </p>
                                <p className="text-xs text-slate-500 truncate w-48" title={act.summary}>{act.summary}</p>
                            </div>
                            <div className="text-xs text-slate-400">
                                {act.date ? new Date(act.date).toLocaleDateString('he-IL') : '-'}
                            </div>
                        </div>
                    ))}
                    {activities.length === 0 && <p className="text-center text-slate-500 py-4">אין פעילויות להצגה</p>}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}