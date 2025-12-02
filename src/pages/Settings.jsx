import React from 'react';
import { useSettings, defaultStages } from '@/components/context/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Briefcase, RefreshCcw, Save } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner or similar exists, otherwise fallback

export default function SettingsPage() {
  const { branding, updateBranding, pipelineStages, updateStage, setPipelineStages } = useSettings();

  const colors = [
    { name: 'Teal', value: 'teal', class: 'bg-teal-500' },
    { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
    { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
    { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
    { name: 'Rose', value: 'rose', class: 'bg-rose-500' },
  ];

  const handleResetStages = () => {
    if (confirm("האם אתה בטוח שברצונך לאפס את שלבי המכירה לברירת המחדל?")) {
        setPipelineStages(defaultStages);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-xl bg-${branding.primaryColor}-100 text-${branding.primaryColor}-600`}>
            <Settings className="w-6 h-6" />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-slate-800">הגדרות מערכת</h1>
            <p className="text-slate-500">התאמה אישית של המיתוג ותהליכי המכירה</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="general">כללי ומיתוג</TabsTrigger>
          <TabsTrigger value="pipeline">שלבי מכירה (Pipeline)</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle>פרטי ארגון ומיתוג</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>שם הארגון</Label>
                  <Input 
                    value={branding.companyName} 
                    onChange={(e) => updateBranding('companyName', e.target.value)}
                    className="bg-slate-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>מטבע ראשי</Label>
                  <Input 
                    value={branding.currency} 
                    onChange={(e) => updateBranding('currency', e.target.value)}
                    className="bg-slate-50"
                    placeholder="₪, $, €"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>כתובת לוגו (URL)</Label>
                <div className="flex gap-4 items-center">
                    <Input 
                        value={branding.logoUrl} 
                        onChange={(e) => updateBranding('logoUrl', e.target.value)}
                        className="bg-slate-50 flex-1"
                        placeholder="https://..."
                    />
                    {branding.logoUrl && (
                        <div className="w-10 h-10 rounded border flex items-center justify-center overflow-hidden bg-white">
                            <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                    )}
                </div>
              </div>

              <div className="space-y-3">
                <Label>צבע מערכת ראשי</Label>
                <div className="flex gap-3">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => updateBranding('primaryColor', c.value)}
                      className={`
                        w-10 h-10 rounded-full transition-all ${c.class}
                        ${branding.primaryColor === c.value ? 'ring-4 ring-offset-2 ring-slate-200 scale-110' : 'hover:scale-105 opacity-70 hover:opacity-100'}
                      `}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline">
          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>ניהול שלבי מכירה (Kanban)</CardTitle>
              <Button variant="outline" size="sm" onClick={handleResetStages}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                אפס לברירת מחדל
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm mb-4">
                שים לב: שינוי מזהה השלב (ID) עלול להשפיע על עסקאות קיימות. מומלץ לשנות רק את התווית (Label).
              </div>

              <div className="space-y-3">
                {pipelineStages.map((stage, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className={`w-4 h-12 rounded ${stage.color}`}></div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs text-slate-400">שם לתצוגה</Label>
                            <Input 
                                value={stage.label}
                                onChange={(e) => updateStage(index, 'label', e.target.value)}
                                className="h-8 bg-white"
                            />
                        </div>
                        <div className="space-y-1 opacity-50 pointer-events-none">
                            <Label className="text-xs text-slate-400">מזהה מערכת (לא לשינוי)</Label>
                            <Input value={stage.id} disabled className="h-8 bg-slate-100" />
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}