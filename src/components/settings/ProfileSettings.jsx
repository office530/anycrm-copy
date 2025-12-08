import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from '@/components/hooks/usePermissions';

export default function ProfileSettings() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const { isViewer, isEditor, isAdmin } = usePermissions();
    const [requestLoading, setRequestLoading] = useState(false);

    // Load user data
    React.useEffect(() => {
        base44.auth.me().then(setUser).catch(() => {});
    }, []);

    const handleRequestUpgrade = async () => {
        if (!user) return;
        setRequestLoading(true);
        try {
            await base44.entities.User.update(user.id, { requested_access_upgrade: true });
            setUser(prev => ({ ...prev, requested_access_upgrade: true }));
            alert("בקשתך נשלחה לאדמין המערכת");
        } catch (e) {
            console.error(e);
            alert("שגיאה בשליחת הבקשה");
        } finally {
            setRequestLoading(false);
        }
    };

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
                            <Button type="submit" disabled={loading || isViewer} className="bg-slate-900 text-white">
                                {loading ? "שומר..." : "שמור שינויים"}
                            </Button>
                            {isViewer && <p className="text-xs text-red-500 mt-2">אין לך הרשאות לערוך פרופיל (צופה בלבד)</p>}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>הרשאות גישה</CardTitle>
                    <CardDescription>רמת ההרשאה הנוכחית שלך במערכת</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-700">תפקיד נוכחי:</span>
                            {isAdmin ? <Badge className="bg-purple-100 text-purple-700">Admin</Badge> :
                             isEditor ? <Badge className="bg-emerald-100 text-emerald-700">Editor</Badge> :
                             <Badge variant="secondary">Viewer</Badge>}
                        </div>
                        <p className="text-xs text-slate-500">
                            {isAdmin ? "יש לך גישה מלאה לכל המערכת." :
                             isEditor ? "יש לך הרשאות עריכה ויצירה של נתונים." :
                             "אתה במצב צפייה בלבד. אינך יכול לבצע שינויים."}
                        </p>
                    </div>
                    {isViewer && !isAdmin && (
                        user?.requested_access_upgrade ? 
                        <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">בקשה נשלחה</Badge> :
                        <Button variant="outline" size="sm" onClick={handleRequestUpgrade} disabled={requestLoading}>
                            בקש הרשאת עריכה
                        </Button>
                    )}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>ניהול חשבון</CardTitle>
                    <CardDescription>פעולות התנתקות ומחיקת חשבון</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button variant="outline" className="text-slate-600 hover:bg-slate-50 w-full sm:w-auto" onClick={() => base44.auth.logout()}>
                            התנתק מהמערכת
                        </Button>
                        
                        <Button 
                            variant="ghost" 
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto" 
                            onClick={async () => {
                                if (window.confirm('האם אתה בטוח שברצונך למחוק את החשבון שלך לצמיתות? פעולה זו אינה הפיכה.')) {
                                    try {
                                        setLoading(true);
                                        // Call backend function to delete account
                                        await base44.functions.invoke('deleteAccount', {});
                                        // Then logout
                                        base44.auth.logout();
                                    } catch (e) {
                                        console.error("Failed to delete account", e);
                                        alert("אירעה שגיאה במחיקת החשבון. אנא נסה שנית מאוחר יותר.");
                                        setLoading(false);
                                    }
                                }
                            }}
                        >
                            מחק חשבון
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}