import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  FileCheck,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Voicemail,
  User } from
"lucide-react";

export default function ActivityLog({ leadId, opportunityId }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: "Call",
    status: "Completed",
    summary: "",
    date: new Date().toISOString().slice(0, 16) // Format for datetime-local
  });

  const queryClient = useQueryClient();

  // Fetch Activities
  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities', leadId],
    queryFn: () => base44.entities.Activity.filter({ lead_id: leadId }),
    enabled: !!leadId
  });

  // Fetch all users for display names
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const getUserDisplayName = (email) => {
    if (!email) return "לא ידוע";
    const user = users?.find(u => u.email === email);
    return user?.full_name || email;
  };

  // Create Activity Mutation
  const createActivity = useMutation({
    mutationFn: (data) => base44.entities.Activity.create({
      ...data,
      lead_id: leadId,
      opportunity_id: opportunityId,
      date: new Date(data.date).toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['activities', leadId]);
      setIsAdding(false);
      setNewActivity({
        type: "Call",
        status: "Completed",
        summary: "",
        date: new Date().toISOString().slice(0, 16)
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createActivity.mutate(newActivity);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'Call':return <Phone className="w-4 h-4" />;
      case 'Email':return <Mail className="w-4 h-4" />;
      case 'SMS':return <MessageSquare className="w-4 h-4" />;
      case 'Meeting':return <Calendar className="w-4 h-4" />;
      case 'Document Collection':return <FileCheck className="w-4 h-4" />;
      default:return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':return 'text-green-600 bg-green-50 border-green-200';
      case 'Scheduled':return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'No Answer':return 'text-red-600 bg-red-50 border-red-200';
      case 'Left Message':return 'text-orange-600 bg-orange-50 border-orange-200';
      default:return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Completed':return 'הושלם';
      case 'Scheduled':return 'מתוכנן';
      case 'No Answer':return 'אין מענה';
      case 'Left Message':return 'הושארה הודעה';
      default:return status;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'Call':return 'שיחה טלפונית';
      case 'Email':return 'דואר אלקטרוני';
      case 'SMS':return 'הודעת SMS';
      case 'Meeting':return 'פגישה';
      case 'Document Collection':return 'איסוף מסמכים';
      default:return 'הערה כללית';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-slate-800">תיעוד אינטראקציות</h3>
        <Button
          size="sm"
          variant={isAdding ? "secondary" : "default"}
          onClick={() => setIsAdding(!isAdding)}>

          {isAdding ? "ביטול" : <><Plus className="w-4 h-4 mr-2" /> פעילות חדשה</>}
        </Button>
      </div>

      {isAdding &&
      <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 space-y-4 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-slate-900 text-sm font-medium">סוג פעילות</label>
              <Select
              value={newActivity.type}
              onValueChange={(val) => setNewActivity({ ...newActivity, type: val })}>

                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Call">📞 שיחה טלפונית</SelectItem>
                  <SelectItem value="Email">📧 אימייל</SelectItem>
                  <SelectItem value="SMS">💬 הודעת SMS</SelectItem>
                  <SelectItem value="Meeting">📅 פגישה</SelectItem>
                  <SelectItem value="Document Collection">📁 איסוף מסמכים</SelectItem>
                  <SelectItem value="Note">📝 הערה כללית</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-slate-800 text-sm font-medium">תוצאה / סטטוס</label>
              <Select
              value={newActivity.status}
              onValueChange={(val) => setNewActivity({ ...newActivity, status: val })}>

                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Completed">✅ הושלם בהצלחה</SelectItem>
                  <SelectItem value="Scheduled">🕒 מתוכנן לעתיד</SelectItem>
                  <SelectItem value="No Answer">❌ אין מענה</SelectItem>
                  <SelectItem value="Left Message">📢 הושארה הודעה</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-slate-800 text-sm font-medium">תאריך ושעה</label>
            <Input
            type="datetime-local"
            value={newActivity.date}
            onChange={(e) => setNewActivity({ ...newActivity, date: e.target.value })} />

          </div>

          <div className="space-y-2">
            <label className="text-slate-800 text-sm font-medium">סיכום / תוכן</label>
            <Textarea
            placeholder="כתוב כאן סיכום של השיחה או הפעילות..."
            value={newActivity.summary}
            onChange={(e) => setNewActivity({ ...newActivity, summary: e.target.value })}
            className="h-20" />

          </div>

          <div className="text-slate-800 flex justify-end">
            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
              שמור פעילות
            </Button>
          </div>
        </form>
      }

      <ScrollArea className="flex-1 pr-4 -mr-4">
        <div className="space-y-4 pb-4">
          {isLoading ?
          <p className="text-center text-slate-500 py-4">טוען היסטוריה...</p> :
          activities?.length === 0 ?
          <div className="text-center py-8 text-slate-400 border-2 border-dashed rounded-lg">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>אין פעילויות מתועדות עדיין</p>
            </div> :

          activities?.sort((a, b) => new Date(b.date) - new Date(a.date)).map((activity) =>
          <div key={activity.id} className="flex gap-3 p-3 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                <div className={`p-2 rounded-full h-fit ${
            activity.type === 'Call' ? 'bg-blue-100 text-blue-600' :
            activity.type === 'Meeting' ? 'bg-purple-100 text-purple-600' :
            'bg-slate-100 text-slate-600'}`
            }>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm">{getTypeLabel(activity.type)}</p>
                    <span className="text-xs text-slate-400">
                      {format(new Date(activity.date), 'dd/MM/yy HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{activity.summary}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(activity.status)}`}>
                      {getStatusLabel(activity.status)}
                    </span>
                    {activity.created_by && (
                      <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200 text-slate-600 font-normal flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {getUserDisplayName(activity.created_by)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
          )
          }
        </div>
      </ScrollArea>
    </div>);

}