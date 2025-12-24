import React, { useState } from 'react';
import { 
    Zap, Filter, Clock, AlertTriangle, Plus, Trash2, 
    CornerDownRight, ShieldAlert, CheckCircle2 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function SmartTriggerConfig({ triggerData, onChange }) {
    const [triggerType, setTriggerType] = useState(triggerData?.type || 'EVENT');
    
    // Mock fields for the sentence builder
    const fields = [
        { value: 'lead_score', label: 'Lead Score' },
        { value: 'industry', label: 'Industry' },
        { value: 'email_domain', label: 'Email Domain' },
        { value: 'job_title', label: 'Job Title' },
        { value: 'active_opportunities', label: 'Active Opportunities' }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* 1. Enrollment Vector */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Enrollment Trigger
                </div>
                
                <Select value={triggerType} onValueChange={setTriggerType}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Trigger Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="EVENT">Event-Based (Real-time)</SelectItem>
                        <SelectItem value="PROPERTY">Property Change (CRM)</SelectItem>
                        <SelectItem value="MANUAL">Manual / Bulk Enroll</SelectItem>
                    </SelectContent>
                </Select>

                {triggerType === 'EVENT' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                        <Label className="text-xs text-amber-800 font-semibold">Event Name</Label>
                        <Input placeholder="e.g., Viewed_Pricing_Page" className="bg-white" />
                        <div className="flex items-center gap-2 text-[10px] text-amber-600">
                            <Clock className="w-3 h-3" />
                            <span>Throttled: Max 1 per 24h per contact</span>
                        </div>
                    </div>
                )}

                {triggerType === 'PROPERTY' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-blue-800">WHEN</span>
                            <select className="h-8 rounded border-slate-200 text-sm">
                                <option>Lead Status</option>
                                <option>Pipeline Stage</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-blue-800">CHANGES TO</span>
                            <select className="h-8 rounded border-slate-200 text-sm font-bold">
                                <option>Nurture</option>
                                <option>Qualified</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Filter Logic (The Gatekeeper) */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider">
                        <Filter className="w-4 h-4 text-purple-500" />
                        Gatekeeper Filters
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-purple-600 hover:text-purple-700">
                        <Plus className="w-3 h-3 mr-1" /> Add Rule
                    </Button>
                </div>

                <div className="space-y-2">
                    {/* Rule 1 */}
                    <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md text-sm group">
                        <Badge variant="outline" className="bg-white text-slate-500 font-mono">IF</Badge>
                        <span className="font-medium text-slate-700">Industry</span>
                        <span className="text-slate-400">is</span>
                        <span className="font-bold text-slate-900">SaaS</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-3 h-3 text-slate-400" />
                        </Button>
                    </div>

                    {/* Rule 2 */}
                    <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md text-sm group">
                        <Badge variant="outline" className="bg-white text-purple-600 font-mono border-purple-200">AND</Badge>
                        <span className="font-medium text-slate-700">Active Deals</span>
                        <span className="text-slate-400">=</span>
                        <span className="font-bold text-slate-900">0</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-3 h-3 text-slate-400" />
                        </Button>
                    </div>

                    {/* Rule 3 */}
                    <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded-md text-sm group">
                        <Badge variant="outline" className="bg-white text-red-600 font-mono border-red-200">NOT</Badge>
                        <span className="font-medium text-red-900">Email Domain</span>
                        <span className="text-red-400">contains</span>
                        <span className="font-bold text-red-900">competitor.com</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-3 h-3 text-red-400" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* 3. Safety Net Logic */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4 text-emerald-500" />
                    Safety Net
                </div>

                <div className="bg-slate-50 rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-xs font-semibold text-slate-700">Prevent Concurrent Enrollment</Label>
                            <p className="text-[10px] text-slate-500">Block if active in another sequence</p>
                        </div>
                        <Switch checked={true} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-xs font-semibold text-slate-700">Re-enrollment Cooldown</Label>
                            <p className="text-[10px] text-slate-500">Wait period before re-entry</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <Input className="w-12 h-7 text-xs text-center p-0" defaultValue="90" />
                            <span className="text-xs text-slate-500">days</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-xs font-semibold text-slate-700">Exclude Customers</Label>
                            <p className="text-[10px] text-slate-500">Never enroll lifecycle=customer</p>
                        </div>
                        <Switch checked={true} />
                    </div>
                </div>
            </div>

            {/* Priority */}
            <div className="flex items-center justify-between pt-2">
                <Label className="text-xs text-slate-500">Execution Priority (1-10)</Label>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">Level 5</Badge>
                </div>
            </div>
        </div>
    );
}