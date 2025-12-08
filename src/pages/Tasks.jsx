import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, CheckCircle2, Clock, Calendar, Trash2, Archive, CheckSquare, Square, AlertCircle, Filter, Link as LinkIcon, Briefcase, User, X
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import moment from "moment";
import { useSettings } from "@/components/context/SettingsContext";

export default function TasksPage() {
  const { theme } = useSettings();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  const [filters, setFilters] = useState({ search: "", status: "all" });

  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list()
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads_basic'],
    queryFn: () => base44.entities.Lead.list(), // Optimized list would be better, but basic list is okay for now
    staleTime: 5 * 60 * 1000
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ['opportunities_basic'],
    queryFn: () => base44.entities.Opportunity.list(),
    staleTime: 5 * 60 * 1000
  });

  const createTask = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      setShowTaskForm(false);
      setEditingTask(null);
    }
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['tasks'])
  });

  const deleteTask = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
    }
  });

  const toggleTaskStatus = (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    updateTask.mutate({ id: task.id, data: { status: newStatus } });
  };

  const archiveTask = (task) => {
    // שימוש בשדה קיים או הוספת שדה חדש לארכיון
    updateTask.mutate({ id: task.id, data: { status: 'archived' } });
  };

  // סינון משימות
  const { activeTasks, archivedTasks } = useMemo(() => {
    const searchTerm = filters.search.toLowerCase();
    const filtered = tasks.filter((t) => {
      const matchesSearch = !searchTerm || 
        t.title?.toLowerCase().includes(searchTerm) || 
        t.description?.toLowerCase().includes(searchTerm);
      
      const matchesStatus = filters.status === "all" || t.status === filters.status;
      
      return matchesSearch && matchesStatus;
    });

    return {
      activeTasks: filtered.filter((t) => t.status !== 'archived'),
      archivedTasks: filtered.filter((t) => t.status === 'archived')
    };
  }, [tasks, filters]);

  // סטטיסטיקות
  const stats = useMemo(() => {
    const total = activeTasks.length;
    const completed = activeTasks.filter((t) => t.status === 'done').length;
    const overdue = activeTasks.filter((t) => {
      if (t.status === 'done') return false;
      return t.due_date && moment(t.due_date).isBefore(moment(), 'day');
    }).length;
    const today = activeTasks.filter((t) => {
      if (t.status === 'done') return false;
      return t.due_date && moment(t.due_date).isSame(moment(), 'day');
    }).length;

    return { total, completed, overdue, today };
  }, [activeTasks]);

  return (
    <div className="space-y-6 pb-24" dir="rtl">
      {/* כותרת וסטטיסטיקות */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>ניהול משימות</h1>
          <p className={`mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>תכנון, מעקב ומימוש משימות יומיות</p>
        </div>
        <Button onClick={() => setShowTaskForm(true)} className={`text-white shadow-md ${
            theme === 'dark' 
                ? 'bg-cyan-500 hover:bg-cyan-600 shadow-cyan-500/30' 
                : 'bg-red-700 hover:bg-red-800'
        }`}>
          <Plus className="w-4 h-4 ml-2" />
          משימה חדשה
        </Button>
      </div>

      {/* כרטיסי סטטיסטיקות */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={CheckSquare} label="סה״כ משימות" value={stats.total} color="bg-blue-500" />
        <StatCard icon={CheckCircle2} label="הושלמו" value={stats.completed} color="bg-emerald-500" />
        <StatCard icon={AlertCircle} label="באיחור" value={stats.overdue} color="bg-red-500" />
        <StatCard icon={Calendar} label="להיום" value={stats.today} color="bg-orange-500" />
      </div>

      {/* סינון וחיפוש */}
      <div className={`p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-3 transition-colors ${
          theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div className="relative flex-1">
          <Input
            placeholder="חיפוש משימה..."
            className="pr-10"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
          <SelectTrigger className="w-full md:w-[160px]">
            <Filter className="w-4 h-4 ml-2" />
            <SelectValue placeholder="סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            <SelectItem value="todo">לביצוע</SelectItem>
            <SelectItem value="in_progress">בתהליך</SelectItem>
            <SelectItem value="done">הושלם</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* טאבים - פעילות / ארכיון */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-100">
          <TabsTrigger value="active" className="data-[state=active]:bg-white">
            משימות פעילות ({activeTasks.length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="data-[state=active]:bg-white">
            ארכיון ({archivedTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {isLoading ? (
            <div className="text-center py-10 text-slate-500">טוען משימות...</div>
          ) : activeTasks.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">אין משימות פעילות</p>
              <p className="text-sm mt-1">התחל ביצירת משימה חדשה</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {activeTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTaskStatus(task)}
                    onArchive={() => archiveTask(task)}
                    onEdit={() => { setEditingTask(task); setShowTaskForm(true); }}
                    onDelete={() => {
                      if (confirm('למחוק משימה זו?')) deleteTask.mutate(task.id);
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="archived" className="mt-6">
          {archivedTasks.length === 0 ? (
            <div className="text-center py-16 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
              <Archive className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">אין משימות בארכיון</p>
            </div>
          ) : (
            <div className="space-y-3">
              {archivedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isArchived
                  onDelete={() => {
                    if (confirm('למחוק משימה זו לצמיתות?')) deleteTask.mutate(task.id);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* דיאלוג יצירה/עריכה */}
      <Dialog open={showTaskForm} onOpenChange={(open) => {
        setShowTaskForm(open);
        if (!open) setEditingTask(null);
      }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>{editingTask ? "עריכת משימה" : "משימה חדשה"}</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowTaskForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>
          <TaskForm
            task={editingTask}
            onSubmit={(data) => {
              if (editingTask) {
                updateTask.mutate({ id: editingTask.id, data });
              } else {
                createTask.mutate(data);
              }
            }}
            onCancel={() => setShowTaskForm(false)}
            isSubmitting={createTask.isPending || updateTask.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const { theme } = useSettings();
  return (
    <Card className={`border-none shadow-sm transition-colors ${
        theme === 'dark' ? 'bg-slate-800' : 'bg-white'
    }`}>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color} ${theme === 'dark' ? 'bg-opacity-20' : 'bg-opacity-10'}`}>
          <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
          <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskCard({ task, onToggle, onArchive, onEdit, onDelete, isArchived }) {
  const { theme } = useSettings();
  const isOverdue = task.due_date && moment(task.due_date).isBefore(moment(), 'day') && task.status !== 'done';
  const isToday = task.due_date && moment(task.due_date).isSame(moment(), 'day');
  const isDone = task.status === 'done';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`rounded-xl border p-4 hover:shadow-md transition-all ${
        theme === 'dark' 
          ? isDone ? 'bg-emerald-500/10 border-emerald-500/30' : 
            isOverdue ? 'bg-red-500/10 border-red-500/30' : 
            'bg-slate-800 border-slate-700'
          : isDone ? 'bg-emerald-50/30 border-emerald-200' : 
            isOverdue ? 'bg-red-50/30 border-red-200' : 
            'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        {!isArchived && (
          <button
            onClick={onToggle}
            className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
              isDone 
                ? 'bg-emerald-500 border-emerald-500' 
                : 'border-slate-300 hover:border-emerald-500'
            }`}
          >
            {isDone && <CheckCircle2 className="w-4 h-4 text-white" />}
          </button>
        )}

        {/* תוכן */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className={`font-bold text-slate-900 ${isDone ? 'line-through text-slate-500' : ''}`}>
              {task.title}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              {isOverdue && !isDone && (
                <Badge variant="destructive" className="text-xs">באיחור</Badge>
              )}
              {isToday && !isDone && (
                <Badge className="bg-orange-500 text-xs">היום</Badge>
              )}
              {task.due_date && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {moment(task.due_date).format('DD/MM/YY')}
                </span>
              )}
            </div>
          </div>

          {/* Related Entities Links */}
          {(task.related_lead_id || task.related_opportunity_id) && (
             <div className="flex gap-2 mb-2">
                {task.related_lead_id && (
                    <Link to={`${createPageUrl('LeadDetails')}?leadId=${task.related_lead_id}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] hover:bg-blue-100 transition-colors">
                        <User className="w-3 h-3" />
                        ליד
                    </Link>
                )}
                {task.related_opportunity_id && (
                     <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px]">
                        <Briefcase className="w-3 h-3" />
                        הזדמנות
                    </div>
                )}
             </div>
          )}

          {task.description && (
            <p className={`text-sm text-slate-600 mb-2 ${isDone ? 'line-through text-slate-400' : ''}`}>
              {task.description}
            </p>
          )}

          {/* פעולות */}
          {!isArchived && (
            <div className="flex gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-7 px-2 text-slate-500 hover:text-blue-600"
              >
                עריכה
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onArchive}
                className="h-7 px-2 text-slate-500 hover:text-orange-600"
              >
                <Archive className="w-3 h-3 ml-1" />
                ארכיון
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-7 px-2 text-slate-500 hover:text-red-600"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}

          {isArchived && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-7 px-2 text-slate-500 hover:text-red-600 mt-2"
            >
              <Trash2 className="w-3 h-3 ml-1" />
              מחק לצמיתות
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function TaskForm({ task, onSubmit, onCancel, isSubmitting }) {
  const queryClient = useQueryClient();
  // Fetch leads and opportunities for selection
  const { data: leads = [] } = useQuery({ queryKey: ['leads_basic'], queryFn: () => base44.entities.Lead.list(), staleTime: 60000 });
  const { data: opportunities = [] } = useQuery({ queryKey: ['opportunities_basic'], queryFn: () => base44.entities.Opportunity.list(), staleTime: 60000 });

  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    due_date: task?.due_date || "",
    status: task?.status || "todo",
    assigned_to: task?.assigned_to || "",
    related_lead_id: task?.related_lead_id || "",
    related_opportunity_id: task?.related_opportunity_id || ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert("נא למלא כותרת משימה");
      return;
    }

    // אם אין assigned_to, נשתמש במשתמש הנוכחי
    if (!formData.assigned_to) {
      const user = await base44.auth.me();
      formData.assigned_to = user.email;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-900">כותרת משימה *</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="מה צריך לעשות?"
          className="border-slate-300"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-900">תיאור</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="פרטים נוספים..."
          className="border-slate-300 h-24 resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-900">תאריך יעד</label>
        <Input
          type="date"
          value={formData.due_date}
          onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          className="border-slate-300"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-900">סטטוס</label>
        <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
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

      {/* Relational Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
         <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">שיוך לליד</label>
            <Select value={formData.related_lead_id || "none"} onValueChange={(v) => setFormData({ ...formData, related_lead_id: v === "none" ? null : v })}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="בחר ליד..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- ללא שיוך --</SelectItem>
                {leads.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
         </div>
         <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">שיוך להזדמנות</label>
            <Select value={formData.related_opportunity_id || "none"} onValueChange={(v) => setFormData({ ...formData, related_opportunity_id: v === "none" ? null : v })}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="בחר הזדמנות..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-- ללא שיוך --</SelectItem>
                {opportunities.map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.product_type} - {o.lead_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
         </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          ביטול
        </Button>
        <Button type="submit" className="bg-red-700 hover:bg-red-800" disabled={isSubmitting}>
          {task ? "עדכן" : "צור משימה"}
        </Button>
      </div>
    </form>
  );
}