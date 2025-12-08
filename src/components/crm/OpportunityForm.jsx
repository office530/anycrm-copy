import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Loader2, Briefcase, Sparkles, MessageSquare, BrainCircuit, Activity, FileText, User, CheckSquare, AlertCircle, X } from "lucide-react";
import { useSettings } from "@/components/context/SettingsContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActivityLog from "./ActivityLog";
import { base44 } from "@/api/base44Client";
import FileUpload from "../common/FileUpload";
import { useQuery } from "@tanstack/react-query";
import LeadSelector from "./LeadSelector";
import RelatedTasks from "./RelatedTasks";

export default function OpportunityForm({ opportunity, initialLead, onSubmit, onCancel, isSubmitting, title }) {
  const { pipelineStages, theme } = useSettings();
  const [aiLoading, setAiLoading] = React.useState(false);
  
  // Conversion State
  const [transferSettings, setTransferSettings] = React.useState({
    contactDetails: true,
    propertyDetails: true,
    createTask: false
  });
  
  const [selectedLead, setSelectedLead] = React.useState(initialLead || null);

  const { register, handleSubmit, setValue, watch, getValues, reset, formState: { errors } } = useForm({
    defaultValues: opportunity || {
      lead_id: initialLead?.id || "",
      lead_name: initialLead?.full_name || "",
      phone_number: initialLead?.phone_number || "",
      email: initialLead?.email || "",
      product_type: "Reverse Mortgage",
      property_value: initialLead?.estimated_property_value || "",
      loan_amount_requested: "",
      deal_stage: "New (חדש)",
      probability: 20,
      expected_close_date: "",
      next_task: "",
      main_pain_point: "",
      current_objection: "",
      ai_sales_strategy: "",
      ai_objection_handler: "",
      documents: [],
      checklist_completed: []
    }
  });

  const currentStage = watch("deal_stage");
  const checklistCompleted = watch("checklist_completed") || [];
  
  const activeStageConfig = pipelineStages?.find(s => s.id === currentStage);
  const stageChecklist = activeStageConfig?.checklist || [];

  const toggleChecklistItem = (itemId) => {
    const current = checklistCompleted;
    const exists = current.includes(itemId);
    if (exists) {
      setValue("checklist_completed", current.filter(id => id !== itemId));
    } else {
      setValue("checklist_completed", [...current, itemId]);
    }
  };

  const leadId = opportunity?.lead_id || selectedLead?.id;

  const { data: originalLeadData, isLoading: isLoadingLead } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => base44.entities.Lead.list().then((leads) => leads.find((l) => l.id === leadId)),
    enabled: !!leadId
  });
  
  // Handler for Lead Selection
  const handleLeadSelect = (lead) => {
      setSelectedLead(lead);
      setValue("lead_id", lead.id);
      setValue("lead_name", lead.full_name);
      setValue("phone_number", lead.phone_number);
      setValue("email", lead.email);
      
      // Auto populate property value if setting is on or default behavior
      setValue("property_value", lead.estimated_property_value || "");
  };

  // Update form values when checkboxes change
  React.useEffect(() => {
    if (!selectedLead) return;

    if (transferSettings.propertyDetails) {
      setValue("property_value", selectedLead.estimated_property_value || "");
    } else {
      setValue("property_value", ""); // Clear if unchecked
    }

    // You could add more fields here based on the checkboxes
  }, [transferSettings, initialLead, setValue]);

  const handleFormSubmit = (data) => {
    // Pass the task creation flag along with the data
    onSubmit({
      ...data,
      _createTask: transferSettings.createTask,
      _leadName: initialLead?.full_name // Helper for task title
    });
  };

  const generateAiInsights = async () => {
    setAiLoading(true);
    try {
      const values = getValues();
      const leadData = initialLead || {}; // In a real app, might need to fetch lead if not passed

      // Strategy Prompt
      const strategyPrompt = `
        Act as an expert Israeli insurance agent consultant.
        Analyze this lead:
        - Age: ${leadData.age || 'Unknown'}
        - Marital Status: ${leadData.marital_status || 'Unknown'}
        - Property Value: ${values.property_value || leadData.estimated_property_value || 'Unknown'} NIS
        - Product Interest: ${values.product_type}
        
        Rules:
        - IF Age > 70 AND Property > 2.5M NIS -> Suggest "Living Inheritance Strategy (ירושה חיה) - Focus on helping children now."
        - IF Age > 65 AND Widowed -> Suggest "Income Supplement Strategy (השלמת הכנסה בכבוד)."
        - IF Product = Savings/Insurance AND Age > 60 -> Suggest "Tax Amendment 190 (תיקון 190) - Focus on tax benefits."
        - ELSE -> Provide a general tailored strategy based on the data.
        
        Output in Hebrew only. Be concise.
      `;

      // Objection Prompt
      const objectionPrompt = `
        Act as an expert Israeli sales trainer.
        Handle this objection: "${values.current_objection}"
        
        Context: Selling Reverse Mortgages/Insurance to seniors in Israel.
        
        Rules:
        - Provide a short, empathetic, professional counter-argument.
        - Example tone: "True, interest is high, but your property value increased more..."
        - Output in Hebrew only.
      `;

      // Execute in parallel
      const [strategyRes, objectionRes] = await Promise.all([
      base44.integrations.Core.InvokeLLM({ prompt: strategyPrompt }),
      values.current_objection ? base44.integrations.Core.InvokeLLM({ prompt: objectionPrompt }) : Promise.resolve({ output: "" })]
      );

      setValue("ai_sales_strategy", typeof strategyRes === 'string' ? strategyRes : strategyRes.output);
      if (values.current_objection) {
        setValue("ai_objection_handler", typeof objectionRes === 'string' ? objectionRes : objectionRes.output);
      }

    } catch (error) {
      console.error("AI Generation failed:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSelectChange = (field, value) => {
    setValue(field, value);
  };

  const inputClass = `bg-transparent border ${theme === 'dark' ? 'border-slate-700 text-white placeholder:text-slate-500' : 'border-slate-200 text-slate-900 placeholder:text-slate-400'}`;
  const labelClass = `text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`;
  const sectionBg = theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl shadow-xl border flex flex-col max-h-[80vh] w-[95vw] md:w-full mx-auto overflow-hidden ${
        theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
      }`}
      dir="rtl">

      <div className={`p-4 md:p-6 border-b shrink-0 flex items-center justify-between z-10 ${
        theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
            <Briefcase className={`w-6 h-6 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
              {title || (opportunity ? "ניהול הזדמנות" : "הזדמנות חדשה")}
            </h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-600'}`}>
              {selectedLead ? `עבור לקוח: ${selectedLead.full_name}` : "ניהול פרטי עסקה"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className={theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-600'}>
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="overflow-y-auto p-4 md:p-6 flex-1">
      
      {/* Lead Selector if no lead linked */}
      {!selectedLead && !opportunity?.lead_id && (
          <LeadSelector onSelect={handleLeadSelect} />
      )}
      
      {/* Hidden validation input for lead_id */}
      <input 
          type="hidden" 
          {...register("lead_id", { required: "חובה לשייך ליד לעסקה" })} 
      />
      {errors.lead_id && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errors.lead_id.message}
          </div>
      )}

      {selectedLead &&
      <div className={`mb-6 border rounded-lg p-4 space-y-3 ${
        theme === 'dark' ? 'bg-emerald-900/20 border-emerald-800/50' : 'bg-emerald-50 border-emerald-100'
      }`}>
            <h3 className={`font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-800'}`}>
                <Sparkles className="w-4 h-4" />
                הגדרות המרה מהירה
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className={`flex items-center gap-2 text-sm cursor-pointer ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    <input
              type="checkbox"
              checked={transferSettings.contactDetails}
              onChange={(e) => setTransferSettings({ ...transferSettings, contactDetails: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500" />

                    העבר פרטי קשר
                </label>
                <label className={`flex items-center gap-2 text-sm cursor-pointer ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    <input
              type="checkbox"
              checked={transferSettings.propertyDetails}
              onChange={(e) => setTransferSettings({ ...transferSettings, propertyDetails: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500" />

                    העבר נתוני נכס (שווי)
                </label>
                <label className={`flex items-center gap-2 text-sm cursor-pointer font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    <input
              type="checkbox"
              checked={transferSettings.createTask}
              onChange={(e) => setTransferSettings({ ...transferSettings, createTask: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500" />

                    צור משימת מעקב אוטומטית
                </label>
            </div>
        </div>
      }

      <Tabs defaultValue="details" className="w-full">
        <TabsList className={`grid w-full grid-cols-2 md:grid-cols-5 mb-6 ${theme === 'dark' ? 'bg-slate-900/50' : ''}`}>
          <TabsTrigger value="details" className={`flex items-center gap-2 ${theme === 'dark' ? 'data-[state=active]:bg-slate-700 data-[state=active]:text-white' : ''}`}>
            <FileText className="w-4 h-4" />
            פרטי עסקה
          </TabsTrigger>
          <TabsTrigger value="documents" className={`flex items-center gap-2 ${theme === 'dark' ? 'data-[state=active]:bg-slate-700 data-[state=active]:text-white' : ''}`}>
            <Briefcase className="w-4 h-4" />
            מסמכים
          </TabsTrigger>
          <TabsTrigger value="originalLead" className={`flex items-center gap-2 ${theme === 'dark' ? 'data-[state=active]:bg-slate-700 data-[state=active]:text-white' : ''}`} disabled={!opportunity?.lead_id && !initialLead?.id}>
            <User className="w-4 h-4" />
            פרטי ליד מקורי
          </TabsTrigger>
          <TabsTrigger value="activity" className={`flex items-center gap-2 ${theme === 'dark' ? 'data-[state=active]:bg-slate-700 data-[state=active]:text-white' : ''}`} disabled={!opportunity?.lead_id && !initialLead?.id}>
            <Activity className="w-4 h-4" />
            תיעוד פעילות
          </TabsTrigger>
          <TabsTrigger value="tasks" className={`flex items-center gap-2 ${theme === 'dark' ? 'data-[state=active]:bg-slate-700 data-[state=active]:text-white' : ''}`} disabled={!opportunity?.id}>
            <CheckSquare className="w-4 h-4" />
            משימות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Hidden fields for linking */}
        <input type="hidden" {...register("lead_name")} />

        {/* Checklist Section */}
        {stageChecklist.length > 0 && (
            <div className={`rounded-xl p-4 mb-6 border ${theme === 'dark' ? 'bg-blue-900/20 border-blue-800/50' : 'bg-blue-50 border-blue-100'}`}>
                <h3 className={`font-bold text-sm flex items-center gap-2 mb-3 ${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>
                    <CheckSquare className="w-4 h-4" />
                    צ'ק-ליסט לשלב: {activeStageConfig?.label}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {stageChecklist.map(item => {
                        const isChecked = checklistCompleted.includes(item.id);
                        const checkedClass = theme === 'dark' 
                          ? 'bg-slate-800 border-blue-500/50 text-blue-300' 
                          : 'bg-white border-blue-200 text-slate-900 shadow-sm';
                        const uncheckedClass = theme === 'dark'
                          ? 'bg-transparent border-transparent hover:bg-slate-800/50'
                          : 'bg-transparent border-transparent hover:bg-blue-100/50';

                        return (
                            <label key={item.id} className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer border ${isChecked ? checkedClass : uncheckedClass}`}>
                                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                                  isChecked 
                                    ? 'bg-blue-600 border-blue-600 text-white' 
                                    : theme === 'dark' ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-300'
                                }`}>
                                    {isChecked && <CheckSquare className="w-3.5 h-3.5" />}
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="hidden"
                                    checked={isChecked}
                                    onChange={() => toggleChecklistItem(item.id)}
                                />
                                <span className={`text-sm ${isChecked ? (theme === 'dark' ? 'text-blue-300 font-medium' : 'text-slate-900 font-medium') : (theme === 'dark' ? 'text-slate-400' : 'text-slate-600')}`}>{item.text}</span>
                            </label>
                        );
                    })}
                </div>
                <div className={`mt-3 pt-3 border-t flex items-center gap-2 text-xs ${theme === 'dark' ? 'border-blue-800/30 text-blue-400' : 'border-blue-100 text-blue-600'}`}>
                    <AlertCircle className="w-3 h-3" />
                    <span>השלמת המשימות תסייע בקידום העסקה לשלב הבא</span>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Phone and Email removed as they appear in Original Lead Details */}

          <div className="space-y-2">
            <Label className={labelClass}>סוג מוצר</Label>
            <Select
                  defaultValue={opportunity?.product_type || "Reverse Mortgage"}
                  onValueChange={(val) => handleSelectChange("product_type", val)}>

              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="בחר מוצר" />
              </SelectTrigger>
              <SelectContent className={theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : ''}>
                <SelectItem value="Reverse Mortgage">משכנתא הפוכה</SelectItem>
                <SelectItem value="Savings/Insurance">חיסכון / ביטוח</SelectItem>
                <SelectItem value="Loan">הלוואה</SelectItem>
                <SelectItem value="Other">אחר</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className={labelClass}>שלב בעסקה</Label>
            <Select
                  defaultValue={opportunity?.deal_stage || "Discovery Call (שיחת בירור צרכים)"}
                  onValueChange={(val) => handleSelectChange("deal_stage", val)}>

              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="בחר שלב" />
              </SelectTrigger>
              <SelectContent className={theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : ''}>
                {(pipelineStages || []).map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className={labelClass}>שווי נכס (₪)</Label>
            <Input
                  type="number"
                  {...register("property_value", { valueAsNumber: true })}
                  placeholder="0.00"
                  className={inputClass} />

          </div>

          <div className="space-y-2">
            <Label className={labelClass}>סכום הלוואה מבוקש (₪)</Label>
            <Input
                  type="number"
                  {...register("loan_amount_requested", { valueAsNumber: true })}
                  placeholder="0.00"
                  className={inputClass} />

          </div>

          <div className="space-y-2">
            <Label className={labelClass}>הסתברות סגירה (%)</Label>
            <Input
                  type="number"
                  min="0" max="100"
                  {...register("probability", { valueAsNumber: true })}
                  className={inputClass} />

          </div>

          <div className="space-y-2">
            <Label className={labelClass}>תאריך סגירה צפוי</Label>
            <Input type="date" {...register("expected_close_date")} className={inputClass} />
          </div>
        </div>

        <div className="space-y-2">
          <Label className={labelClass}>משימה הבאה</Label>
          <Input {...register("next_task")} placeholder="לדוגמה: לחזור ללקוח עם תשובה מהבנק..." className={inputClass} />
        </div>

        {/* Sales Strategy Section */}
        <div className={`p-4 rounded-lg border space-y-4 ${sectionBg}`}>
        <h3 className={`font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>
          <Sparkles className="w-4 h-4 text-purple-500" />
          אסטרטגיית מכירה
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className={labelClass}>כאב מרכזי (Pain Point)</Label>
            <Select
                    defaultValue={opportunity?.main_pain_point}
                    onValueChange={(val) => handleSelectChange("main_pain_point", val)}>

              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="בחר צורך מרכזי" />
              </SelectTrigger>
              <SelectContent className={theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : ''}>
                <SelectItem value="Help Children Buy Apartment (עזרה לילדים לדירה)">עזרה לילדים לדירה</SelectItem>
                <SelectItem value="Supplement Monthly Income (השלמת הכנסה חודשית)">השלמת הכנסה חודשית</SelectItem>
                <SelectItem value="Cover Medical Expenses (הוצאות רפואיות)">הוצאות רפואיות</SelectItem>
                <SelectItem value="Debt Consolidation (סגירת חובות/מינוס)">סגירת חובות / מינוס</SelectItem>
                <SelectItem value="Tax Savings/Amendment 190 (חיסכון מס/תיקון 190)">חיסכון מס / תיקון 190</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className={labelClass}>התנגדות נוכחית</Label>
            <Input {...register("current_objection")} placeholder="מה הלקוח אומר? (למשל: הריבית גבוהה)" className={inputClass} />
          </div>
        </div>

        {/* AI Section */}
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <Label className={`font-medium flex items-center gap-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-700'}`}>
              <BrainCircuit className="w-4 h-4" />
              המוח המלאכותי (AI Consultant)
            </Label>
            <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={generateAiInsights}
                    disabled={aiLoading} className={`px-3 text-xs font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors border shadow-sm w-full md:w-auto ${
                      theme === 'dark' 
                        ? 'bg-purple-900/20 text-purple-300 border-purple-800 hover:bg-purple-900/40' 
                        : 'bg-slate-50 text-purple-600 border-purple-200 hover:bg-purple-50'
                    }`}>


              {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
              צור תובנות AI
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-600'}`}>אסטרטגיה מומלצת</Label>
              <div className="relative">
                <textarea
                        readOnly
                        {...register("ai_sales_strategy")}
                        className={`w-full min-h-[80px] p-3 rounded-md border text-sm focus:outline-none resize-none ${
                          theme === 'dark' 
                            ? 'bg-slate-900/50 border-slate-700 text-slate-300 placeholder:text-slate-600' 
                            : 'bg-purple-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                        }`}
                        placeholder="לחץ על 'צור תובנות' לקבלת אסטרטגיה..." />

              </div>
            </div>

            <div className="space-y-2">
              <Label className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-600'}`}>מענה להתנגדות</Label>
              <div className="relative">
                <textarea
                        readOnly
                        {...register("ai_objection_handler")}
                        className={`w-full min-h-[80px] p-3 rounded-md border text-sm focus:outline-none resize-none ${
                          theme === 'dark' 
                            ? 'bg-slate-900/50 border-slate-700 text-slate-300 placeholder:text-slate-600' 
                            : 'bg-purple-50/50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                        }`}
                        placeholder="המענה יופיע כאן..." />

              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>ביטול</Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
            שמור הזדמנות
          </Button>
        </div>
        </form>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <div className={`p-6 rounded-xl border ${sectionBg}`}>
            <FileUpload
              files={watch("documents") || []}
              onFilesChange={(newFiles) => setValue("documents", newFiles)}
              label="מסמכי עסקה" />

          </div>
          
          <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
             <Button type="button" variant="outline" onClick={onCancel} className={theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : ''}>ביטול</Button>
             <Button onClick={handleSubmit(handleFormSubmit)} className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
               {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
               שמור הזדמנות
             </Button>
          </div>
        </TabsContent>

        <TabsContent value="originalLead">
          {isLoadingLead ?
          <div className={`text-center py-10 ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-600'}`}><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> טוען פרטי ליד...</div> :
          originalLeadData ?
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl border ${sectionBg}`}>
              <div className="space-y-2">
                <Label className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-600'}`}>שם מלא</Label>
                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{originalLeadData.full_name}</p>
              </div>
              <div className="space-y-2">
                <Label className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-600'}`}>מספר טלפון</Label>
                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{originalLeadData.phone_number}</p>
              </div>
              {originalLeadData.email &&
            <div className="space-y-2">
                  <Label className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-600'}`}>אימייל</Label>
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{originalLeadData.email}</p>
                </div>
            }
              {originalLeadData.age &&
            <div className="space-y-2">
                  <Label className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-600'}`}>גיל</Label>
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{originalLeadData.age}</p>
                </div>
            }
              {originalLeadData.city &&
            <div className="space-y-2">
                  <Label className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-600'}`}>עיר</Label>
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{originalLeadData.city}</p>
                </div>
            }
              {originalLeadData.marital_status &&
            <div className="space-y-2">
                  <Label className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-600'}`}>מצב משפחתי</Label>
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{originalLeadData.marital_status}</p>
                </div>
            }
              {originalLeadData.estimated_property_value &&
            <div className="space-y-2">
                  <Label className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-600'}`}>שווי נכס מוערך (₪)</Label>
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-neutral-900'}`}>{originalLeadData.estimated_property_value.toLocaleString()}</p>
                </div>
            }
              {originalLeadData.notes &&
            <div className="space-y-2 md:col-span-2">
                  <Label className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-600'}`}>הערות</Label>
                  <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-neutral-900'} whitespace-pre-wrap`}>{originalLeadData.notes}</p>
                </div>
            }
            </div> :

          <div className={`text-center py-10 ${theme === 'dark' ? 'text-slate-400' : 'text-neutral-600'}`}>
              אין פרטי ליד מקוריים זמינים עבור הזדמנות זו.
            </div>
          }
          <div className="flex justify-end gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button type="button" variant="outline" onClick={onCancel} className={theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : ''}>ביטול</Button>
            <Button onClick={handleSubmit(handleFormSubmit)} className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              שמור הזדמנות
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="h-[600px]">
        {opportunity?.lead_id || initialLead?.id ?
          <ActivityLog leadId={opportunity?.lead_id || initialLead?.id} opportunityId={opportunity?.id} /> :

          <div className="text-center py-10 text-neutral-600">
          יש לשמור את ההזדמנות לפני שניתן להוסיף פעילויות
        </div>
          }
        </TabsContent>

        <TabsContent value="tasks" className="h-[600px]">
           {opportunity?.id ? 
              <RelatedTasks opportunityId={opportunity.id} leadId={opportunity.lead_id} /> : 
              <div className="text-center py-10 text-neutral-600">יש לשמור את ההזדמנות תחילה</div>
           }
        </TabsContent>
        </Tabs>
        </div>
        </motion.div>);

}