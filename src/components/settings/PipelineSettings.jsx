import React, { useState } from 'react';
import { useSettings } from '@/components/context/SettingsContext';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, X } from "lucide-react";

export default function PipelineSettings() {
    const { pipelineStages, saveSettings, isLoading, theme } = useSettings();
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
                     <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>שלבי המכירה (Pipeline)</h2>
                     <p className={`${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} text-sm`}>הגדר את השלבים שעובר ליד עד לסגירת העסקה</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="bg-slate-900 text-white">
                    {isSaving ? "שומר..." : "שמור שינויים"}
                    <Save className="w-4 h-4 mr-2" />
                </Button>
            </div>

            <div className="space-y-4">
                {localStages.map((stage, index) => (
                    <Card key={index} className={`overflow-hidden shadow-sm hover:shadow-md transition-shadow ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
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