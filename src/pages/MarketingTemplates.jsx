import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Plus, Mail, MessageSquare, Edit2, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MarketingTemplates() {
    const navigate = useNavigate();

    const { data: templates = [], isLoading } = useQuery({
        queryKey: ['marketing_templates'],
        queryFn: () => base44.entities.MarketingTemplate.list(),
    });

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Marketing Templates</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your email and message templates.</p>
                </div>
                <Button onClick={() => navigate(createPageUrl('TemplateEditor'))} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" /> New Template
                </Button>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-slate-500">Loading templates...</div>
            ) : templates.length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed rounded-2xl bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800">
                    <Mail className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No templates yet</h3>
                    <p className="text-slate-500 mb-6">Create your first smart template to start engaging leads.</p>
                    <Button onClick={() => navigate(createPageUrl('TemplateEditor'))} variant="outline">
                        Create Template
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                        <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(`${createPageUrl('TemplateEditor')}?id=${template.id}`)}>
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 rounded-lg ${template.channel === 'SMS' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {template.channel === 'SMS' ? <MessageSquare className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                                    </div>
                                    <Badge variant="outline" className={
                                        (template.ai_resonance_score || 0) > 70 ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                        (template.ai_resonance_score || 0) > 40 ? "bg-amber-50 text-amber-600 border-amber-200" :
                                        "bg-red-50 text-red-600 border-red-200"
                                    }>
                                        Score: {template.ai_resonance_score || 0}
                                    </Badge>
                                </div>
                                <h3 className="font-bold text-lg mb-2 truncate group-hover:text-blue-600 transition-colors">{template.name}</h3>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{template.subject_line || "No subject"}</p>
                                <div className="flex items-center justify-between text-xs text-slate-400 mt-auto pt-4 border-t">
                                    <span>{new Date(template.created_date).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1 text-slate-500">
                                        Edit <Edit2 className="w-3 h-3" />
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}