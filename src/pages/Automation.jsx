import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Zap, Save, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

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

    const generateWithAI = async () => {
        if (!aiPrompt.trim()) return;
        
        setIsGenerating(true);
        try {
            const systemPrompt = `
                You are an automation configuration assistant for a CRM. 
                User Logic: "${aiPrompt}"
                
                Your goal is to output a JSON object to populate a form based on the logic.
                
                Input Schema mapping:
                - trigger_entity: "Lead" or "Opportunity"
                - trigger_event: "create" or "update"
                - condition_field: "lead_status", "deal_stage", "source_year", etc.
                - condition_value: translate Hebrew terms to exact English Enums below:
                    Lead Statuses: "New", "Attempting Contact", "Contacted - Qualifying", "Sales Ready", "Converted", "Lost / Unqualified"
                    Deal Stages: "New (חדש)", "Discovery Call (שיחת בירור צרכים)", "Meeting Scheduled (נקבעת פגישה)", "Closed Won (נחתם - בהצלחה)"
                - action_type: "create_task" or "send_email"
                - action_config: {
                     email_to: string (use {{full_name}} or {{email}} placeholders),
                     email_subject: string,
                     email_body: string,
                     task_title: string,
                     task_description: string,
                     task_due_days: number
                }
                - name: Suggest a short hebrew name for this rule
    
                Output strictly valid JSON only.
            `;
    
            const response = await base44.integrations.Core.InvokeLLM({
                prompt: systemPrompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        trigger_entity: { type: "string" },
                        trigger_event: { type: "string" },
                        condition_field: { type: "string" },
                        condition_value: { type: "string" },
                        action_type: { type: "string" },
                        action_config: {
                            type: "object",
                            properties: {
                                email_to: { type: "string" },
                                email_subject: { type: "string" },
                                email_body: { type: "string" },
                                task_title: { type: "string" },
                                task_description: { type: "string" },
                                task_due_days: { type: "number" }
                            }
                        }
                    }
                }
            });
    
            const aiData = typeof response === 'string' ? JSON.parse(response) : response;
            
            // Merge AI data into current rule state
            setFormData(prev => ({
                ...prev,
                ...aiData,
                action_config: {
                    ...prev.action_config,
                    ...(aiData.action_config || {})
                }
            }));
    
        } catch (error) {
            console.error("AI Generation failed", error);
            alert("אירעה שגיאה ביצירת האוטומציה עם AI");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createRule.mutate(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
            
            {/* AI Generator Section */}
            <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg space-y-3 mb-6">
                <div className="flex items-center gap-2 text-purple-800 font-semibold">
                    <Sparkles className="w-4 h-4" />
                    <span>מחולל אוטומציות חכם (AI)</span>
                </div>
                <Label className="text-xs text-purple-600">תאר את האוטומציה בשפה חופשית (למשל: "כשליד הופך לחם צור לי משימה להתקשר מחר")</Label>
                <div className="flex gap-2">
                    <Textarea 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="תאר כאן את ההיגיון..."
                        className="bg-white resize-none h-16 text-sm"
                    />
                    <Button 
                        type="button"
                        onClick={generateWithAI}
                        disabled={isGenerating || !aiPrompt}
                        className="h-16 w-32 bg-purple-600 hover:bg-purple-700 shrink-0"
                    >
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : "✨ צור"}
                    </Button>
                </div>
            </div>

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