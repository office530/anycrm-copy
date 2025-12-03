import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, FileText, Phone, Save, X, Briefcase, Home } from "lucide-react";

export default function LeadForm({ lead, onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    age: "",
    city: "",
    source_year: new Date().getFullYear().toString(),
    lead_status: "New",
    last_contact_date: "",
    marital_status: "",
    has_children: false,
    spouse_age: "",
    estimated_property_value: "",
    mortgage_balance: "",
    notes: ""
  });

  useEffect(() => {
    if (lead) {
      setFormData({ ...formData, ...lead });
    }
  }, [lead]);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    // שינוי 1: הרחבנו את הטופס ל-max-w-4xl כדי שיהיה מרווח
    <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl h-[90vh] md:h-auto md:max-h-[90vh] overflow-hidden border border-slate-200" dir="rtl">
      
      {/* כותרת יוקרתית */}
      <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
        <div className="flex items-center gap-3">
            <div className="bg-red-50 p-2 rounded-lg">
                <User className="w-6 h-6 text-red-700" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">
                    {lead ? `תיק לקוח: ${lead.full_name}` : "יצירת ליד חדש"}
                </h2>
                <p className="text-sm text-slate-500 font-medium">עריכת פרטים וניהול נתונים</p>
            </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full">
            <X className="w-6 h-6" />
        </Button>
      </div>

      {/* תוכן הטופס */}
      <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]">
        <Tabs defaultValue="details" className="w-full">
            {/* טאבים בעיצוב נקי */}
            <TabsList className="w-full justify-start bg-white border border-slate-200 p-1 rounded-xl mb-6 h-auto shadow-sm">
                <TabsTrigger value="details" className="flex-1 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:font-bold py-2.5 rounded-lg transition-all">
                    <User className="w-4 h-4 ml-2" /> פרטים אישיים
                </TabsTrigger>
                <TabsTrigger value="financial" className="flex-1 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:font-bold py-2.5 rounded-lg transition-all">
                    <Home className="w-4 h-4 ml-2" /> נכס ומשפחה
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex-1 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:font-bold py-2.5 rounded-lg transition-all">
                    <Briefcase className="w-4 h-4 ml-2" /> ניהול עסקה
                </TabsTrigger>
            </TabsList>

            {/* טאב 1: פרטים אישיים - פרוס לרוחב (3 עמודות) */}
            <TabsContent value="details" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-50 pb-2">
                        <span className="w-1 h-5 bg-red-600 rounded-full"></span>
                        מידע בסיסי
                    </h3>
                    
                    {/* שינוי 2: Grid של 3 עמודות למסכים רחבים */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-right block font-bold text-slate-700">שם מלא *</Label>
                            <Input 
                                value={formData.full_name} 
                                onChange={(e) => handleChange("full_name", e.target.value)} 
                                className="text-right h-10 border-slate-200 focus:border-red-500 focus:ring-red-500"
                                placeholder="ישראל ישראלי"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-right block font-bold text-slate-700">טלפון נייד *</Label>
                            <Input 
                                value={formData.phone_number} 
                                onChange={(e) => handleChange("phone_number", e.target.value)} 
                                className="text-right font-mono h-10 border-slate-200 focus:border-red-500 focus:ring-red-500"
                                placeholder="050-0000000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-right block font-bold text-slate-700">עיר מגורים</Label>
                            <Input 
                                value={formData.city} 
                                onChange={(e) => handleChange("city", e.target.value)} 
                                className="text-right h-10 border-slate-200 focus:border-red-500 focus:ring-red-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-right block font-bold text-slate-700">גיל</Label>
                            <Input 
                                type="number"
                                value={formData.age} 
                                onChange={(e) => handleChange("age", e.target.value)} 
                                className="text-right h-10 border-slate-200 focus:border-red-500 focus:ring-red-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-right block font-bold text-slate-700">אימייל</Label>
                            <Input 
                                value={formData.email} 
                                onChange={(e) => handleChange("email", e.target.value)} 
                                className="text-right h-10 border-slate-200 focus:border-red-500 focus:ring-red-500"
                                placeholder="email@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-right block font-bold text-slate-700">סטטוס נוכחי</Label>
                            <Select value={formData.lead_status} onValueChange={(val) => handleChange("lead_status", val)}>
                                <SelectTrigger className="text-right w-full bg-white h-10 border-slate-200 focus:ring-red-500">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200">
                                    <SelectItem value="New">חדש</SelectItem>
                                    <SelectItem value="Attempting Contact">בטיפול</SelectItem>
                                    <SelectItem value="Contacted - Qualifying">בירור צרכים</SelectItem>
                                    <SelectItem value="Sales Ready">בשל למכירה</SelectItem>
                                    <SelectItem value="Converted">הומר להזדמנות</SelectItem>
                                    <SelectItem value="Lost / Unqualified">לא רלוונטי</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </TabsContent>

            {/* טאב 2: פיננסי - מרווח וברור */}
            <TabsContent value="financial" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                     <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-50 pb-2">
                        <span className="w-1 h-5 bg-red-600 rounded-full"></span>
                        פרופיל פיננסי ומשפחתי
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* צד ימין - משפחה */}
                        <div className="space-y-4">
                             <div className="space-y-2">
                                <Label className="text-right block font-bold text-slate-700">מצב משפחתי</Label>
                                <Select value={formData.marital_status} onValueChange={(val) => handleChange("marital_status", val)}>
                                    <SelectTrigger className="bg-white text-right h-10 border-slate-200 focus:ring-red-500"><SelectValue placeholder="בחר סטטוס" /></SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="Married">נשוי/אה</SelectItem>
                                        <SelectItem value="Single">רווק/ה</SelectItem>
                                        <SelectItem value="Widowed">אלמן/ה</SelectItem>
                                        <SelectItem value="Divorced">גרוש/ה</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-right block font-bold text-slate-700">גיל בן/ת זוג</Label>
                                <Input value={formData.spouse_age} onChange={(e) => handleChange("spouse_age", e.target.value)} className="text-right h-10 border-slate-200" />
                            </div>
                            <div className="flex items-center gap-3 pt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <Checkbox 
                                    id="has_children" 
                                    checked={formData.has_children} 
                                    onCheckedChange={(val) => handleChange("has_children", val)}
                                    className="w-5 h-5 data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600 border-slate-300"
                                />
                                <Label htmlFor="has_children" className="font-bold text-slate-700 cursor-pointer select-none text-base">יש ילדים?</Label>
                            </div>
                        </div>

                        {/* צד שמאל - נכס */}
                        <div className="space-y-4">
                             <div className="space-y-2">
                                <Label className="text-right block font-bold text-slate-700">שווי נכס מוערך (₪)</Label>
                                <div className="relative">
                                    <Input value={formData.estimated_property_value} type="number" onChange={(e) => handleChange("estimated_property_value", e.target.value)} className="text-right h-10 border-slate-200 pl-10" />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₪</span>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label className="text-right block font-bold text-slate-700">יתרת משכנתא קיימת (₪)</Label>
                                <div className="relative">
                                    <Input value={formData.mortgage_balance} type="number" onChange={(e) => handleChange("mortgage_balance", e.target.value)} className="text-right h-10 border-slate-200 pl-10" />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₪</span>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* הערות - רחב למטה */}
                 <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <Label className="text-right block font-bold text-slate-700 mb-2">הערות חשובות / מצב בריאותי</Label>
                    <Textarea 
                        value={formData.notes} 
                        onChange={(e) => handleChange("notes", e.target.value)} 
                        className="text-right min-h-[120px] border-slate-200 focus:border-red-500 focus:ring-red-500 resize-none text-base p-4"
                        placeholder="רשום כאן כל פרט חשוב לגבי הלקוח..."
                    />
                 </div>
            </TabsContent>

            {/* טאב 3: פעילות */}
            <TabsContent value="activity" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="bg-white p-10 rounded-xl border border-dashed border-slate-300 text-center">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Phone className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">היסטוריית התקשרויות</h3>
                    <p className="text-slate-500 mt-2">רשימת השיחות והמשימות תופיע כאן בגרסה הבאה.</p>
                 </div>
            </TabsContent>
        </Tabs>
      </div>

      {/* Footer - כפתורים */}
      <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Button variant="outline" onClick={onCancel} className="h-11 px-8 border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium">
            ביטול
        </Button>
        <Button onClick={() => onSubmit(formData)} disabled={isSubmitting} className="h-11 px-8 bg-red-700 hover:bg-red-800 text-white shadow-lg shadow-red-900/20 font-bold tracking-wide transition-all hover:scale-105">
            <Save className="w-5 h-5 ml-2" />
            {lead ? "שמור שינויים" : "צור ליד חדש"}
        </Button>
      </div>
    </div>
  );
}