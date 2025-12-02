import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Loader2, Briefcase } from "lucide-react";

export default function OpportunityForm({ opportunity, initialLead, onSubmit, onCancel, isSubmitting, title }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: opportunity || {
      lead_id: initialLead?.id || "",
      lead_name: initialLead?.full_name || "",
      product_type: "Reverse Mortgage",
      property_value: "",
      loan_amount_requested: "",
      deal_stage: "Discovery Call (שיחת בירור צרכים)",
      probability: 20,
      expected_close_date: "",
      next_task: ""
    }
  });

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