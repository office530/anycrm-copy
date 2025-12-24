import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileIcon, FileText, CheckSquare, Plus, Mail, Phone, Calendar, Download, Trash2, ExternalLink } from "lucide-react";
import { useSettings } from "@/components/context/SettingsContext";
import moment from "moment";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ClientDetails({ client, open, onClose }) {
  const { theme } = useSettings();
  const isDark = theme === 'dark';
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch related tasks and activities
  const { data: tasks } = useQuery({
    queryKey: ['tasks', client?.id],
    queryFn: () => base44.entities.Task.list(),
    enabled: !!client
  });

  const clientTasks = tasks?.filter((t) => t.related_client_id === client?.id) || [];

  const { data: activities } = useQuery({
    queryKey: ['activities', client?.id],
    queryFn: () => base44.entities.Activity.list(),
    enabled: !!client
  });

  const clientActivities = activities?.filter((a) => a.related_client_id === client?.id) || [];

  // File Upload Handler (Simulated for UI)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const newDoc = { name: file.name, url: file_url, type: file.type };
      const updatedDocs = [...(client.documents || []), newDoc];

      await base44.entities.Client.update(client.id, { documents: updatedDocs });
      queryClient.invalidateQueries(['clients']);
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
                            <Badge variant="outline">{client.onboarding_status}</Badge>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className={`w-full grid grid-cols-4 mb-6 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                        <TabsTrigger value="tasks">Tasks & Plan</TabsTrigger>
                        <TabsTrigger value="activity">Activity Log</TabsTrigger>
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
                                            <span className="font-mono">{client.renewal_date}</span>
                                        </div>
                                        <Progress value={65} className="h-2" />
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