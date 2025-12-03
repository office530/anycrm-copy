import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Zap, Sparkles, Wand2, Bell, Mail, Clock, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// תבניות מוכנות עם צבעים חזקים
const templates = [
  {
    id: 'welcome_email', title: 'מייל ברוכים הבאים', description: 'שלח מייל אוטומטי לכל ליד חדש', icon: Mail, color: 'bg-slate-700',
    rule: { name: 'מייל ברוכים הבאים', trigger_entity: 'Lead', trigger_event: 'create', action_type: 'send_email', action_config: { email_subject: 'ברוכים הבאים!', email_to: '{{email}}' } }
  },
  {
    id: 'task_big_deal', title: 'התראת "עסקה גדולה"', description: 'פתח משימה למנהל על עסקה מעל 1M ₪', icon: Bell, color: 'bg-red-700',
    rule: { name: 'עסקה גדולה VIP', trigger_entity: 'Opportunity', trigger_event: 'create', condition_field: 'property_value', condition_value: '1000000', action_type: 'create_task' }
  }
];

export default function AutomationPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery({
    queryKey: ['automationRules'],
    queryFn: () => base44.entities.AutomationRule.list(),
    initialData: []
  });

  const createRule = useMutation({
    mutationFn: (data) => base44.entities.AutomationRule.create(data),
    onSuccess: () => queryClient.invalidateQueries(['automationRules'])
  });

  const deleteRule = useMutation({
    mutationFn: (id) => base44.entities.AutomationRule.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['automationRules'])
  });

  return (
    <div className="space-y-8 pb-20 font-sans text-slate-900" dir="rtl">
      
      {/* כותרת */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">אוטומציות</h1>
          <p className="text-slate-500 font-medium">ניהול חוקים ותהליכים אוטומטיים</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-red-700 hover:bg-red-800 text-white font-bold shadow-lg shadow-red-900/10">
            <Plus className="w-4 h-4 ml-2" />
            חוק חדש
        </Button>
      </div>

      {/* תבניות */}
      <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-red-600" />
              תבניות מהירות
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map(tpl => (
                  <Card key={tpl.id} className="group hover:shadow-md transition-all border border-slate-200 cursor-pointer bg-white" onClick={() => createRule.mutate(tpl.rule)}>
                      <CardContent className="p-6">
                          <div className={`w-12 h-12 rounded-xl ${tpl.color} flex items-center justify-center text-white mb-4 shadow-md`}>
                              <tpl.icon className="w-6 h-6" />
                          </div>
                          <h4 className="font-bold text-lg mb-2 text-slate-900">{tpl.title}</h4>
                          <p className="text-sm text-slate-600">{tpl.description}</p>
                      </CardContent>
                  </Card>
              ))}
          </div>
      </div>

      {/* רשימת חוקים פעילים */}
      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-red-600" />
              חוקים פעילים ({rules.length})
        </h3>
        
        {isLoading ? <div className="text-center py-10 text-slate-500">טוען נתונים...</div> : rules.map(rule => (
            <Card key={rule.id} className="flex flex-row items-center justify-between p-6 bg-white border border-slate-200 shadow-sm hover:border-red-200 transition-colors">
                <div className="flex items-center gap-5">
                    <div className="bg-slate-50 p-3 rounded-full text-slate-600 border border-slate-100">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900">{rule.name}</h3>
                        <p className="text-sm text-slate-600 mt-1">
                            <span className="font-semibold text-slate-800">טריגר:</span> {rule.trigger_entity === 'Lead' ? 'ליד' : 'הזדמנות'} {rule.trigger_event === 'create' ? 'נוצר' : 'עודכן'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            {rule.action_type === 'send_email' ? <Mail className="w-3 h-3"/> : <Bell className="w-3 h-3"/>}
                            פעולה: {rule.action_type === 'send_email' ? 'שליחת אימייל' : 'יצירת משימה'}
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => deleteRule.mutate(rule.id)}>
                    <Trash2 className="w-5 h-5" />
                </Button>
            </Card>
        ))}
        
        {rules.length === 0 && !isLoading && (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <p className="text-slate-500 font-medium">אין אוטומציות מוגדרות</p>
            </div>
        )}
      </div>

      {/* מודל יצירה (הושאר פשוט לקריאה) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl"><RuleForm onSuccess={() => setIsDialogOpen(false)} /></DialogContent>
      </Dialog>
    </div>
  );
}

// טופס יצירה (עם AI)
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
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg mb-8 border border-slate-800 relative overflow-hidden">
                
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <Sparkles className="w-5 h-5 text-red-500 animate-pulse" />
                        <span>מחולל אוטומציות חכם (AI)</span>
                    </div>
                    <p className="text-slate-400 text-sm">
                        תאר את האוטומציה בשפה חופשית, והבינה המלאכותית תבנה את החוק עבורך.
                    </p>
                    
                    <div className="flex gap-3 pt-2">
                        <div className="flex-1 relative">
                            <Textarea 
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="למשל: כאשר ליד הופך ל'בשל למכירה', שלח לו מייל ברוכים הבאים..."
                                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none h-20 text-sm rounded-xl focus:ring-2 focus:ring-red-900 focus:bg-slate-800 transition-all"
                            />
                        </div>
                        <Button 
                            type="button"
                            onClick={generateWithAI}
                            disabled={isGenerating || !aiPrompt}
                            className="h-20 w-32 bg-red-700 text-white hover:bg-red-800 hover:scale-105 transition-all font-bold shadow-lg rounded-xl shrink-0 border-none"
                        >
                            {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                <div className="flex flex-col items-center gap-1">
                                    <Sparkles className="w-5 h-5" />
                                    <span>צור חוק</span>
                                </div>
                            )}
                        </Button>
                    </div>
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
                    <div className="space-y-3 bg-slate-100 p-3 rounded">
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
                     <div className="space-y-3 bg-slate-100 p-3 rounded">
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

            <Button type="submit" className="w-full bg-red-700 hover:bg-red-800 text-white font-bold mt-4" disabled={createRule.isPending}>
                {createRule.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                שמור חוק
            </Button>
        </form>
    );
}