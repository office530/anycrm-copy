import React, { useState } from 'react';
import { useSettings } from '@/components/context/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

export default function TagSettings() {
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