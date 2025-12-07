import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ExternalLink, Zap } from "lucide-react";

export default function IntegrationSettings() {
    
    const integrations = [
        {
            id: 'google_calendar',
            name: 'Google Calendar',
            description: 'סנכרון פגישות ואירועים עם היומן שלך',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/1024px-Google_Calendar_icon_%282020%29.svg.png',
            connected: false
        },
        {
            id: 'google_drive',
            name: 'Google Drive',
            description: 'שמירת מסמכים וקבצים בתיקיית הלקוח',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/2295px-Google_Drive_icon_%282020%29.svg.png',
            connected: false
        },
        {
            id: 'slack',
            name: 'Slack',
            description: 'קבלת התראות ועדכונים בערוצי Slack',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/2048px-Slack_icon_2019.svg.png',
            connected: false
        },
        {
            id: 'salesforce',
            name: 'Salesforce',
            description: 'סנכרון דו-כיווני של לידים והזדמנויות',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/2560px-Salesforce.com_logo.svg.png',
            connected: false
        }
    ];

    const handleConnect = (id) => {
        // Since we can't trigger OAuth from here easily without user interaction with the LLM tool call,
        // we'll guide the user.
        alert("כדי לחבר אינטגרציה זו, אנא בקש מה-AI בצ'אט: 'חבר את " + id.replace('_', ' ') + "'");
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card>
                <CardHeader>
                    <CardTitle>אינטגרציות וחיבורים</CardTitle>
                    <CardDescription>הרחב את יכולות המערכת באמצעות חיבור לשירותים חיצוניים</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {integrations.map((integration) => (
                            <div key={integration.id} className="flex items-start gap-4 p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                                <div className="w-12 h-12 shrink-0 bg-white rounded-lg border p-2 flex items-center justify-center">
                                    <img src={integration.icon} alt={integration.name} className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-bold text-slate-900">{integration.name}</h4>
                                        {integration.connected && <Badge className="bg-green-100 text-green-700">מחובר</Badge>}
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">{integration.description}</p>
                                    
                                    {integration.connected ? (
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Check className="w-3 h-3 mr-2" />
                                            הגדרות חיבור
                                        </Button>
                                    ) : (
                                        <Button onClick={() => handleConnect(integration.id)} size="sm" variant="secondary" className="w-full">
                                            <Zap className="w-3 h-3 mr-2" />
                                            התחבר
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-8 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                        <strong>טיפ:</strong> ניתן לחבר שירותים נוספים באמצעות Zapier או Make. פנה לתמיכה לקבלת Webhook ו-API Key.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}