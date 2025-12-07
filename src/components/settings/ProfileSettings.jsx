import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function ProfileSettings() {
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
            // alert("הפרופיל עודכן בהצלחה");
        } catch (err) {
            console.error(err);
            // alert("שגיאה בעדכון הפרופיל");
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