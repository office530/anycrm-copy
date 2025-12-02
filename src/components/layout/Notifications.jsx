import React from 'react';
import { Bell, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { Badge } from "@/components/ui/badge";

export default function Notifications() {
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      // Fetch tasks that are pending and due soon (next 2 days) or overdue
      // Since we can't complex filter in one go on all fields sometimes, we fetch active tasks and filter in memory
      const tasks = await base44.entities.Task.filter({
        status: { $in: ['todo', 'in_progress'] }
      });
      
      if (!tasks) return [];

      const today = moment().startOf('day');
      const twoDaysFromNow = moment().add(2, 'days').endOf('day');

      // Filter in memory
      return tasks.filter(t => {
          const dueDate = moment(t.due_date);
          return dueDate.isValid() && dueDate.isBefore(twoDaysFromNow);
      }).sort((a, b) => moment(a.due_date).valueOf() - moment(b.due_date).valueOf());
    },
    refetchInterval: 300000 // Refresh every 5 mins
  });

  const unreadCount = notifications.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <h4 className="font-semibold text-sm">התראות</h4>
            {unreadCount > 0 && <Badge variant="secondary" className="text-xs">{unreadCount} חדשות</Badge>}
        </div>
        <ScrollArea className="h-[300px]">
            {isLoading ? (
                <div className="p-4 text-center text-xs text-slate-500">טוען...</div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">אין התראות חדשות</p>
                    <p className="text-xs opacity-70">אתה מעודכן לגמרי!</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.map(task => {
                        const isOverdue = moment(task.due_date).isBefore(moment(), 'day');
                        return (
                            <div key={task.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 items-start group">
                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${isOverdue ? 'bg-red-500' : 'bg-orange-500'}`} />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight mb-1">
                                        {task.title}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Clock className="w-3 h-3" />
                                        {isOverdue ? (
                                            <span className="text-red-500 font-medium">באיחור של {moment().diff(moment(task.due_date), 'days')} ימים</span>
                                        ) : (
                                            <span>מועד אחרון: {moment(task.due_date).format('DD/MM')}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </ScrollArea>
        <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
            <Button variant="ghost" size="sm" className="text-xs w-full h-8" onClick={() => window.location.href = '/dashboard'}>
                צפה בכל המשימות
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}