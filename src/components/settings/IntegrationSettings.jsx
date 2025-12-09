import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ExternalLink, Zap, ArrowRight, Bot } from "lucide-react";
import { useSettings } from '@/components/context/SettingsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function IntegrationSettings() {
    const { theme } = useSettings();
    const [selectedIntegration, setSelectedIntegration] = useState(null);
    
    const integrations = [
        {
            id: 'googlecalendar',
            name: 'Google Calendar',
            description: 'Sync meetings and events with your calendar',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/1024px-Google_Calendar_icon_%282020%29.svg.png',
            connected: false,
            category: 'Google Workspace'
        },
        {
            id: 'googledrive',
            name: 'Google Drive',
            description: 'Store and manage documents in client folders',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/2295px-Google_Drive_icon_%282020%29.svg.png',
            connected: false,
            category: 'Google Workspace'
        },
        {
            id: 'googlesheets',
            name: 'Google Sheets',
            description: 'Read and write data to spreadsheets',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Google_Sheets_logo_%282014-2020%29.svg/1200px-Google_Sheets_logo_%282014-2020%29.svg.png',
            connected: false,
            category: 'Google Workspace'
        },
        {
            id: 'googledocs',
            name: 'Google Docs',
            description: 'Create and edit documents automatically',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Google_Docs_logo_%282014-2020%29.svg/1481px-Google_Docs_logo_%282014-2020%29.svg.png',
            connected: false,
            category: 'Google Workspace'
        },
        {
            id: 'googleslides',
            name: 'Google Slides',
            description: 'Generate presentations from your data',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Google_Slides_logo_%282014-2020%29.svg/1024px-Google_Slides_logo_%282014-2020%29.svg.png',
            connected: false,
            category: 'Google Workspace'
        },
        {
            id: 'slack',
            name: 'Slack',
            description: 'Send notifications to channels and users',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Slack_icon_2019.svg/2048px-Slack_icon_2019.svg.png',
            connected: false,
            category: 'Communication'
        },
        {
            id: 'notion',
            name: 'Notion',
            description: 'Sync pages and databases with your workspace',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png',
            connected: false,
            category: 'Productivity'
        },
        {
            id: 'salesforce',
            name: 'Salesforce',
            description: 'Two-way sync of CRM data',
            icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Salesforce.com_logo.svg/2560px-Salesforce.com_logo.svg.png',
            connected: false,
            category: 'CRM'
        },
        {
            id: 'hubspot',
            name: 'HubSpot',
            description: 'Manage contacts and deals in HubSpot',
            icon: 'https://companieslogo.com/img/orig/HUBS-15637207.png',
            connected: false,
            category: 'CRM'
        }
    ];

    const handleConnect = (name) => {
        toast.info("Ask AI to Connect", {
            description: `Please type "Connect ${name}" in the chat to start the secure authorization process.`,
            action: {
                label: "Got it",
                onClick: () => {}
            },
            duration: 8000,
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className={theme === 'dark' ? 'bg-slate-800 border-slate-700' : ''}>
                <CardHeader>
                    <CardTitle className={theme === 'dark' ? 'text-white' : ''}>Integrations</CardTitle>
                    <CardDescription className={theme === 'dark' ? 'text-slate-400' : ''}>Extend system capabilities by connecting external services</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {integrations.map((integration) => (
                            <div key={integration.id} className={`flex flex-col h-full p-4 border rounded-xl transition-all duration-200 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/50 hover:shadow-cyan-500/10 hover:shadow-lg' : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-md'}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 shrink-0 rounded-xl p-2 flex items-center justify-center ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'}`}>
                                        <img src={integration.icon} alt={integration.name} className="w-full h-full object-contain" />
                                    </div>
                                    <Badge variant={integration.connected ? "default" : "outline"} className={integration.connected ? "bg-green-500 hover:bg-green-600" : ""}>
                                        {integration.connected ? "Active" : "Not Connected"}
                                    </Badge>
                                </div>
                                
                                <div className="flex-1">
                                    <h4 className={`font-bold text-lg mb-1 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{integration.name}</h4>
                                    <p className={`text-xs uppercase tracking-wider font-semibold mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{integration.category}</p>
                                    <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{integration.description}</p>
                                </div>
                                
                                {integration.connected ? (
                                    <Button variant="outline" size="sm" className="w-full mt-auto">
                                        <Check className="w-4 h-4 mr-2" />
                                        Manage
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={() => handleConnect(integration.name)} 
                                        size="sm" 
                                        className={`w-full mt-auto ${theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                                    >
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Connect via AI
                                    </Button>
                                )}
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