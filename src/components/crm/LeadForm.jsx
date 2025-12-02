import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function LeadForm({ lead, onSubmit, onCancel, isSubmitting }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: lead || {
      full_name: "",
      phone_number: "",
      age: "",
      city: "",
      source_year: "2024",
      original_status_color: "Green",
      lead_status: "New",
      last_contact_date: new Date().toISOString().split('T')[0],
      notes: ""
    }
  });

  const leadStatus = watch("lead_status");

  const handleSelectChange = (field, value) => {
    setValue(field, value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-xl shadow-lg border border-slate-100"
      dir="rtl"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          {lead ? "עריכת ליד" : "הוספת ליד חדש"}
        </h2>
        <p className="text-slate-500">הזן את פרטי הלקוח למטה</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>שם מלא *</Label>
            <Input {...register("full_name", { required: "שדה חובה" })} placeholder="לדוגמה: דוד כהן" />
            {errors.full_name && <span className="text-red-500 text-sm">{errors.full_name.message}</span>}
          </div>
          
          <div className="space-y-2">
            <Label>מספר טלפון *</Label>
            <Input {...register("phone_number", { required: "שדה חובה" })} placeholder="050-0000000" />
          </div>

          <div className="space-y-2">
            <Label>גיל</Label>
            <Input type="number" {...register("age", { valueAsNumber: true })} placeholder="לדוגמה: 68" />
          </div>

          <div className="space-y-2">
            <Label>עיר</Label>
            <Input {...register("city")} placeholder="לדוגמה: תל אביב" />
          </div>

          <div className="space-y-2">
            <Label>שנת מקור</Label>
            <Select 
              defaultValue={lead?.source_year || "2024"} 
              onValueChange={(val) => handleSelectChange("source_year", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר שנה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>סטטוס מקורי (צבע)</Label>
            <Select 
              defaultValue={lead?.original_status_color || "Green"} 
              onValueChange={(val) => handleSelectChange("original_status_color", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר צבע" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Green">ירוק (Green)</SelectItem>
                <SelectItem value="Red">אדום (Red)</SelectItem>
                <SelectItem value="Yellow">צהוב (Yellow)</SelectItem>
                <SelectItem value="Orange">כתום (Orange)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>סטטוס ליד</Label>
            <Select 
              defaultValue={lead?.lead_status || "New"} 
              onValueChange={(val) => handleSelectChange("lead_status", val)}
            >
              <SelectTrigger className={leadStatus === 'Converted to Opportunity' ? 'border-emerald-500 text-emerald-700 bg-emerald-50' : ''}>
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New">חדש (New)</SelectItem>
                <SelectItem value="Contact Attempt 1">ניסיון יצירת קשר 1</SelectItem>
                <SelectItem value="Contact Attempt 2">ניסיון יצירת קשר 2</SelectItem>
                <SelectItem value="Nurturing">טיפוח (Nurturing)</SelectItem>
                <SelectItem value="Unqualified">לא רלוונטי (Unqualified)</SelectItem>
                <SelectItem value="Converted to Opportunity" className="text-emerald-600 font-bold">הומר להזדמנות (Converted)</SelectItem>
              </SelectContent>
            </Select>
            {leadStatus === 'Converted to Opportunity' && (
              <p className="text-xs text-emerald-600 font-medium mt-1">
                ✨ שמירה תוביל לפתיחת הזדמנות חדשה
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>תאריך יצירת קשר אחרון</Label>
            <Input type="date" {...register("last_contact_date")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>הערות</Label>
          <Textarea {...register("notes")} placeholder="הערות חשובות..." className="h-24" />
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>ביטול</Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
            {lead ? "עדכן ליד" : "צור ליד"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}