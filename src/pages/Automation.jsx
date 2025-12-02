import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Zap, Save, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function AutomationPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery({
    queryKey: ['automationRules'],
    queryFn: () => base44.entities.AutomationRule.list(),
    initialData: []
  });

  const deleteRule = useMutation({
    mutationFn: (id) => base44.entities.AutomationRule.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['automationRules'])
  });

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">אוטומציות</h1>
          <p className="text-slate-500">הגדרת חוקים ופעולות אוטומטיות</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600">
            <Plus className="w-4 h-4 ml-2" />
            חוק חדש
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? <div className="text-center py-10">טוען...</div> : rules.map(rule => (
            <Card key={rule.id} className="flex flex-row items-center justify-between p-6">
                <div className="flex items-center gap-4">
                    <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{rule.name}</h3>
                        <p className="text-sm text-slate-500">
                            כאשר 
                            <span className="font-medium text-slate-700 mx-1">
                                {rule.trigger_entity === 'Lead' ? 'ליד' : 'הזדמנות'}
                            </span>
                            {rule.trigger_event === 'create' ? 'נוצר/ה' : 'מתעדכן/ת'}
                            {rule.condition_field && (
                                <>
                                    {' '}כאשר{' '}
                                    <span className="font-medium text-slate-700">{rule.condition_field}</span>
                                    {' '}שווה ל-{' '}
                                    <span className="font-medium text-slate-700">{rule.condition_value}</span>
                                </>
                            )}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            ביצוע: {rule.action_type === 'send_email' ? 'שליחת אימייל' : 'יצירת משימה'}
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => deleteRule.mutate(rule.id)}>
                    <Trash2 className="w-5 h-5" />
                </Button>
            </Card>
        ))}
        {rules.length === 0 && !isLoading && (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
                <p className="text-slate-500">אין חוקים מוגדרים עדיין</p>
            </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>יצירת אוטומציה חדשה</DialogTitle>
            </DialogHeader>
            <RuleForm onSuccess={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RuleForm({ onSuccess }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: "",
        trigger_entity: "Lead",
        trigger_event: "create",
        condition_field: "",
        condition_value: "",
        action_type: "create_task",
        action_config: {
            email_to: "",
            email_subject: "",
            email_body: "",
            task_title: "",
            task_description: "",
            task_due_days: 1
        }
    });

    const createRule = useMutation({
        mutationFn: (data) => base44.entities.AutomationRule.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['automationRules']);
            onSuccess();
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        createRule.mutate(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
            <div className="space-y-2">
                <Label>שם החוק</Label>
                <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="לדוגמה: משימת מעקב לליד חדש"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>ישות מפעילה</Label>
                    <Select value={formData.trigger_entity} onValueChange={v => setFormData({...formData, trigger_entity: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Lead">ליד</SelectItem>
                            <SelectItem value="Opportunity">הזדמנות</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>אירוע</Label>
                    <Select value={formData.trigger_event} onValueChange={v => setFormData({...formData, trigger_event: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="create">יצירה חדשה</SelectItem>
                            <SelectItem value="update">עדכון</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
                 <div className="space-y-2">
                    <Label>שדה לתנאי (אופציונלי)</Label>
                    <Input 
                        value={formData.condition_field} 
                        onChange={e => setFormData({...formData, condition_field: e.target.value})} 
                        placeholder="למשל: lead_status"
                    />
                </div>
                <div className="space-y-2">
                    <Label>ערך לתנאי</Label>
                    <Input 
                        value={formData.condition_value} 
                        onChange={e => setFormData({...formData, condition_value: e.target.value})} 
                        placeholder="למשל: New"
                    />
                </div>
            </div>

            <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                    <Label>פעולה לביצוע</Label>
                    <Select value={formData.action_type} onValueChange={v => setFormData({...formData, action_type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="create_task">יצירת משימה</SelectItem>
                            <SelectItem value="send_email">שליחת אימייל</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {formData.action_type === 'create_task' ? (
                    <div className="space-y-3 bg-slate-50 p-3 rounded">
                         <div className="space-y-2">
                            <Label>כותרת משימה</Label>
                            <Input 
                                value={formData.action_config.task_title} 
                                onChange={e => setFormData({...formData, action_config: {...formData.action_config, task_title: e.target.value}})}
                                placeholder="השתמש ב-{{full_name}} לשילוב שם"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>תיאור</Label>
                            <Input 
                                value={formData.action_config.task_description} 
                                onChange={e => setFormData({...formData, action_config: {...formData.action_config, task_description: e.target.value}})}
                            />
                        </div>
                    </div>
                ) : (
                     <div className="space-y-3 bg-slate-50 p-3 rounded">
                        <div className="space-y-2">
                            <Label>שלח אל</Label>
                            <Input 
                                value={formData.action_config.email_to} 
                                onChange={e => setFormData({...formData, action_config: {...formData.action_config, email_to: e.target.value}})}
                                placeholder="כתובת מייל או {{email}}"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>נושא</Label>
                            <Input 
                                value={formData.action_config.email_subject} 
                                onChange={e => setFormData({...formData, action_config: {...formData.action_config, email_subject: e.target.value}})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>תוכן</Label>
                            <Input 
                                value={formData.action_config.email_body} 
                                onChange={e => setFormData({...formData, action_config: {...formData.action_config, email_body: e.target.value}})}
                            />
                        </div>
                    </div>
                )}
            </div>

            <Button type="submit" className="w-full bg-blue-600" disabled={createRule.isPending}>
                {createRule.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                שמור חוק
            </Button>
        </form>
    );
}