import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Bell, Calendar, CheckSquare, MessageSquare, Check, X, 
    Briefcase, UserPlus, Clock, Settings
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Notifications() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const queryClient = useQueryClient();

    // Get Current User
    useEffect(() => {
        base44.auth.me().then(setCurrentUser).catch(() => {});
    }, []);

    // Fetch Settings
    const { data: settings } = useQuery({
        queryKey: ['notification_settings', currentUser?.email],
        queryFn: async () => {
            if (!currentUser?.email) return null;
            const res = await base44.entities.NotificationSettings.filter({ user_email: currentUser.email });
            return res[0] || { notify_tasks: true, notify_opp_closing: true, days_before_deadline: 3 }; // Defaults
        },
        enabled: !!currentUser
    });

    // Fetch 1: Persistent Notifications (DB)
    const { data: persistentNotifications } = useQuery({
        queryKey: ['notifications_db', currentUser?.email],
        queryFn: () => base44.entities.Notification.filter(
            { user_email: currentUser.email, is_read: false }, 
            '-created_date', 
            20
        ),
        enabled: !!currentUser,
        initialData: []
    });

    // Fetch 2: Tasks due soon/overdue (Computed)
    const { data: taskAlerts } = useQuery({
        queryKey: ['notifications_tasks', currentUser?.email],
        queryFn: async () => {
            if (!settings?.notify_tasks) return [];
            const tasks = await base44.entities.Task.list(); // Filter logic below due to SDK limitations on complex dates
            const today = new Date();
            const twoDaysFromNow = new Date();
            twoDaysFromNow.setDate(today.getDate() + 2);

            return tasks.filter(t => {
                if (t.status === 'done') return false;
                // Simple assignment check - ideally matched by email
                // Assuming task.assigned_to stores email
                if (t.assigned_to && t.assigned_to !== currentUser.email) return false;
                
                if (!t.due_date) return false;
                const due = new Date(t.due_date);
                return due <= twoDaysFromNow;
            }).map(t => ({
                id: `task-${t.id}`,
                type: 'task',
                title: 'משימה דורשת תשומת לב',
                message: t.title,
                date: t.due_date,
                isOverdue: new Date(t.due_date) < new Date(),
                link: createPageUrl('Dashboard'), // Or Tasks page
                actionLabel: 'צפה במשימות'
            }));
        },
        enabled: !!currentUser && !!settings,
        initialData: []
    });

    // Fetch 3: Opportunities Closing Soon (Computed)
    const { data: oppAlerts } = useQuery({
        queryKey: ['notifications_opps'],
        queryFn: async () => {
            if (!settings?.notify_opp_closing) return [];
            const opps = await base44.entities.Opportunity.list();
            const days = settings.days_before_deadline || 3;
            const threshold = new Date();
            threshold.setDate(threshold.getDate() + days);

            return opps.filter(o => {
                if (['Closed Won', 'Closed Lost'].some(s => o.deal_stage.includes(s))) return false;
                if (!o.expected_close_date) return false;
                const closeDate = new Date(o.expected_close_date);
                return closeDate <= threshold && closeDate >= new Date(); // Future but soon
            }).map(o => ({
                id: `opp-${o.id}`,
                type: 'opportunity',
                title: 'הזדמנות מתקרבת ליעד',
                message: `${o.lead_name} - ${o.product_type}`,
                date: o.expected_close_date,
                link: createPageUrl('Opportunities'),
                actionLabel: 'צפה בלוח'
            }));
        },
        enabled: !!settings,
        initialData: []
    });

    // Mark as read mutation
    const markAsRead = useMutation({
        mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
        onSuccess: () => queryClient.invalidateQueries(['notifications_db'])
    });

    // Combine all
    const allNotifications = useMemo(() => {
        const dbNotifs = persistentNotifications.map(n => {
            let link = null;
            let actionLabel = null;

            if (n.related_entity_type === 'Lead' && n.related_entity_id) {
                link = `${createPageUrl('LeadDetails')}?id=${n.related_entity_id}`;
                actionLabel = 'תיק לקוח';
            } else if (n.related_entity_type === 'Opportunity') {
                link = createPageUrl('Opportunities');
                actionLabel = 'לוח הזדמנויות';
            } else if (n.related_entity_type === 'Task') {
                link = createPageUrl('Tasks');
                actionLabel = 'משימות';
            }

            return {
                id: n.id,
                type: n.type || 'info',
                title: n.title,
                message: n.message,
                date: n.created_date,
                isPersistent: true,
                link,
                actionLabel
            };
        });

        return [...dbNotifs, ...taskAlerts, ...oppAlerts].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
    }, [persistentNotifications, taskAlerts, oppAlerts]);

    const unreadCount = allNotifications.length;

    const getIcon = (type) => {
        switch (type) {
            case 'task': return <CheckSquare className="w-4 h-4 text-blue-500" />;
            case 'opportunity': return <Briefcase className="w-4 h-4 text-purple-500" />;
            case 'lead': return <UserPlus className="w-4 h-4 text-green-500" />;
            case 'warning': return <Clock className="w-4 h-4 text-amber-500" />;
            default: return <MessageSquare className="w-4 h-4 text-slate-500" />;
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl">
                    <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'fill-current' : ''}`} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-xl shadow-xl border-slate-100" align="end">
                <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center rounded-t-xl">
                    <h4 className="font-semibold text-sm text-slate-700">מרכז התראות</h4>
                    {unreadCount > 0 && <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-200">{unreadCount} חדשות</Badge>}
                </div>

                <ScrollArea className="h-[320px]">
                    {allNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-6 text-center text-slate-400 space-y-2">
                            <Bell className="w-8 h-8 opacity-20" />
                            <p className="text-sm">אין התראות חדשות</p>
                            <p className="text-xs opacity-70">הכל מעודכן ומוכן לעבודה!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {allNotifications.map((notif) => (
                                <div key={notif.id} className="p-3 hover:bg-slate-50 transition-colors relative group">
                                    <div className="flex gap-3 items-start">
                                        <div className={`mt-1 p-1.5 rounded-lg bg-white border shadow-sm shrink-0`}>
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 leading-none mb-1.5">
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-slate-500 line-clamp-2 mb-1.5">
                                                {notif.message}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-slate-400">
                                                    {notif.date ? formatDistanceToNow(new Date(notif.date), { addSuffix: true, locale: he }) : 'היום'}
                                                </span>
                                                {notif.link && (
                                                    <Link to={notif.link} onClick={() => setIsOpen(false)} className="text-[10px] font-medium text-blue-600 hover:underline">
                                                        {notif.actionLabel || 'צפה'}
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                        {notif.isPersistent && (
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 absolute top-2 left-2 text-slate-300 hover:text-blue-600"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    markAsRead.mutate(notif.id);
                                                }}
                                                title="סמן כנקרא"
                                            >
                                                <Check className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-2 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between">
                    <Link to={createPageUrl('Settings')} onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500 hover:text-slate-800">
                            <Settings className="w-3 h-3 ml-1" />
                            הגדרות
                        </Button>
                    </Link>
                    {/* Potential "Clear All" logic here */}
                </div>
            </PopoverContent>
        </Popover>
    );
}