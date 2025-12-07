import React, { useState } from 'react';
import { useSettings } from '@/components/context/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Building2, Check, Save } from "lucide-react";

export default function OrganizationSettings() {
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
                // Toast logic usually goes here
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