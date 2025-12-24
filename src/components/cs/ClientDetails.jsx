import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileIcon, FileText, CheckSquare, Plus, Mail, Phone, Calendar, Download, Trash2, ExternalLink, ListChecks, Clock } from "lucide-react";
import { useSettings } from "@/components/context/SettingsContext";
import moment from "moment";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ClientDetails({ client, open, onClose }) {
  const { theme } = useSettings();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch fresh client data to ensure updates are reflected immediately
  const { data: freshClient } = useQuery({
      queryKey: ['client', client?.id],
      queryFn: async () => {
          const res = await base44.entities.Client.filter({id: client.id});
          return res[0];
      },
      enabled: !!client,
      initialData: client
  });

  const activeClient = freshClient || client;

  // Fetch related tasks and activities
  const { data: tasks } = useQuery({
    queryKey: ['tasks', activeClient?.id],
    queryFn: () => base44.entities.Task.list(),
    enabled: !!activeClient
  });

  const clientTasks = tasks?.filter((t) => t.related_client_id === activeClient?.id) || [];

  const { data: activities } = useQuery({
    queryKey: ['activities', activeClient?.id],
    queryFn: () => base44.entities.Activity.list(),
    enabled: !!activeClient
  });

  const clientActivities = activities?.filter((a) => a.related_client_id === activeClient?.id) || [];

  // Onboarding Logic
  const { data: onboardingTemplates } = useQuery({
      queryKey: ['onboarding_templates'],
      queryFn: () => base44.entities.OnboardingTemplate.list(),
      initialData: []
  });

  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const assignTemplate = async () => {
      if (!selectedTemplateId) return;
      setIsAssigning(true);
      try {
          const template = onboardingTemplates.find(t => t.id === selectedTemplateId);
          if (!template) return;

          const startDate = new Date();
          const newItems = template.items.map(item => {
              const dueDate = new Date(startDate);
              dueDate.setDate(dueDate.getDate() + (item.relative_due_days || 0));

              return {
                  id: Math.random().toString(36).substr(2, 9),
                  text: item.text,
                  phase: item.phase || 'General',
                  assigned_to: item.default_assignee || 'CSM',
                  due_date: dueDate.toISOString().split('T')[0],
                  is_completed: false,
                  completed_at: null
              };
          });

          await base44.entities.Client.update(activeClient.id, { 
              onboarding_items: newItems,
              onboarding_status: 'In Progress' 
          });
          queryClient.invalidateQueries(['clients']);
          queryClient.invalidateQueries(['client', activeClient.id]);
      } catch (e) {
          console.error(e);
          alert("Failed to assign template");
      } finally {
          setIsAssigning(false);
      }
  };

  const toggleOnboardingItem = async (itemId, currentStatus) => {
      const updatedItems = (activeClient.onboarding_items || []).map(item => {
          if (item.id === itemId) {
              return {
                  ...item,
                  is_completed: !currentStatus,
                  completed_at: !currentStatus ? new Date().toISOString() : null
              };
          }
          return item;
      });

      // Auto update status if all done
      const allDone = updatedItems.every(i => i.is_completed);
      const updates = { onboarding_items: updatedItems };
      if (allDone && activeClient.onboarding_status !== 'Completed') {
          updates.onboarding_status = 'Completed';
      } else if (!allDone && updatedItems.some(i => i.is_completed) && activeClient.onboarding_status === 'Not Started') {
          updates.onboarding_status = 'In Progress';
      }

      await base44.entities.Client.update(activeClient.id, updates);
      queryClient.invalidateQueries(['clients']);
      queryClient.invalidateQueries(['client', activeClient.id]);
  };

  // File Upload Handler (Simulated for UI)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newDoc = { name: file.name, url: file_url, type: file.type };
      const updatedDocs = [...(activeClient.documents || []), newDoc];

      await base44.entities.Client.update(activeClient.id, { documents: updatedDocs });
      queryClient.invalidateQueries(['clients']);
      queryClient.invalidateQueries(['client', activeClient.id]);
    } catch (err) {
      console.error(err);
      alert("Failed to upload file");
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white'}`}>
                <DialogHeader className="mb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-2xl font-bold">{client.full_name}</DialogTitle>
                            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {client.product_type} • {client.customer_segment}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Badge className={client.health_score > 80 ? 'bg-green-500' : 'bg-yellow-500'}>
                                Health: {client.health_score}
                            </Badge>
                            <Badge variant="outline" className="text-slate-50 px-2.5 py-0.5 text-xs font-semibold rounded-md inline-flex items-center border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">{client.onboarding_status}</Badge>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className={`w-full grid grid-cols-5 mb-6 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                        <TabsTrigger value="tasks">Tasks</TabsTrigger>
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className={isDark ? 'bg-slate-800 border-slate-700' : ''}>
                                <CardHeader><CardTitle className="text-slate-50 text-lg font-semibold tracking-tight">Client Info</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        <span className="text-slate-50">{client.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <span className="text-slate-50">{client.phone_number}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <span className="text-slate-50">Contract Start: {client.contract_start_date}</span>
                                    </div>
                                    <div className="pt-4 border-t border-dashed border-slate-700">
                                        <p className="text-slate-50 mb-2 text-sm font-semibold">CS Notes</p>
                                        <p className="text-sm text-slate-400 italic">
                                            {client.cs_notes || "No notes yet..."}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className={isDark ? 'bg-slate-800 border-slate-700' : ''}>
                                <CardHeader><CardTitle className="text-[#8cf54d] text-lg font-semibold tracking-tight">Subscription</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-blue-300">Renewal Date</span>
                                            <span className="text-blue-300 font-mono">{client.renewal_date}</span>
                                        </div>
                                        <Progress value={65} className="bg-sky-200 rounded-full relative w-full overflow-hidden h-2" />
                                        <p className="text-xs text-slate-500 mt-1">200 days remaining</p>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-slate-100 dark:bg-slate-900">
                                        <span className="text-sm">ARR</span>
                                        <span className="text-lg font-bold">${client.initial_amount?.toLocaleString()}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">Client Files</h3>
                            <div>
                                <Input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload} />

                                <Label htmlFor="file-upload" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium">
                                    <Plus className="w-4 h-4" /> Upload File
                                </Label>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {client.documents?.length > 0 ? client.documents.map((doc, idx) =>
              <Card key={idx} className={`group relative ${isDark ? 'bg-slate-800 border-slate-700' : ''}`}>
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="p-2 rounded bg-slate-100 dark:bg-slate-900">
                                            <FileText className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{doc.name}</p>
                                            <p className="text-xs text-slate-500 uppercase">{doc.type || 'FILE'}</p>
                                        </div>
                                        <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </CardContent>
                                </Card>
              ) :
              <div className="col-span-2 text-center py-10 text-slate-500 border-2 border-dashed rounded-xl border-slate-300 dark:border-slate-700">
                                    No documents found
                                </div>
              }
                        </div>
                    </TabsContent>

                    <TabsContent value="onboarding" className="space-y-6">
                        <div className="flex justify-between items-center mb-2">
                             <div>
                                <h3 className="font-bold flex items-center gap-2"><ListChecks className="w-5 h-5 text-blue-500"/> Onboarding Checklist</h3>
                                <p className="text-xs text-slate-500">Track implementation progress</p>
                             </div>
                             {(!activeClient.onboarding_items || activeClient.onboarding_items.length === 0) && (
                                <div className="flex items-center gap-2">
                                    {/* Placeholder for future actions */}
                                </div>
                             )}
                        </div>

                        {(!activeClient.onboarding_items || activeClient.onboarding_items.length === 0) ? (
                            <div className={`text-center py-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all ${
                                isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
                            }`}>
                                <div className={`p-4 rounded-full mb-4 ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-300 shadow-sm'}`}>
                                    <ListChecks className="w-8 h-8" />
                                </div>
                                <h4 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Start Onboarding</h4>
                                <p className="text-sm text-slate-500 max-w-sm mb-6">
                                    Choose a template to generate the onboarding checklist for {activeClient.full_name}.
                                </p>
                                
                                <div className="flex items-center gap-2 w-full max-w-md px-4">
                                    <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                                        <SelectTrigger className={`flex-1 h-10 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white'}`}>
                                            <SelectValue placeholder="Select a template..." />
                                        </SelectTrigger>
                                        <SelectContent className={isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white'}>
                                            {onboardingTemplates.sort((a, b) => {
                                                const aMatch = (a.product_type === activeClient.product_type) + (a.customer_segment === activeClient.customer_segment);
                                                const bMatch = (b.product_type === activeClient.product_type) + (b.customer_segment === activeClient.customer_segment);
                                                return bMatch - aMatch;
                                            }).map(t => (
                                                <SelectItem key={t.id} value={t.id} className="cursor-pointer">
                                                    <span className="font-medium">{t.title}</span>
                                                    {(t.product_type === activeClient.product_type || t.customer_segment === activeClient.customer_segment) && (
                                                        <span className="ml-2 text-xs text-emerald-500 font-bold">Recommended</span>
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button 
                                        onClick={assignTemplate} 
                                        disabled={!selectedTemplateId || isAssigning}
                                        className={isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-600 hover:bg-blue-700'}
                                    >
                                        {isAssigning ? 'Assigning...' : 'Start'}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                {/* Progress Header */}
                                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                                    <div className="flex justify-between items-end mb-3">
                                        <div>
                                            <h4 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Onboarding Progress</h4>
                                            <p className="text-xs text-slate-500 mt-1">{activeClient.onboarding_items.filter(i => i.is_completed).length} of {activeClient.onboarding_items.length} tasks completed</p>
                                        </div>
                                        <div className={`text-2xl font-bold ${
                                            (activeClient.onboarding_items.filter(i => i.is_completed).length / activeClient.onboarding_items.length) === 1 
                                            ? 'text-emerald-500' 
                                            : 'text-blue-500'
                                        }`}>
                                            {Math.round((activeClient.onboarding_items.filter(i => i.is_completed).length / activeClient.onboarding_items.length) * 100)}%
                                        </div>
                                    </div>
                                    <Progress value={(activeClient.onboarding_items.filter(i => i.is_completed).length / activeClient.onboarding_items.length) * 100} className={`h-3 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`} />
                                </div>

                                {/* Group by Phase */}
                                {Object.entries(activeClient.onboarding_items.reduce((acc, item) => {
                                    const phase = item.phase || 'General';
                                    if (!acc[phase]) acc[phase] = [];
                                    acc[phase].push(item);
                                    return acc;
                                }, {})).map(([phase, items]) => (
                                    <div key={phase} className="space-y-3">
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-1">{phase}</h4>
                                        {items.map((item) => (
                                            <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                                                item.is_completed 
                                                    ? (isDark ? 'bg-slate-800/50 border-slate-700 opacity-60' : 'bg-slate-50 border-slate-200 opacity-60')
                                                    : (isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200 shadow-sm')
                                            }`}>
                                                <Checkbox 
                                                    checked={item.is_completed} 
                                                    onCheckedChange={() => toggleOnboardingItem(item.id, item.is_completed)}
                                                    className="mt-1"
                                                />
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2">
                                                    <div className="md:col-span-6">
                                                        <p className={`text-sm font-medium ${item.is_completed ? 'line-through text-slate-500' : ''}`}>
                                                            {item.text}
                                                        </p>
                                                    </div>
                                                    
                                                    <div className="md:col-span-3 flex items-center">
                                                        <div className={`text-xs px-2 py-1 rounded-full border ${
                                                            item.assigned_to === 'CSM' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            item.assigned_to === 'Client' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                            item.assigned_to === 'Technical Support' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            'bg-slate-100 text-slate-700'
                                                        }`}>
                                                            {item.assigned_to}
                                                        </div>
                                                    </div>

                                                    <div className="md:col-span-3 flex items-center justify-end text-xs text-slate-500">
                                                        {item.is_completed && item.completed_at ? (
                                                            <span className="text-green-600 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" /> {new Date(item.completed_at).toLocaleDateString()}
                                                            </span>
                                                        ) : (
                                                            item.due_date && (
                                                                <span className={`flex items-center gap-1 ${
                                                                    new Date(item.due_date) < new Date() ? 'text-red-500 font-bold' : ''
                                                                }`}>
                                                                    <Calendar className="w-3 h-3" /> {new Date(item.due_date).toLocaleDateString()}
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="tasks" className="space-y-4">
                        <div className="space-y-2">
                            {clientTasks.length > 0 ? clientTasks.map((task) =>
              <div key={task.id} className={`p-3 rounded-lg border flex items-center gap-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                                    <CheckSquare className={`w-5 h-5 ${task.status === 'done' ? 'text-green-500' : 'text-slate-400'}`} />
                                    <div className="flex-1">
                                        <p className={`font-medium ${task.status === 'done' ? 'line-through text-slate-500' : ''}`}>{task.title}</p>
                                        <p className="text-xs text-slate-500">Due: {task.due_date}</p>
                                    </div>
                                    <Badge variant="outline">{task.priority}</Badge>
                                </div>
              ) :
              <p className="text-center text-slate-500 py-4">No tasks found</p>
              }
                        </div>
                    </TabsContent>

                    <TabsContent value="activity">
                         <div className="space-y-4">
                            {clientActivities.length > 0 ? clientActivities.map((act) =>
              <div key={act.id} className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                                        <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-800 my-1"></div>
                                    </div>
                                    <div className={`flex-1 pb-4`}>
                                        <p className="text-sm font-bold">{act.type} - {act.summary}</p>
                                        <p className="text-xs text-slate-500">{moment(act.date).format("MMM D, HH:mm")}</p>
                                    </div>
                                </div>
              ) :
              <p className="text-center text-slate-500 py-4">No activity history</p>
              }
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>);

}