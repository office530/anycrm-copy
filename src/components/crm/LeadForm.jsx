import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Loader2, Activity, User, ClipboardList } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActivityLog from "./ActivityLog";
import DiscoveryScript from "./DiscoveryScript";

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
      notes: "",
      marital_status: "Married",
      estimated_property_value: "",
      existing_mortgage_balance: "",
      has_children: true,
      lead_temperature: ""
    }
  });

  const leadStatus = watch("lead_status");
  const lastContactDate = watch("last_contact_date");
  const originalStatusColor = watch("original_status_color");

  // Calculate Lead Temperature
  React.useEffect(() => {
    let temp = "Cold (קר)";
    const daysSinceContact = lastContactDate 
      ? Math.floor((new Date() - new Date(lastContactDate)) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceContact <= 30) {
      temp = "Warm (חם)";
    } else if (originalStatusColor === "Green") {
      temp = "Hot History (היה חם בעבר)";
    }

    setValue("lead_temperature", temp);
  }, [lastContactDate, originalStatusColor, setValue]);

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
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-slate-800">
          {lead ? "תיק לקוח" : "הוספת ליד חדש"}
        </h2>
        <p className="text-slate-500">ניהול פרטים ופעילויות</p>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            פרטי ליד
          </TabsTrigger>
          <TabsTrigger value="discovery" className="flex items-center gap-2" disabled={!lead}>
            <ClipboardList className="w-4 h-4" />
            תסריט שיחה
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2" disabled={!lead}>
            <Activity className="w-4 h-4" />
            תיעוד פעילות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
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

          <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6 mt-2">
             <div className="space-y-2">
              <Label>מצב משפחתי</Label>
              <Select 
                defaultValue={lead?.marital_status || "Married"} 
                onValueChange={(val) => handleSelectChange("marital_status", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Married">נשוי/אה (Married)</SelectItem>
                  <SelectItem value="Widowed">אלמן/ה (Widowed)</SelectItem>
                  <SelectItem value="Divorced">גרוש/ה (Divorced)</SelectItem>
                  <SelectItem value="Single">רווק/ה (Single)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
               <div className="flex items-center gap-2">
                 <Label>יש ילדים?</Label>
                 <input 
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    {...register("has_children")} 
                 />
               </div>
            </div>

            <div className="space-y-2">
              <Label>שווי נכס מוערך (₪)</Label>
              <Input 
                type="number" 
                {...register("estimated_property_value", { valueAsNumber: true })} 
                placeholder="0.00" 
              />
            </div>

            <div className="space-y-2">
              <Label>יתרת משכנתא קיימת (₪)</Label>
              <Input 
                type="number" 
                {...register("existing_mortgage_balance", { valueAsNumber: true })} 
                placeholder="0.00" 
              />
            </div>
             
             <div className="space-y-2">
               <Label>טמפרטורת ליד (מחושב)</Label>
               <div className={`p-2 rounded border text-center font-bold ${
                 watch("lead_temperature")?.includes("Warm") ? "bg-orange-100 text-orange-800 border-orange-200" :
                 watch("lead_temperature")?.includes("Hot") ? "bg-green-100 text-green-800 border-green-200" :
                 "bg-blue-50 text-blue-800 border-blue-100"
               }`}>
                 {watch("lead_temperature") || "מחשב..."}
               </div>
             </div>
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
        </TabsContent>

        <TabsContent value="discovery">
          {lead ? (
            <div className="h-[600px] overflow-y-auto pr-2">
              <DiscoveryScript leadId={lead.id} />
            </div>
          ) : (
            <div className="text-center py-10 text-slate-500">
              יש לשמור את הליד לפני שניתן למלא תסריט שיחה
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="h-[600px]">
          {lead ? (
            <ActivityLog leadId={lead.id} />
          ) : (
            <div className="text-center py-10 text-slate-500">
              יש לשמור את הליד לפני שניתן להוסיף פעילויות
            </div>
          )}
        </TabsContent>
        </Tabs>
        </motion.div>
  );
}