import React, { useState } from 'react';
import { useSettings } from '@/components/context/SettingsContext';
import NotificationSettings from '@/components/notifications/NotificationSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
    Settings, Building2, GitMerge, Tags, Bell, User, Shield, 
    Save, Check, LayoutDashboard, Palette, Database, Plus, X, CreditCard
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from "@/utils";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("organization");

  const menuItems = [
    { id: "organization", label: "הגדרות ארגון", icon: Building2, description: "פרטי חברה, מיתוג ומטבע" },
    { id: "profile", label: "הפרופיל שלי", icon: User, description: "פרטים אישיים והגדרות חשבון" },
    { id: "pipeline", label: "תהליכי מכירה", icon: GitMerge, description: "ניהול שלבי ומשפכי מכירה" },
    { id: "tags", label: "ניהול נתונים", icon: Database, description: "תגיות מערכת ושדות מותאמים" },
    { id: "notifications", label: "התראות", icon: Bell, description: "ניהול התראות ודיוורים" },
  ];

  const externalLink = (
    <a 
      href={createPageUrl('ApiSettings')}
      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-right text-slate-600 hover:bg-slate-50 hover:text-slate-900"
    >
      <Settings className="w-4 h-4 text-slate-400" />
      <div className="flex flex-col items-start">
        <span>API & חיבורים</span>
      </div>
    </a>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20" dir="rtl">
        {/* Header */}
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">הגדרות מערכת</h1>
            <p className="text-slate-500 mt-2">ניהול הגדרות מתקדם עבור הארגון והמשתמשים</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-200px)]">
            {/* Sidebar Menu */}
            <aside className="w-full lg:w-64 flex-shrink-0">
                <nav className="flex flex-col gap-1 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    {externalLink}
                    {menuItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-right
                                    ${isActive 
                                        ? "bg-slate-900 text-white shadow-md" 
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                            >
                                <item.icon className={`w-4 h-4 ${isActive ? "text-slate-300" : "text-slate-400"}`} />
                                <div className="flex flex-col items-start">
                                    <span>{item.label}</span>
                                    {/* <span className={`text-[10px] font-normal ${isActive ? "text-slate-400" : "text-slate-400"}`}>{item.description}</span> */}
                                </div>
                            </button>
                        );
                    })}
                </nav>
                
                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-2">
                        <Shield className="w-4 h-4 text-green-600" />
                        אבטחת מידע
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        כל השינויים בהגדרות נרשמים ביומן הפעילות של המערכת ומגובים אוטומטית.
                    </p>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto pr-1">
                <div className="space-y-6">
                    {activeTab === "organization" && <OrganizationSettings />}
                    {activeTab === "profile" && <ProfileSettings />}
                    {activeTab === "pipeline" && <PipelineSettings />}
                    {activeTab === "tags" && <DataSettings />}
                    {activeTab === "notifications" && <NotificationSettings />}
                </div>
            </main>
        </div>
    </div>
  );
}

// --- Sub-Components ---

function OrganizationSettings() {
    const { branding, saveSettings, isLoading } = useSettings();
    const [localBranding, setLocalBranding] = useState(branding);
    const [isSaving, setIsSaving] = useState(false);

    // Update local state when branding changes from context (initial load)
    React.useEffect(() => {
        setLocalBranding(branding);
    }, [branding]);

    const handleSave = () => {
        setIsSaving(true);
        saveSettings({
            company_name: localBranding.companyName,
            currency: localBranding.currency,
            logo_url: localBranding.logoUrl,
            primary_color: localBranding.primaryColor
        }, {
            onSuccess: () => {
                setIsSaving(false);
                alert("הגדרות הארגון נשמרו בהצלחה");
            }
        });
    };

    const colors = [
        { name: 'Red', value: 'red', class: 'bg-red-600' },
        { name: 'Blue', value: 'blue', class: 'bg-blue-600' },
        { name: 'Green', value: 'emerald', class: 'bg-emerald-600' },
        { name: 'Purple', value: 'purple', class: 'bg-purple-600' },
        { name: 'Orange', value: 'orange', class: 'bg-orange-600' },
        { name: 'Black', value: 'neutral', class: 'bg-neutral-900' },
    ];

    if (isLoading) return <div className="p-10 text-center text-slate-400">טוען הגדרות...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card>
                <CardHeader>
                    <CardTitle>פרטי הארגון</CardTitle>
                    <CardDescription>הגדרות בסיסיות של החברה המוצגות בכל המערכת</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>שם החברה / ארגון</Label>
                            <Input 
                                value={localBranding.companyName || ''} 
                                onChange={(e) => setLocalBranding({...localBranding, companyName: e.target.value})} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>מטבע ראשי (סימול)</Label>
                            <Input 
                                value={localBranding.currency || ''} 
                                onChange={(e) => setLocalBranding({...localBranding, currency: e.target.value})}
                                className="font-mono"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>כתובת לוגו (URL)</Label>
                        <div className="flex gap-4">
                            <Input 
                                value={localBranding.logoUrl || ''} 
                                onChange={(e) => setLocalBranding({...localBranding, logoUrl: e.target.value})}
                                placeholder="https://example.com/logo.png"
                            />
                            <div className="w-12 h-10 rounded border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden">
                                {localBranding.logoUrl ? 
                                    <img src={localBranding.logoUrl} className="w-full h-full object-contain" alt="Logo" /> : 
                                    <Building2 className="w-5 h-5 text-slate-300" />
                                }
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>נראות ומיתוג</CardTitle>
                    <CardDescription>התאמת צבעי המערכת למותג שלך</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Label>צבע ראשי</Label>
                        <div className="flex flex-wrap gap-3">
                            {colors.map((c) => (
                                <button
                                    key={c.value}
                                    onClick={() => setLocalBranding({...localBranding, primaryColor: c.value})}
                                    className={`group relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${c.class} 
                                        ${localBranding.primaryColor === c.value ? 'ring-4 ring-offset-2 ring-slate-200 scale-110 shadow-lg' : 'opacity-80 hover:opacity-100 hover:scale-105'}`}
                                >
                                    {localBranding.primaryColor === c.value && <Check className="w-6 h-6 text-white" />}
                                </button>
                            ))}
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 mt-4 flex items-center gap-4">
                            <div className={`px-4 py-2 rounded-md text-white font-medium bg-${localBranding.primaryColor}-600 shadow-sm`}>
                                כפתור לדוגמה
                            </div>
                            <div className={`text-${localBranding.primaryColor}-600 font-bold`}>
                                טקסט מודגש לדוגמה
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 mt-6 border-t flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving} className="bg-slate-900 text-white min-w-[120px]">
                            {isSaving ? "שומר..." : "שמור הגדרות"}
                            <Save className="w-4 h-4 mr-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function ProfileSettings() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    // Load user data
    React.useEffect(() => {
        base44.auth.me().then(setUser).catch(() => {});
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await base44.auth.updateMe({
                full_name: user.full_name,
            });
            alert("הפרופיל עודכן בהצלחה");
        } catch (err) {
            console.error(err);
            alert("שגיאה בעדכון הפרופיל");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="p-10 text-center text-slate-400">טוען נתוני משתמש...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card>
                <CardHeader>
                    <CardTitle>הפרופיל שלי</CardTitle>
                    <CardDescription>פרטים אישיים ופרטי התחברות</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>שם תצוגה (מופיע ביומן פעילות)</Label>
                                <Input 
                                    value={user.full_name || ''} 
                                    onChange={(e) => setUser({...user, full_name: e.target.value})} 
                                    placeholder="איך תרצה שיופיע השם שלך במערכת"
                                />
                                <p className="text-[11px] text-slate-400">שם זה יוצג בכל הפעילויות והעדכונים שלך</p>
                            </div>
                            <div className="space-y-2">
                                <Label>כתובת אימייל</Label>
                                <Input 
                                    value={user.email || ''} 
                                    disabled 
                                    className="bg-slate-50 text-slate-500" 
                                />
                                <p className="text-[11px] text-slate-400">לא ניתן לשנות כתובת אימייל</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <Button type="submit" disabled={loading} className="bg-slate-900 text-white">
                                {loading ? "שומר..." : "שמור שינויים"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>אזור סכנה</CardTitle>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" className="text-red-600 hover:bg-red-50 border-red-200 w-full sm:w-auto" onClick={() => base44.auth.logout()}>
                        התנתק מהמערכת
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

function PipelineSettings() {
    const { pipelineStages, saveSettings, isLoading } = useSettings();
    const [localStages, setLocalStages] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    React.useEffect(() => {
        if (pipelineStages) setLocalStages(JSON.parse(JSON.stringify(pipelineStages)));
    }, [pipelineStages]);

    const handleSave = () => {
        setIsSaving(true);
        saveSettings({
            pipeline_stages: localStages
        }, {
            onSuccess: () => {
                setIsSaving(false);
                alert("שלבי המכירה נשמרו בהצלחה");
            }
        });
    };

    const updateLocalStage = (index, field, value) => {
        const newStages = [...localStages];
        newStages[index][field] = value;
        setLocalStages(newStages);
    };

    if (isLoading) return <div className="p-10 text-center text-slate-400">טוען שלבים...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-end">
                <div>
                     <h2 className="text-xl font-bold text-slate-900">שלבי המכירה (Pipeline)</h2>
                     <p className="text-slate-500 text-sm">הגדר את השלבים שעובר ליד עד לסגירת העסקה</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="bg-slate-900 text-white">
                    {isSaving ? "שומר..." : "שמור שינויים"}
                    <Save className="w-4 h-4 mr-2" />
                </Button>
            </div>

            <div className="space-y-4">
                {localStages.map((stage, index) => (
                    <Card key={index} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className={`h-1 w-full ${stage.color}`}></div>
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                <div className={`w-8 h-8 rounded-full ${stage.light} flex items-center justify-center font-bold text-sm shrink-0`}>
                                    {index + 1}
                                </div>
                                
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-400">שם השלב</Label>
                                        <Input 
                                            value={stage.label} 
                                            onChange={(e) => updateLocalStage(index, 'label', e.target.value)}
                                            className="h-9 font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-400">משימות אוטומטיות (צ'ק-ליסט)</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {stage.checklist?.map((item, i) => (
                                                <Badge key={i} variant="secondary" className="bg-slate-100 font-normal text-slate-600 border-slate-200 flex gap-1 items-center">
                                                    {item.text}
                                                    <button 
                                                        onClick={() => {
                                                            const newStages = [...localStages];
                                                            newStages[index].checklist.splice(i, 1);
                                                            setLocalStages(newStages);
                                                        }}
                                                        className="hover:text-red-500"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                            <Button 
                                                variant="ghost" size="sm" className="h-6 text-xs px-2 border border-dashed border-slate-300 text-slate-500 hover:text-blue-600"
                                                onClick={() => {
                                                    const text = prompt("הכנס שם משימה:");
                                                    if (text) {
                                                        const newStages = [...localStages];
                                                        if (!newStages[index].checklist) newStages[index].checklist = [];
                                                        newStages[index].checklist.push({ id: Date.now().toString(), text });
                                                        setLocalStages(newStages);
                                                    }
                                                }}
                                            >
                                                <Plus className="w-3 h-3 mr-1" /> הוסף
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function DataSettings() {
    const { systemTags, updateSystemTags } = useSettings();
    const [newTag, setNewTag] = useState("");

    const addTag = () => {
        if (newTag && !systemTags.includes(newTag)) {
            updateSystemTags([...systemTags, newTag]);
            setNewTag("");
        }
    };

    const removeTag = (tagToRemove) => {
        if (confirm(`למחוק את התגית "${tagToRemove}"?`)) {
            updateSystemTags(systemTags.filter(t => t !== tagToRemove));
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <Card>
                <CardHeader>
                    <CardTitle>ניהול תגיות מערכת</CardTitle>
                    <CardDescription>תגיות המשמשות לסיווג לידים ולקוחות</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex gap-2">
                        <Input 
                            value={newTag} 
                            onChange={(e) => setNewTag(e.target.value)} 
                            placeholder="שם תגית חדשה..." 
                            onKeyDown={(e) => e.key === 'Enter' && addTag()}
                            className="max-w-xs"
                        />
                        <Button onClick={addTag} variant="secondary">
                            <Plus className="w-4 h-4 mr-2" />
                            הוסף
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl border border-slate-100 min-h-[100px]">
                        {systemTags.length === 0 && <p className="text-slate-400 text-sm italic w-full text-center pt-8">לא הוגדרו תגיות עדיין</p>}
                        {systemTags.map(tag => (
                            <Badge key={tag} className="pl-1 pr-3 py-1.5 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 text-sm gap-2 shadow-sm">
                                {tag}
                                <button onClick={() => removeTag(tag)} className="bg-slate-100 rounded-full p-0.5 hover:bg-red-100 hover:text-red-600 transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                </CardContent>
             </Card>
        </div>
    );
}