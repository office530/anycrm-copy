import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from "moment";
import { useSettings } from "@/components/context/SettingsContext";

export default function TasksWidget() {
  const { theme } = useSettings();
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list()
  });

  const updateTask = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['tasks'])
  });

  // משימות קרובות - רק פעילות (לא הושלמו) ועד 7 ימים קדימה
  const upcomingTasks = React.useMemo(() => {
    const today = moment().endOf('day');
    return tasks
      .filter((t) => {
        if (t.status === 'done' || t.status === 'archived') return false;
        const due = moment(t.due_date);
        return due.isValid() && due.isSameOrBefore(today.clone().add(7, 'days'));
      })
      .sort((a, b) => moment(a.due_date).valueOf() - moment(b.due_date).valueOf())
      .slice(0, 5);
  }, [tasks]);

  const toggleTaskStatus = (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    updateTask.mutate({ id: task.id, data: { status: newStatus } });
  };

  return (
    <Card className={`border-none shadow-sm rounded-2xl flex flex-col h-[400px] transition-colors ${
      theme === 'dark' ? 'bg-slate-800' : 'bg-white'
    }`}>
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>משימות קרובות</span>
          <Badge variant="outline" className={`text-xs ${theme === 'dark' ? 'border-slate-600 text-slate-300' : ''}`}>{upcomingTasks.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pr-2">
        {upcomingTasks.length === 0 ? (
          <div className={`text-center py-10 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p>אין משימות דחופות</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingTasks.map((task) => {
              const isToday = moment(task.due_date).isSame(moment(), 'day');
              const isOverdue = moment(task.due_date).isBefore(moment(), 'day');
              const isDone = task.status === 'done';

              return (
                <div
                  key={task.id}
                  className={`p-3 rounded-xl border group hover:shadow-sm transition-all ${
                    theme === 'dark'
                      ? isDone 
                        ? 'bg-emerald-900/20 border-emerald-800' 
                        : isOverdue 
                        ? 'bg-red-900/20 border-red-800' 
                        : 'bg-slate-700/50 border-slate-600 hover:border-red-500/50'
                      : isDone
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : isOverdue
                        ? 'bg-red-50/50 border-red-200'
                        : 'bg-slate-50 border-slate-100 hover:border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-slate-300 hover:border-emerald-500'
                      }`}
                    >
                      {isDone && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4
                          className={`font-medium text-sm line-clamp-1 ${
                            isDone 
                              ? 'line-through text-slate-400' 
                              : theme === 'dark' ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </h4>
                        {isOverdue && !isDone ? (
                          <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                            באיחור
                          </Badge>
                        ) : isToday && !isDone ? (
                          <Badge className="bg-orange-500 text-[10px] h-5 px-1.5">היום</Badge>
                        ) : (
                          <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            {moment(task.due_date).format('DD/MM')}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p
                          className={`text-xs line-clamp-1 ${
                            isDone ? 'text-slate-400' : theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                          }`}
                        >
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <div className={`p-4 border-t shrink-0 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
        <Link to={createPageUrl('Tasks')}>
          <Button variant="ghost" className={`w-full text-xs h-8 ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-600'}`}>
            כל המשימות
          </Button>
        </Link>
      </div>
    </Card>
  );
}