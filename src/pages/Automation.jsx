import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Zap, Sparkles, Wand2, Bell, Mail, Clock, Loader2, Power, PowerOff, History, CheckCircle2, XCircle, Activity, Copy, Search, Filter, TrendingUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
}];


export default function AutomationPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('rules');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState('all');
  const [editingRule, setEditingRule] = useState(null);
  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery({
    queryKey: ['automationRules'],
    queryFn: () => base44.entities.AutomationRule.list(),
    initialData: []
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['automationLogs'],
    queryFn: () => base44.entities.AutomationLog.list('-execution_time', 50),
    initialData: []
  });

  const createRule = useMutation({
    mutationFn: (data) => base44.entities.AutomationRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['automationRules']);
      setIsDialogOpen(false);
      setEditingRule(null);
    }
  });

  const deleteRule = useMutation({
    mutationFn: (id) => base44.entities.AutomationRule.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['automationRules'])
  });

  const toggleRule = useMutation({
    mutationFn: ({ id, isActive }) => base44.entities.AutomationRule.update(id, { is_active: isActive }),
    onSuccess: () => queryClient.invalidateQueries(['automationRules'])
  });

  const duplicateRule = (rule) => {
    const newRule = {
      ...rule,
      name: `${rule.name} (עותק)`,
      is_active: false
    };
    delete newRule.id;
    delete newRule.created_date;
    delete newRule.updated_date;
    delete newRule.created_by;
    createRule.mutate(newRule);
  };

  // Filter rules
  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.action_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEntity = filterEntity === 'all' || rule.trigger_entity === filterEntity;
    return matchesSearch && matchesEntity;
  });

  // Stats
  const stats = {
    total: rules.length,
    active: rules.filter(r => r.is_active !== false).length,
    inactive: rules.filter(r => r.is_active === false).length,
    successRate: logs.length > 0 ? Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100) : 0
  };

  return (
    <div className="space-y-8 pb-20 font-sans text-slate-900" dir="rtl">
      
      {/* כותרת + Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">אוטומציות</h1>
          <p className="text-slate-500 font-medium">ניהול חוקים ותהליכים אוטומטיים</p>
        </div>
        <Button onClick={() => { setEditingRule(null); setIsDialogOpen(true); }} className="bg-red-700 hover:bg-red-800 text-white font-bold shadow-lg shadow-red-900/10">
            <Plus className="w-4 h-4 ml-2" />
            חוק חדש
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">סה"כ חוקים</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <Zap className="w-8 h-8 text-slate-300" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">פעילים</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">מושבתים</p>
                <p className="text-2xl font-bold text-slate-400">{stats.inactive}</p>
              </div>
              <PowerOff className="w-8 h-8 text-slate-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">אחוז הצלחה</p>
                <p className="text-2xl font-bold text-blue-600">{stats.successRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="rules" className="gap-2">
            <Zap className="w-4 h-4" />
            חוקים פעילים
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <History className="w-4 h-4" />
            יומן הפעלות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-6">{/* תבניות */}

      <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-red-600" />
              תבניות מהירות
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {templates.map((tpl) =>
          <Card key={tpl.id} className="group hover:shadow-md transition-all border border-slate-200 cursor-pointer bg-white" onClick={() => createRule.mutate(tpl.rule)}>
                      <CardContent className="p-6">
                          <div className={`w-12 h-12 rounded-xl ${tpl.color} flex items-center justify-center text-white mb-4 shadow-md`}>
                              <tpl.icon className="w-6 h-6" />
                          </div>
                          <h4 className="font-bold text-lg mb-2 text-slate-900">{tpl.title}</h4>
                          <p className="text-sm text-slate-600">{tpl.description}</p>
                      </CardContent>
                  </Card>
          )}
          </div>
      </div>

      {/* חיפוש וסינון */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="חפש חוקים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger className="w-full md:w-48">
            <Filter className="w-4 h-4 ml-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הישויות</SelectItem>
            <SelectItem value="Lead">לידים בלבד</SelectItem>
            <SelectItem value="Opportunity">הזדמנויות בלבד</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* רשימת חוקים פעילים */}
      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-red-600" />
              חוקים פעילים ({filteredRules.length})
        </h3>
        
        {isLoading ? <div className="text-center py-10 text-slate-500">טוען נתונים...</div> : filteredRules.map((rule) =>
        <Card key={rule.id} className={`flex flex-row items-center justify-between p-6 bg-white border shadow-sm transition-colors ${rule.is_active ? 'border-slate-200 hover:border-red-200' : 'border-slate-200 bg-slate-50/50 opacity-60'}`}>
                <div className="flex items-center gap-5 flex-1">
                    <div className={`p-3 rounded-full border ${rule.is_active ? 'bg-slate-50 text-slate-600 border-slate-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                        <Zap className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-lg text-slate-900">{rule.name}</h3>
                          {!rule.is_active && <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">מושבת</span>}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">
                            <span className="font-semibold text-slate-800">טריגר:</span> {rule.trigger_entity === 'Lead' ? 'ליד' : 'הזדמנות'} {rule.trigger_event === 'create' ? 'נוצר' : 'עודכן'}
                            {rule.condition_field && ` | ${rule.condition_field} ${rule.condition_operator || 'equals'} ${rule.condition_value}`}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            {rule.action_type === 'send_email' ? <Mail className="w-3 h-3" /> : rule.action_type === 'create_task' ? <Bell className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                            פעולה: {rule.action_type === 'send_email' ? 'שליחת אימייל' : rule.action_type === 'create_task' ? 'יצירת משימה' : 'עדכון ישות'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3">
                      <Switch 
                        checked={rule.is_active !== false} 
                        onCheckedChange={(checked) => toggleRule.mutate({ id: rule.id, isActive: checked })}
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-400 hover:text-blue-600 hover:bg-blue-50" 
                      onClick={() => duplicateRule(rule)}
                      title="שכפל חוק"
                    >
                        <Copy className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => {
                      if(confirm('למחוק חוק זה?')) deleteRule.mutate(rule.id);
                    }}>
                        <Trash2 className="w-5 h-5" />
                    </Button>
                </div>
            </Card>
        )}
        
        {filteredRules.length === 0 && !isLoading && rules.length > 0 &&
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <p className="text-slate-500 font-medium">לא נמצאו חוקים תואמים</p>
            </div>
        }
        
        {rules.length === 0 && !isLoading &&
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <p className="text-slate-500 font-medium">אין אוטומציות מוגדרות</p>
            </div>
        }
      </div>
      </TabsContent>

      <TabsContent value="logs">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-bold">יומן הפעלות אחרונות</h3>
            </div>
            
            {logsLoading ? (
              <div className="text-center py-10"><Loader2 className="animate-spin mx-auto" /></div>
            ) : logs.length === 0 ? (
              <div className="text-center py-10 text-slate-400">אין הפעלות להצגה</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">זמן</TableHead>
                      <TableHead className="text-right">חוק</TableHead>
                      <TableHead className="text-right">ישות</TableHead>
                      <TableHead className="text-right">סטטוס</TableHead>
                      <TableHead className="text-right">פעולה</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.execution_time).toLocaleString('he-IL')}
                        </TableCell>
                        <TableCell className="font-medium">{log.rule_name}</TableCell>
                        <TableCell>
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                            {log.entity_type}
                          </span>
                        </TableCell>
                        <TableCell>
                          {log.status === 'success' ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              <CheckCircle2 className="w-3 h-3 ml-1" />
                              הצליח
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                              <XCircle className="w-3 h-3 ml-1" />
                              נכשל
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                          {log.action_taken}
                          {log.error_message && (
                            <div className="text-red-600 mt-1">{log.error_message}</div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>

      {/* מודל יצירה/עריכה */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingRule(null);
      }}>
        <DialogContent className="bg-slate-50 p-6 fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-w-2xl">
          <RuleForm 
            editingRule={editingRule} 
            onSuccess={() => {
              setIsDialogOpen(false);
              setEditingRule(null);
            }} 
          />
        </DialogContent>
      </Dialog>
    </div>);

}

// טופס יצירה (עם AI)
function RuleForm({ onSuccess, editingRule }) {
  const queryClient = useQueryClient();
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState(editingRule || {
    name: "",
    trigger_entity: "Lead",
    trigger_event: "create",
    condition_field: "",
    condition_operator: "equals",
    condition_value: "",
    action_type: "create_task",
    action_config: {
      email_to: "",
      email_subject: "",
      email_body: "",
      task_title: "",
      task_description: "",
      task_due_days: 1,
      update_field: "",
      update_value: ""
    }
  });

  // Dynamic field options based on entity
  const leadFields = [
    { value: 'lead_status', label: 'סטטוס ליד', values: ['New', 'Attempting Contact', 'Contacted - Qualifying', 'Sales Ready', 'Converted', 'Lost / Unqualified'] },
    { value: 'source_year', label: 'שנת מקור', values: ['2023', '2024', '2025'] },
    { value: 'age', label: 'גיל', type: 'number' },
    { value: 'city', label: 'עיר', type: 'text' },
    { value: 'estimated_property_value', label: 'שווי נכס משוער', type: 'number' },
    { value: 'lead_temperature', label: 'טמפרטורת ליד', values: ['Warm (חם)', 'Cold (קר)', 'Hot History (היה חם בעבר)'] }
  ];

  const opportunityFields = [
    { value: 'deal_stage', label: 'שלב עסקה', values: ['New (חדש)', 'Discovery Call (שיחת בירור צרכים)', 'Meeting Scheduled (נקבעת פגישה)', 'Documents Collection (איסוף מסמכים)', 'Request Sent to Harel (בקשה נשלחה להראל)', 'Closed Won (נחתם - בהצלחה)', 'Closed Lost (אבוד)'] },
    { value: 'product_type', label: 'סוג מוצר', values: ['Reverse Mortgage', 'Savings/Insurance', 'Loan', 'Other'] },
    { value: 'probability', label: 'הסתברות', type: 'number' },
    { value: 'property_value', label: 'שווי נכס', type: 'number' },
    { value: 'loan_amount_requested', label: 'סכום מבוקש', type: 'number' }
  ];

  const availableFields = formData.trigger_entity === 'Lead' ? leadFields : opportunityFields;
  const selectedField = availableFields.find(f => f.value === formData.condition_field);
  const needsOperatorValue = formData.condition_operator !== 'is_empty' && formData.condition_operator !== 'is_not_empty';

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
      setFormData((prev) => ({
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
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none h-20 text-sm rounded-xl focus:ring-2 focus:ring-red-900 focus:bg-slate-800 transition-all" />

                        </div>
                        <Button
              type="button"
              onClick={generateWithAI}
              disabled={isGenerating || !aiPrompt}
              className="h-20 w-32 bg-red-700 text-white hover:bg-red-800 hover:scale-105 transition-all font-bold shadow-lg rounded-xl shrink-0 border-none">

                            {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> :
              <div className="flex flex-col items-center gap-1">
                                    <Sparkles className="w-5 h-5" />
                                    <span>צור חוק</span>
                                </div>
              }
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label>שם החוק</Label>
                <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="לדוגמה: משימת מעקב לליד חדש"
          required />

            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>ישות מפעילה</Label>
                    <Select value={formData.trigger_entity} onValueChange={(v) => setFormData({ ...formData, trigger_entity: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Lead">ליד</SelectItem>
                            <SelectItem value="Opportunity">הזדמנות</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>אירוע</Label>
                    <Select value={formData.trigger_event} onValueChange={(v) => setFormData({ ...formData, trigger_event: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="create">יצירה חדשה</SelectItem>
                            <SelectItem value="update">עדכון</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>שדה לתנאי (אופציונלי)</Label>
                        <Select value={formData.condition_field} onValueChange={(v) => setFormData({ ...formData, condition_field: v, condition_value: '' })}>
                            <SelectTrigger><SelectValue placeholder="בחר שדה..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={null}>ללא תנאי</SelectItem>
                                {availableFields.map(field => (
                                    <SelectItem key={field.value} value={field.value}>{field.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>אופרטור</Label>
                        <Select value={formData.condition_operator} onValueChange={(v) => setFormData({ ...formData, condition_operator: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="equals">שווה ל</SelectItem>
                                <SelectItem value="not_equals">שונה מ</SelectItem>
                                <SelectItem value="contains">מכיל</SelectItem>
                                <SelectItem value="greater_than">גדול מ</SelectItem>
                                <SelectItem value="less_than">קטן מ</SelectItem>
                                <SelectItem value="is_empty">ריק</SelectItem>
                                <SelectItem value="is_not_empty">לא ריק</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>ערך לתנאי</Label>
                        {selectedField?.values && needsOperatorValue ? (
                            <Select value={formData.condition_value} onValueChange={(v) => setFormData({ ...formData, condition_value: v })}>
                                <SelectTrigger><SelectValue placeholder="בחר ערך..." /></SelectTrigger>
                                <SelectContent>
                                    {selectedField.values.map(val => (
                                        <SelectItem key={val} value={val}>{val}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Input
                                value={formData.condition_value}
                                onChange={(e) => setFormData({ ...formData, condition_value: e.target.value })}
                                placeholder={selectedField?.type === 'number' ? 'הכנס מספר' : 'הכנס ערך'}
                                type={selectedField?.type === 'number' ? 'number' : 'text'}
                                disabled={!needsOperatorValue} />
                        )}
                    </div>
                </div>
            </div>

            <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                    <Label>פעולה לביצוע</Label>
                    <Select value={formData.action_type} onValueChange={(v) => setFormData({ ...formData, action_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="create_task">יצירת משימה</SelectItem>
                            <SelectItem value="send_email">שליחת אימייל</SelectItem>
                            <SelectItem value="update_entity">עדכון ישות</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {formData.action_type === 'create_task' ?
        <div className="space-y-3 bg-slate-100 p-3 rounded">
                         <div className="space-y-2">
                            <Label>כותרת משימה</Label>
                            <Input
              value={formData.action_config.task_title}
              onChange={(e) => setFormData({ ...formData, action_config: { ...formData.action_config, task_title: e.target.value } })}
              placeholder="השתמש ב-{{full_name}} לשילוב שם" />

                        </div>
                        <div className="space-y-2">
                            <Label>תיאור</Label>
                            <Input
              value={formData.action_config.task_description}
              onChange={(e) => setFormData({ ...formData, action_config: { ...formData.action_config, task_description: e.target.value } })} />

                        </div>
                    </div> : formData.action_type === 'send_email' ?

        <div className="space-y-3 bg-slate-100 p-3 rounded">
                        <div className="space-y-2">
                            <Label>שלח אל</Label>
                            <Input
              value={formData.action_config.email_to}
              onChange={(e) => setFormData({ ...formData, action_config: { ...formData.action_config, email_to: e.target.value } })}
              placeholder="כתובת מייל או {{email}}" />

                        </div>
                        <div className="space-y-2">
                            <Label>נושא</Label>
                            <Input
              value={formData.action_config.email_subject}
              onChange={(e) => setFormData({ ...formData, action_config: { ...formData.action_config, email_subject: e.target.value } })} />

                        </div>
                        <div className="space-y-2">
                            <Label>תוכן</Label>
                            <Input
              value={formData.action_config.email_body}
              onChange={(e) => setFormData({ ...formData, action_config: { ...formData.action_config, email_body: e.target.value } })} />

                        </div>
                    </div> :
        
        <div className="space-y-3 bg-slate-100 p-3 rounded">
                        <div className="space-y-2">
                            <Label>שדה לעדכון</Label>
                            <Input
              value={formData.action_config.update_field}
              onChange={(e) => setFormData({ ...formData, action_config: { ...formData.action_config, update_field: e.target.value } })}
              placeholder="למשל: lead_status" />

                        </div>
                        <div className="space-y-2">
                            <Label>ערך חדש</Label>
                            <Input
              value={formData.action_config.update_value}
              onChange={(e) => setFormData({ ...formData, action_config: { ...formData.action_config, update_value: e.target.value } })}
              placeholder="למשל: Sales Ready" />

                        </div>
                    </div>
        }
            </div>

            <Button type="submit" className="w-full bg-red-700 hover:bg-red-800 text-white font-bold mt-4" disabled={createRule.isPending}>
                {createRule.isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                שמור חוק
            </Button>
        </form>);

}