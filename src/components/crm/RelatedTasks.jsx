import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, Clock, Plus, Trash2, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import moment from "moment";

export default function RelatedTasks({ leadId, opportunityId }) {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const queryKey = leadId ? ['tasks', 'lead', leadId] : ['tasks', 'opportunity', opportunityId];

  const { data: tasks = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const filter = {};
      if (leadId) filter.related_lead_id = leadId;
      if (opportunityId) filter.related_opportunity_id = opportunityId;
      return base44.entities.Task.filter(filter);
    },
    enabled: !!(leadId || opportunityId)
  });

  const createTask = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.Task.create({
        ...data,
        assigned_to: user?.email,
        related_lead_id: leadId,
        related_opportunity_id: opportunityId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(queryKey);
      queryClient.invalidateQueries(['tasks']); // Main tasks list
      setShowForm(false);
    }
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(queryKey);
      queryClient.invalidateQueries(['tasks']);
    }
  });

  const deleteTask = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(queryKey);
      queryClient.invalidateQueries(['tasks']);
    }
  });

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-slate-800">משימות קשורות</h3>
        <Button size="sm" onClick={() => setShowForm(true)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200">
          <Plus className="w-4 h-4 ml-1" />
          משימה חדשה
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {isLoading ? (
          <div className="text-center py-4 text-slate-400">טוען...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-8 text-slate-400 border border-dashed rounded-lg">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">אין משימות מקושרות</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow flex items-start gap-3 group">
              <button
                onClick={() => updateTask.mutate({ 
                  id: task.id, 
                  data: { status: task.status === 'done' ? 'todo' : 'done' } 
                })}
                className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${
                  task.status === 'done' 
                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                    : 'border-slate-300 hover:border-emerald-500 text-transparent'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
              
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                  {task.title}
                </div>
                {task.description && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{task.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                    {task.due_date && (
                        <span className={`text-[10px] flex items-center gap-1 ${
                            moment(task.due_date).isBefore(moment(), 'day') && task.status !== 'done' ? 'text-red-500 font-bold' : 'text-slate-400'
                        }`}>
                            <Calendar className="w-3 h-3" />
                            {moment(task.due_date).format('DD/MM/YY')}
                        </span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        task.status === 'done' ? 'bg-emerald-50 text-emerald-600' :
                        task.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                        'bg-slate-100 text-slate-500'
                    }`}>
                        {task.status === 'done' ? 'הושלם' : task.status === 'in_progress' ? 'בתהליך' : 'לביצוע'}
                    </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => {
                  if(confirm('למחוק משימה זו?')) deleteTask.mutate(task.id)
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent dir="rtl">
            <DialogHeader>
                <DialogTitle>משימה חדשה ל{leadId ? 'ליד' : 'הזדמנות'}</DialogTitle>
            </DialogHeader>
            <SimpleTaskForm 
                onSubmit={(data) => createTask.mutate(data)} 
                onCancel={() => setShowForm(false)} 
            />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SimpleTaskForm({ onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        due_date: "",
        status: "todo"
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title) return alert("חובה למלא כותרת");
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
                <label className="text-sm font-medium">כותרת</label>
                <Input 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    placeholder="מה צריך לבצע?"
                />
            </div>
            <div className="space-y-1">
                <label className="text-sm font-medium">תיאור</label>
                <Textarea 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="פרטים נוספים..."
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium">תאריך יעד</label>
                    <Input 
                        type="date" 
                        value={formData.due_date} 
                        onChange={e => setFormData({...formData, due_date: e.target.value})} 
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">סטטוס</label>
                    <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todo">לביצוע</SelectItem>
                            <SelectItem value="in_progress">בתהליך</SelectItem>
                            <SelectItem value="done">הושלם</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>ביטול</Button>
                <Button type="submit">צור משימה</Button>
            </div>
        </form>
    );
}