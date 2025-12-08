import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ExternalLink, Zap } from "lucide-react";
import { useSettings } from '@/components/context/SettingsContext';

export default function IntegrationSettings() {
    const { theme } = useSettings();
    
    const integrations = [
        {
            id: 'google_calendar',
            name: 'Google Calendar',
            description: 'Sync meetings and events with your calendar',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/1024px-Google_Calendar_icon_%282020%29.svg.png',
            connected: false
        },
        {
            id: 'google_drive',
            name: 'Google Drive',
            description: 'Store documents and files in client folders',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/2295px-Google_Drive_icon_%282020%29.svg.png',
            connected: false
        },
        {
            id: 'slack',
            name: 'Slack',
            description: 'Get notifications and updates in Slack channels',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/2048px-Slack_icon_2019.svg.png',
            connected: false
        },
        {
            id: 'salesforce',
            name: 'Salesforce',
            description: 'Two-way sync of leads and opportunities',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/2560px-Salesforce.com_logo.svg.png',
            connected: false
        }
    ];

    const handleConnect = (id) => {
        // Since we can't trigger OAuth from here easily without user interaction with the LLM tool call,
        // we'll guide the user.
        alert("To connect this integration, please ask the AI chat: 'Connect " + id.replace('_', ' ') + "'");
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
                <CardHeader>
                    <CardTitle className={theme === 'dark' ? 'text-white' : ''}>Integrations</CardTitle>
                    <CardDescription className={theme === 'dark' ? 'text-slate-400' : ''}>Extend system capabilities by connecting external services</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {integrations.map((integration) => (
                            <div key={integration.id} className={`flex items-start gap-4 p-4 border rounded-xl transition-colors ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                                <div className={`w-12 h-12 shrink-0 rounded-lg border p-2 flex items-center justify-center ${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white'}`}>
                                    <img src={integration.icon} alt={integration.name} className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{integration.name}</h4>
                                        {integration.connected && <Badge className="bg-green-100 text-green-700">Connected</Badge>}
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">{integration.description}</p>
                                    
                                    {integration.connected ? (
                                        <Button variant="outline" size="sm" className="w-full">
                                            <Check className="w-3 h-3 mr-2" />
                                            Connection Settings
                                        </Button>
                                    ) : (
                                        <Button onClick={() => handleConnect(integration.id)} size="sm" variant="secondary" className="w-full">
                                            <Zap className="w-3 h-3 mr-2" />
                                            Connect
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className={`mt-8 p-4 rounded-lg text-sm border ${theme === 'dark' ? 'bg-blue-900/20 text-blue-200 border-blue-800' : 'bg-blue-50 text-blue-800 border-blue-100'}`}>
                        <strong>Tip:</strong> You can connect more services using Zapier or Make. Contact support for Webhook and API Key.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}