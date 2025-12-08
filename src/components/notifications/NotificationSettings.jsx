import React, { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Calendar, CheckSquare, Users, Save, Loader2 } from "lucide-react";
import { useSettings } from '@/components/context/SettingsContext';

export default function NotificationSettings() {
    const { theme } = useSettings();
    const queryClient = useQueryClient();
    const [currentUser, setCurrentUser] = React.useState(null);

    // Get current user
    React.useEffect(() => {
        async function getUser() {
            try {
                const user = await base44.auth.me();
                setCurrentUser(user);
            } catch (e) {
                console.error("Not logged in");
            }
        }
        getUser();
    }, []);

    const { data: settings, isLoading } = useQuery({
        queryKey: ['notification_settings', currentUser?.email],
        queryFn: async () => {
            if (!currentUser?.email) return null;
            const res = await base44.entities.NotificationSettings.filter({ user_email: currentUser.email });
            return res[0] || null;
        },
        enabled: !!currentUser
    });

    const { register, handleSubmit, setValue, watch, formState: { isDirty } } = useForm({
        defaultValues: {
            notify_new_leads: true,
            notify_opp_closing: true,
            notify_tasks: true,
            days_before_deadline: 3
        }
    });

    // Update form when data loads
    useEffect(() => {
        if (settings) {
            setValue('notify_new_leads', settings.notify_new_leads);
            setValue('notify_opp_closing', settings.notify_opp_closing);
            setValue('notify_tasks', settings.notify_tasks);
            setValue('days_before_deadline', settings.days_before_deadline);
        }
    }, [settings, setValue]);

    const saveMutation = useMutation({
        mutationFn: (data) => {
            const payload = { ...data, user_email: currentUser.email };
            if (settings?.id) {
                return base44.entities.NotificationSettings.update(settings.id, payload);
            } else {
                return base44.entities.NotificationSettings.create(payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['notification_settings']);
            alert("ההגדרות נשמרו בהצלחה");
        }
    });

    const onSubmit = (data) => {
        saveMutation.mutate(data);
    };

    if (!currentUser) return <div className="p-4">נא להתחבר כדי לנהל התראות</div>;
    if (isLoading) return <div className="p-4"><Loader2 className="animate-spin" /></div>;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-red-600" />
                        העדפות התראות
                    </CardTitle>
                    <CardDescription>
                        בחר אילו התראות ברצונך לקבל במערכת
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    
                    <div className="flex items-center justify-between space-x-4 space-x-reverse">
                        <div className="flex items-center space-x-4 space-x-reverse">
                            <Users className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                            <div className="space-y-0.5">
                                <Label className="text-base">לידים חדשים</Label>
                                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>קבל התראה כאשר נוצר ליד חדש במערכת</p>
                            </div>
                        </div>
                        <Switch 
                            checked={watch('notify_new_leads')}
                            onCheckedChange={(checked) => setValue('notify_new_leads', checked, { shouldDirty: true })}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-4 space-x-reverse">
                        <div className="flex items-center space-x-4 space-x-reverse">
                            <CheckSquare className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                            <div className="space-y-0.5">
                                <Label className="text-base">משימות שלי</Label>
                                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>קבל התראה על משימות חדשות או שפג תוקפן</p>
                            </div>
                        </div>
                        <Switch 
                            checked={watch('notify_tasks')}
                            onCheckedChange={(checked) => setValue('notify_tasks', checked, { shouldDirty: true })}
                        />
                    </div>

                    <div className="flex items-center justify-between space-x-4 space-x-reverse">
                        <div className="flex items-center space-x-4 space-x-reverse">
                            <Calendar className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                            <div className="space-y-0.5">
                                <Label className="text-base">הזדמנויות לקראת סגירה</Label>
                                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>קבל תזכורת על הזדמנויות שתאריך היעד שלהן מתקרב</p>
                            </div>
                        </div>
                        <Switch 
                            checked={watch('notify_opp_closing')}
                            onCheckedChange={(checked) => setValue('notify_opp_closing', checked, { shouldDirty: true })}
                        />
                    </div>

                    {watch('notify_opp_closing') && (
                        <div className="mr-10 pl-4 border-r-2 border-slate-100 pr-4">
                            <div className="flex items-center gap-3">
                                <Label className="whitespace-nowrap">התראה</Label>
                                <Input 
                                    type="number" 
                                    className="w-20" 
                                    {...register('days_before_deadline', { min: 1 })}
                                />
                                <Label>ימים לפני תאריך היעד</Label>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={saveMutation.isPending} className="bg-red-600 hover:bg-red-700">
                            {saveMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            <Save className="ml-2 h-4 w-4" />
                            שמור שינויים
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </form>
    );
}