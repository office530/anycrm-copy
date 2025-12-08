import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Loader2, Activity, User, ClipboardList, FileText, Briefcase, Sparkles, CheckSquare, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useSettings } from "@/components/context/SettingsContext";
import ActivityLog from "./ActivityLog";
import DiscoveryScript from "./DiscoveryScript";
import FileUpload from "../common/FileUpload";
import TagManager from "./TagManager";
import LeadAiAnalysis from "./LeadAiAnalysis";
import LastTouchInfo from "./LastTouchInfo";
import QuickTaskCreator from "./QuickTaskCreator";
import RelatedTasks from "./RelatedTasks";

export default function LeadForm({ lead, onSaveAndClose, onSaveAndStay, onCancel, isSubmitting }) {
  const { theme } = useSettings();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: lead || {
    full_name: "",
    phone_number: "",
    email: "",
    documents: [],
    assigned_to: "", // Default empty
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
    spouse_age: "",
    lead_temperature: "",
    tags: []
    }
  });

  // Fetch linked opportunities if editing a lead
  const { data: opportunities } = useQuery({
    queryKey: ['lead_opportunities', lead?.id],
    queryFn: () => base44.entities.Opportunity.filter({ lead_id: lead.id }),
    enabled: !!lead?.id
  });

  // Fetch users for assignment
  const { data: users } = useQuery({
    queryKey: ['users_list'],
    queryFn: () => base44.entities.User.list(),
    initialData: []
  });

  const leadStatus = watch("lead_status");
  const lastContactDate = watch("last_contact_date");
  const originalStatusColor = watch("original_status_color");

  // Calculate Lead Temperature
  React.useEffect(() => {
    let temp = "Cold (קר)";
    const daysSinceContact = lastContactDate ?
    Math.floor((new Date() - new Date(lastContactDate)) / (1000 * 60 * 60 * 24)) :
    999;

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

  const handleSaveAndClose = (data) => {
    const sanitized = { ...data };
    const numberFields = ['age', 'spouse_age', 'estimated_property_value', 'existing_mortgage_balance'];
    numberFields.forEach((f) => {
      if (Number.isNaN(sanitized[f])) sanitized[f] = null;
    });
    onSaveAndClose(sanitized);
  };

  const handleSaveAndStay = (data) => {
    const sanitized = { ...data };
    const numberFields = ['age', 'spouse_age', 'estimated_property_value', 'existing_mortgage_balance'];
    numberFields.forEach((f) => {
      if (Number.isNaN(sanitized[f])) sanitized[f] = null;
    });
    onSaveAndStay(sanitized);
  };

  const onFormError = (formErrors) => {
    console.error("Validation Errors:", formErrors);
  };

  const labelClass = `font-semibold mb-1.5 block ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`;
  const inputClass = `font-medium placeholder:text-slate-400 focus:border-blue-500 ${
    theme === 'dark' 
      ? 'bg-slate-900 border-slate-700 text-white' 
      : 'bg-white border-slate-300 text-slate-900'
  }`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl shadow-lg border flex flex-col max-h-[80vh] w-[95vw] md:w-full mx-auto overflow-hidden ${
        theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
      }`}
      dir="rtl">

      <div className={`p-4 md:p-6 border-b shrink-0 z-10 flex justify-between items-start ${
        theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
      }`}>
        <div>
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {lead ? "תיק לקוח" : "הוספת ליד חדש"}
          </h2>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>ניהול פרטים ופעילויות</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className={`${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-400 hover:text-slate-600'}`}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="overflow-y-auto p-4 md:p-6 flex-1">
      <Tabs defaultValue="details" className="w-full">
        <TabsList className={`grid w-full grid-cols-3 md:grid-cols-7 mb-6 p-1 h-auto gap-1 ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-100/80'}`}>
          {['details', 'opportunities', 'activity', 'tasks', 'documents', 'discovery', 'ai'].map(tab => {
            const icons = { details: User, opportunities: Briefcase, activity: Activity, tasks: CheckSquare, documents: FileText, discovery: ClipboardList, ai: Sparkles };
            const labels = { details: 'פרופיל 360', opportunities: 'הזדמנויות', activity: 'פעילות', tasks: 'משימות', documents: 'מסמכים', discovery: 'תסריט', ai: 'ניתוח AI' };
            const Icon = icons[tab];
            const isDisabled = !lead && tab !== 'details' && tab !== 'documents';
            
            return (
              <TabsTrigger 
                key={tab} 
                value={tab} 
                disabled={isDisabled}
                className={`flex flex-col md:flex-row items-center gap-2 py-2 data-[state=active]:shadow-sm ${
                  theme === 'dark' 
                    ? 'data-[state=active]:bg-slate-700 data-[state=active]:text-cyan-400 text-slate-400' 
                    : tab === 'ai' ? 'data-[state=active]:bg-white data-[state=active]:text-purple-700' : 'data-[state=active]:bg-white data-[state=active]:text-red-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs md:text-sm">{labels[tab]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="details">
          <div className="space-y-6">
            {lead && <LastTouchInfo entity={lead} entityType="Lead" />}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                  <Label className={labelClass}>תגיות לקוח</Label>
                  <TagManager
                  tags={watch("tags") || []}
                  onChange={(newTags) => setValue("tags", newTags)} />

              </div>

              <div className="space-y-1">
                <Label className={labelClass}>שם מלא *</Label>
                <Input
                  {...register("full_name", { required: "שדה חובה" })}
                  placeholder="לדוגמה: דוד כהן"
                  className={inputClass} />

                {errors.full_name && <span className="text-red-500 text-sm font-medium">{errors.full_name.message}</span>}
              </div>
              
              <div className="space-y-1">
                <Label className={labelClass}>מספר טלפון *</Label>
                <Input
                  {...register("phone_number", {
                    required: "שדה חובה",
                    pattern: {
                      value: /^0[0-9]{1,2}-?[0-9]{7}$/,
                      message: "מספר טלפון לא תקין"
                    }
                  })}
                  placeholder="050-0000000"
                  className={inputClass} />

                {errors.phone_number && <span className="text-red-500 text-sm font-medium">{errors.phone_number.message}</span>}
              </div>

              <div className="space-y-1">
                <Label className={labelClass}>אימייל</Label>
                <Input
                  {...register("email", {
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "כתובת אימייל לא תקינה"
                    }
                  })}
                  placeholder="email@example.com"
                  className={inputClass} />

                {errors.email && <span className="text-red-500 text-sm font-medium">{errors.email.message}</span>}
              </div>

              <div className="space-y-1">
                <Label className={labelClass}>גיל</Label>
                <Input
                  type="number"
                  {...register("age", { valueAsNumber: true })}
                  placeholder="לדוגמה: 68"
                  className={inputClass} />

              </div>

              <div className="space-y-1">
                <Label className={labelClass}>עיר</Label>
                <Input
                  {...register("city")}
                  placeholder="לדוגמה: תל אביב"
                  className={inputClass} />

              </div>

              <div className="space-y-1">
                <Label className={labelClass}>שנת מקור</Label>
                <Select
                  defaultValue={lead?.source_year || "2024"}
                  onValueChange={(val) => handleSelectChange("source_year", val)}>

                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="בחר שנה" />
                  </SelectTrigger>
                  <SelectContent className={theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : ''}>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className={labelClass}>סטטוס ליד</Label>
                <Select
                  defaultValue={lead?.lead_status || "New"}
                  onValueChange={(val) => handleSelectChange("lead_status", val)}>

                  <SelectTrigger className={`${inputClass} ${leadStatus === 'Converted' ? (theme === 'dark' ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-emerald-50 border-emerald-500 text-emerald-700') : ''}`}>
                    <SelectValue placeholder="סטטוס" />
                  </SelectTrigger>
                  <SelectContent className={theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : ''}>
                    <SelectItem value="New">חדש (New)</SelectItem>
                    <SelectItem value="Attempting Contact">בטיפול - מנסה ליצור קשר</SelectItem>
                    <SelectItem value="Contacted - Qualifying">נוצר קשר - בירור צרכים</SelectItem>
                    <SelectItem value="Sales Ready">בשל להזדמנות / חם</SelectItem>
                    <SelectItem value="Lost / Unqualified">לא רלוונטי (סופי)</SelectItem>
                    <SelectItem value="Converted" className="text-emerald-600 font-bold">הומר להזדמנות (Converted)</SelectItem>
                  </SelectContent>
                </Select>
                {leadStatus === 'Converted' &&
                <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    שמירה תוביל לפתיחת הזדמנות חדשה
                  </p>
                }
              </div>

              <div className="space-y-1">
                <Label className={labelClass}>שיוך למשתמש</Label>
                <Select
                  defaultValue={lead?.assigned_to || ""}
                  onValueChange={(val) => handleSelectChange("assigned_to", val)}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="בחר משתמש אחראי" />
                  </SelectTrigger>
                  <SelectContent className={theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : ''}>
                    <SelectItem value="unassigned">ללא שיוך</SelectItem>
                    {users?.map(u => (
                      <SelectItem key={u.id} value={u.email}>{u.full_name || u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className={labelClass}>תאריך יצירת קשר אחרון</Label>
                <Input
                  type="date"
                  {...register("last_contact_date")}
                  className={inputClass} />

              </div>

              {/* Additional Details Section */}
              <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6 mt-2">
                 <div className="space-y-1">
                  <Label className={`${labelClass} text-right`}>מצב משפחתי</Label>
                  <Select
                    defaultValue={lead?.marital_status || "Married"}
                    onValueChange={(val) => handleSelectChange("marital_status", val)}>

                    <SelectTrigger className={`${inputClass} text-right`}>
                      <SelectValue placeholder="בחר סטטוס" />
                    </SelectTrigger>
                    <SelectContent className={`text-right ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : ''}`}>
                      <SelectItem value="Married">נשוי/אה (Married)</SelectItem>
                      <SelectItem value="Widowed">אלמן/ה (Widowed)</SelectItem>
                      <SelectItem value="Divorced">גרוש/ה (Divorced)</SelectItem>
                      <SelectItem value="Single">רווק/ה (Single)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                   <div className="flex items-center gap-2 mb-2">
                     <Label className="text-slate-900 font-semibold m-0">יש ילדים?</Label>
                     <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                      {...register("has_children")} />

                   </div>
                   <Input
                    type="number"
                    {...register("spouse_age", { valueAsNumber: true })}
                    placeholder="גיל בן/ת זוג (אם רלוונטי)"
                    className={inputClass} />

                </div>

                <div className="space-y-1">
                  <Label className={`${labelClass} text-right`}>שווי נכס מוערך (₪)</Label>
                  <Input
                    type="number"
                    {...register("estimated_property_value", { valueAsNumber: true })}
                    placeholder="0.00"
                    className={`${inputClass} text-right`} />

                </div>

                <div className="space-y-1">
                  <Label className={`${labelClass} text-right`}>יתרת משכנתא קיימת (₪)</Label>
                  <Input
                    type="number"
                    {...register("existing_mortgage_balance", { valueAsNumber: true })}
                    placeholder="0.00"
                    className={`${inputClass} text-right`} />

                </div>
              </div>
              </div>

              {/* Quick Task Creation */}
              {lead && <QuickTaskCreator leadId={lead.id} leadName={lead.full_name} />}

            <div className="space-y-1">
              <Label className={labelClass}>הערות</Label>
              <Textarea
                {...register("notes")}
                placeholder="הערות חשובות לתיק..."
                className={`${inputClass} h-24 resize-none`} />

            </div>
            
            <div className="flex flex-col items-end gap-2 pt-6 border-t border-slate-100 mt-4">
              {Object.keys(errors).length > 0 &&
              <span className="text-red-600 text-sm font-bold bg-red-50 px-3 py-1 rounded-full animate-pulse">
                      יש שגיאות בטופס, אנא בדוק את השדות המסומנים
                  </span>
              }
              <div className="flex justify-between items-center w-full">
                <Button onClick={handleSubmit(handleSaveAndClose, onFormError)} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                  שמור
                </Button>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={onCancel} className="border-slate-300 hover:bg-slate-50">ביטול</Button>
                  {lead ? (
                    <Button onClick={handleSubmit(handleSaveAndStay, onFormError)} className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 shadow-sm shadow-red-900/20" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                      עדכן תיק לקוח
                    </Button>
                  ) : (
                    <Button onClick={handleSubmit(handleSaveAndClose, onFormError)} className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 shadow-sm shadow-red-900/20" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                      צור ליד חדש
                    </Button>
                  )}
                </div>
              </div>
            </div>
              </div>
              </TabsContent>

              <TabsContent value="opportunities" className="h-[600px] overflow-y-auto pr-2">
              {!lead ?
          <div className="text-center py-10 text-slate-400">יש לשמור את הליד תחילה</div> :
          opportunities?.length > 0 ?
          <div className="space-y-3">
               {opportunities.map((opp) =>
            <div key={opp.id} className="p-4 bg-white border rounded-xl shadow-sm flex justify-between items-center hover:border-red-200 transition-colors">
                    <div>
                       <h4 className="font-bold text-slate-800">{opp.product_type}</h4>
                       <p className="text-sm text-slate-500">שלב: {opp.deal_stage}</p>
                    </div>
                    <div className="text-left">
                       <div className="font-mono font-bold text-red-700">₪{opp.loan_amount_requested?.toLocaleString()}</div>
                       <Badge variant="outline" className="mt-1">{opp.probability}% היתכנות</Badge>
                    </div>
                 </div>
            )}
              </div> :

          <div className={`text-center py-10 text-slate-400 border-2 border-dashed rounded-xl ${theme === 'dark' ? 'border-slate-700' : ''}`}>
              <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>אין הזדמנויות פתוחות ללקוח זה</p>
              </div>
          }
              </TabsContent>

              <TabsContent value="activity" className="h-[600px]">
              {lead ? <ActivityLog leadId={lead.id} /> : <div className="text-center py-10 text-slate-400">יש לשמור את הליד תחילה</div>}
              </TabsContent>

              <TabsContent value="tasks" className="h-[600px]">
                {lead ? <RelatedTasks leadId={lead.id} /> : <div className="text-center py-10 text-slate-400">יש לשמור את הליד תחילה</div>}
              </TabsContent>

              <TabsContent value="documents" className="space-y-6">
          <div className={`p-6 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <FileUpload
              files={watch("documents") || []}
              onFilesChange={(newFiles) => setValue("documents", newFiles)} />

          </div>
          
          <div className={`flex justify-end gap-3 pt-4 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
             <Button type="button" variant="outline" onClick={onCancel} className={theme === 'dark' ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : ''}>ביטול</Button>
             <Button onClick={handleSubmit(handleSaveAndClose, onFormError)} className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
               {lead ? "שמור שינויים" : "צור ליד"}
             </Button>
          </div>
        </TabsContent>

        <TabsContent value="discovery">
          {lead ?
          <div className="h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              <DiscoveryScript leadId={lead.id} />
            </div> :

          <div className={`flex flex-col items-center justify-center py-16 text-slate-400 rounded-xl border border-dashed ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <Activity className="w-10 h-10 mb-3 opacity-50" />
              <p className="font-medium">יש לשמור את הליד לפני שניתן למלא תסריט שיחה</p>
            </div>
          }
        </TabsContent>

        <TabsContent value="ai">
           {lead ? <LeadAiAnalysis lead={lead} /> : <div className="text-center py-10 text-slate-400">יש לשמור את הליד תחילה</div>}
        </TabsContent>
      </Tabs>
      </div>
    </motion.div>);

}