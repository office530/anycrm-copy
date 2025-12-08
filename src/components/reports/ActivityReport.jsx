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
        'Call': 'Calls',
        'Meeting': 'Meetings',
        'Email': 'Emails',
        'Note': 'Notes',
        'SMS': 'SMS',
        'Document Collection': 'Documents'
    };

    activities.forEach(a => {
        const type = typeMapping[a.type] || 'Other';
        counts[type] = (counts[type] || 0) + 1;
    });
    
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [activities]);

  const getActivitiesByType = (typeName) => {
      const typeMappingReverse = {
        'Calls': 'Call',
        'Meetings': 'Meeting',
        'Emails': 'Email',
        'Notes': 'Note',
        'SMS': 'SMS',
        'Documents': 'Document Collection'
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
      return l ? l.full_name : 'Unknown';
  };

  const taskStatusData = [
    { name: 'Completed', value: stats.completedTasks },
    { name: 'Open', value: stats.pendingTasks },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls Made</CardTitle>
            <Phone className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.calls}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meetings Held</CardTitle>
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
            <CardTitle>Activity Type Distribution</CardTitle>
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
                <Bar dataKey="value" fill="#ef4444" name="Count" cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2">
                    {sortedActivities.slice(0, 5).map((act, i) => {
                        const leadName = getLeadName(act.lead_id);
                        return (
                            <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0 hover:bg-slate-50 p-1 rounded-lg transition-colors">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-bold text-sm text-slate-800">
                                            {act.type === 'Call' ? '📞 Call' : act.type === 'Meeting' ? '📅 Meeting' : '📝 Activity'}
                                        </p>
                                        <span className="text-xs text-slate-400">•</span>
                                        <a 
                                            href={`/LeadDetails?id=${act.lead_id}`}
                                            className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                        >
                                            {leadName}
                                        </a>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate w-40 md:w-56" title={act.summary}>{act.summary}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-medium text-slate-600">
                                        {act.date ? new Date(act.date).toLocaleDateString('en-US') : '-'}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                        {act.date ? new Date(act.date).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'}) : ''}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {activities.length === 0 && <p className="text-center text-slate-500 py-4">No activities to show</p>}
                </div>
            </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedType} onOpenChange={(open) => !open && setSelectedType(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>Activity Details: {selectedType}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-left">Date</TableHead>
                            <TableHead className="text-left">Client</TableHead>
                            <TableHead className="text-left">Performed By</TableHead>
                            <TableHead className="text-left">Details</TableHead>
                            <TableHead className="text-left">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {selectedType && getActivitiesByType(selectedType).map((act) => (
                            <TableRow key={act.id}>
                                <TableCell>{new Date(act.date).toLocaleDateString('en-US')} {new Date(act.date).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</TableCell>
                                <TableCell className="font-medium">{getLeadName(act.lead_id)}</TableCell>
                                <TableCell>{getUserName(act.created_by)}</TableCell>
                                <TableCell className="max-w-xs truncate" title={act.summary}>{act.summary}</TableCell>
                                <TableCell>{act.status}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </div>
            </div>
            <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setSelectedType(null)}>Close</Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}