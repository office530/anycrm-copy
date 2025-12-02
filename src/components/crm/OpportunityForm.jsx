import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Loader2, Briefcase, Sparkles, MessageSquare, BrainCircuit } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function OpportunityForm({ opportunity, initialLead, onSubmit, onCancel, isSubmitting, title }) {
  const [aiLoading, setAiLoading] = React.useState(false);
  
  const { register, handleSubmit, setValue, watch, getValues, formState: { errors } } = useForm({
    defaultValues: opportunity || {
      lead_id: initialLead?.id || "",
      lead_name: initialLead?.full_name || "",
      product_type: "Reverse Mortgage",
      property_value: initialLead?.estimated_property_value || "",
      loan_amount_requested: "",
      deal_stage: "Discovery Call (שיחת בירור צרכים)",
      probability: 20,
      expected_close_date: "",
      next_task: "",
      main_pain_point: "",
      current_objection: "",
      ai_sales_strategy: "",
      ai_objection_handler: ""
    }
  });

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
        values.current_objection ? base44.integrations.Core.InvokeLLM({ prompt: objectionPrompt }) : Promise.resolve({ output: "" })
      ]);

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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white p-6 rounded-xl shadow-xl border border-slate-100"
      dir="rtl"
    >
      <div className="mb-6 flex items-center gap-3 border-b pb-4">
        <div className="bg-blue-100 p-2 rounded-full">
          <Briefcase className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {title || (opportunity ? "עריכת הזדמנות" : "הזדמנות חדשה")}
          </h2>
          <p className="text-slate-500 text-sm">
            {initialLead ? `עבור לקוח: ${initialLead.full_name}` : "ניהול פרטי עסקה"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Hidden fields for linking */}
        <input type="hidden" {...register("lead_id")} />
        <input type="hidden" {...register("lead_name")} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="space-y-2">
            <Label>סוג מוצר</Label>
            <Select 
              defaultValue={opportunity?.product_type || "Reverse Mortgage"} 
              onValueChange={(val) => handleSelectChange("product_type", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר מוצר" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Reverse Mortgage">משכנתא הפוכה</SelectItem>
                <SelectItem value="Savings/Insurance">חיסכון / ביטוח</SelectItem>
                <SelectItem value="Loan">הלוואה</SelectItem>
                <SelectItem value="Other">אחר</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>שלב בעסקה</Label>
            <Select 
              defaultValue={opportunity?.deal_stage || "Discovery Call (שיחת בירור צרכים)"} 
              onValueChange={(val) => handleSelectChange("deal_stage", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר שלב" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Discovery Call (שיחת בירור צרכים)">שיחת בירור צרכים (Discovery)</SelectItem>
                <SelectItem value="Simulation Sent (נשלחה סימולציה)">נשלחה סימולציה</SelectItem>
                <SelectItem value="Negotiation (משא ומתן)">משא ומתן</SelectItem>
                <SelectItem value="Underwriting (חיתום/תהליך בבנק)">חיתום / תהליך בבנק</SelectItem>
                <SelectItem value="Closed Won (נחתם - בהצלחה)">נחתם - בהצלחה (Won)</SelectItem>
                <SelectItem value="Closed Lost (אבוד)">אבוד (Lost)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>שווי נכס (₪)</Label>
            <Input 
              type="number" 
              {...register("property_value", { valueAsNumber: true })} 
              placeholder="0.00" 
            />
          </div>

          <div className="space-y-2">
            <Label>סכום הלוואה מבוקש (₪)</Label>
            <Input 
              type="number" 
              {...register("loan_amount_requested", { valueAsNumber: true })} 
              placeholder="0.00" 
            />
          </div>

          <div className="space-y-2">
            <Label>הסתברות סגירה (%)</Label>
            <Input 
              type="number" 
              min="0" max="100"
              {...register("probability", { valueAsNumber: true })} 
            />
          </div>

          <div className="space-y-2">
            <Label>תאריך סגירה צפוי</Label>
            <Input type="date" {...register("expected_close_date")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>משימה הבאה</Label>
          <Input {...register("next_task")} placeholder="לדוגמה: לחזור ללקוח עם תשובה מהבנק..." />
        </div>
        </div>

        {/* Sales Strategy Section */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          אסטרטגיית מכירה
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>כאב מרכזי (Pain Point)</Label>
            <Select 
              defaultValue={opportunity?.main_pain_point} 
              onValueChange={(val) => handleSelectChange("main_pain_point", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר צורך מרכזי" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Help Children Buy Apartment (עזרה לילדים לדירה)">עזרה לילדים לדירה</SelectItem>
                <SelectItem value="Supplement Monthly Income (השלמת הכנסה חודשית)">השלמת הכנסה חודשית</SelectItem>
                <SelectItem value="Cover Medical Expenses (הוצאות רפואיות)">הוצאות רפואיות</SelectItem>
                <SelectItem value="Debt Consolidation (סגירת חובות/מינוס)">סגירת חובות / מינוס</SelectItem>
                <SelectItem value="Tax Savings/Amendment 190 (חיסכון מס/תיקון 190)">חיסכון מס / תיקון 190</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>התנגדות נוכחית</Label>
            <Input {...register("current_objection")} placeholder="מה הלקוח אומר? (למשל: הריבית גבוהה)" />
          </div>
        </div>

        {/* AI Section */}
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center">
            <Label className="text-purple-700 font-medium flex items-center gap-2">
              <BrainCircuit className="w-4 h-4" />
              המוח המלאכותי (AI Consultant)
            </Label>
            <Button 
              type="button" 
              size="sm" 
              variant="outline"
              onClick={generateAiInsights}
              disabled={aiLoading}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
              צור תובנות AI
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-slate-500">אסטרטגיה מומלצת</Label>
              <div className="relative">
                <textarea 
                  readOnly
                  {...register("ai_sales_strategy")}
                  className="w-full min-h-[80px] p-3 rounded-md border bg-purple-50/50 text-sm focus:outline-none resize-none"
                  placeholder="לחץ על 'צור תובנות' לקבלת אסטרטגיה..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-500">מענה להתנגדות</Label>
              <div className="relative">
                <textarea 
                  readOnly
                  {...register("ai_objection_handler")}
                  className="w-full min-h-[80px] p-3 rounded-md border bg-purple-50/50 text-sm focus:outline-none resize-none"
                  placeholder="המענה יופיע כאן..."
                />
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
    </motion.div>
  );
}