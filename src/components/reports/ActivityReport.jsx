import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckSquare, Phone, CalendarDays, ListTodo, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default function ActivityReport({ tasks, activities, leads, users, timeRange }) {
  const [selectedType, setSelectedType] = useState(null);

  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [activities]);
  
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
    const typeMapping = {
        'Call': 'שיחות',
        'Meeting': 'פגישות',
        'Email': 'מיילים',
        'Note': 'הערות',
        'SMS': 'SMS',
        'Document Collection': 'איסוף מסמכים'
    };

    activities.forEach(a => {
        const type = typeMapping[a.type] || 'אחר';
        counts[type] = (counts[type] || 0) + 1;
    });
    
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [activities]);

  const getActivitiesByType = (typeName) => {
      const typeMappingReverse = {
        'שיחות': 'Call',
        'פגישות': 'Meeting',
        'מיילים': 'Email',
        'הערות': 'Note',
        'SMS': 'SMS',
        'איסוף מסמכים': 'Document Collection'
      };
      
      const targetType = typeMappingReverse[typeName];
      if (!targetType) return [];
      
      return sortedActivities.filter(a => a.type === targetType);
  };

  const getUserName = (email) => {
      const u = users?.find(user => user.email === email);
      return u ? u.full_name : email;
  };

  const getLeadName = (leadId) => {
      const l = leads?.find(lead => lead.id === leadId);
      return l ? l.full_name : 'לא ידוע';
  };

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
            <Phone className="h-4 w-4 text-red-500" />
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
              <BarChart data={activityTypeData} onClick={(data) => {
                  if (data && data.activePayload && data.activePayload[0]) {
                      setSelectedType(data.activePayload[0].payload.name);
                  }
              }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#ef4444" name="כמות" cursor="pointer" />
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
                    {sortedActivities.slice(0, 5).map((act, i) => (
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

      <Dialog open={!!selectedType} onOpenChange={(open) => !open && setSelectedType(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>פירוט פעילויות: {selectedType}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-right">תאריך</TableHead>
                            <TableHead className="text-right">לקוח</TableHead>
                            <TableHead className="text-right">בוצע ע"י</TableHead>
                            <TableHead className="text-right">פרטים</TableHead>
                            <TableHead className="text-right">סטטוס</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {selectedType && getActivitiesByType(selectedType).map((act) => (
                            <TableRow key={act.id}>
                                <TableCell>{new Date(act.date).toLocaleDateString('he-IL')} {new Date(act.date).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</TableCell>
                                <TableCell className="font-medium">{getLeadName(act.lead_id)}</TableCell>
                                <TableCell>{getUserName(act.created_by)}</TableCell>
                                <TableCell className="max-w-xs truncate" title={act.summary}>{act.summary}</TableCell>
                                <TableCell>{act.status}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setSelectedType(null)}>סגור</Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}