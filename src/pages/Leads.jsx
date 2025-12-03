import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, Search, Phone, MoreHorizontal, ArrowLeft, Upload, Filter, User, MessageCircle, Users, Activity, CheckCircle2, Pencil, Briefcase
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import LeadForm from "@/components/crm/LeadForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { processAutomation } from "@/components/automation/rulesEngine";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { InlineEdit } from "@/components/ui/InlineEdit";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/components/context/SettingsContext"; // שימוש ב-Context

export default function LeadsPage() {
  const { leadStatuses } = useSettings(); // שליפת הסטטוסים הדינמיים
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [filters, setFilters] = useState({ search: "", year: "all", status: "all" });

  const queryClient = useQueryClient();

  // Data
  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list(),
    initialData: []
  });

  // Stats Logic
  const stats = useMemo(() => {
      const total = leads.length;
      // חישוב המרות לפי הסטטוס שמוגדר כ"Converted" ב-Context או חיפוש המילה Converted
      const convertedCount = leads.filter(l => l.lead_status.includes('Converted')).length;
      const conversionRate = total > 0 ? ((convertedCount / total) * 100).toFixed(1) : 0;
      return { total, conversionRate };
  }, [leads]);

  const createLead = useMutation({
    mutationFn: (data) => base44.entities.Lead.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['leads']);
      setShowLeadForm(false);
      processAutomation('Lead', 'create', data);
      if (data.lead_status === 'Converted') convertToOpportunity.mutate(data);
    }
  });

  const updateLead = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['leads'])
  });

  const convertToOpportunity = useMutation({
    mutationFn: async (leadData) => {
        await base44.entities.Lead.update(leadData.id, { lead_status: "Converted" });
        return await base44.entities.Opportunity.create({
            lead_id: leadData.id,
            lead_name: leadData.full_name,
            phone_number: leadData.phone_number,
            email: leadData.email,
            product_type: "Reverse Mortgage", 
            property_value: leadData.estimated_property_value || 0,
            deal_stage: "New (חדש)", // ניתן להפוך גם את זה לדינמי בעתיד
            probability: 10,
        });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['opportunities']);
      queryClient.invalidateQueries(['leads']);
      processAutomation('Opportunity', 'create', data);
      alert("🎉 הליד הפך להזדמנות בהצלחה!");
    }
  });

  // סינון חכם
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
        if (filters.status === "revival_2023") {
            return (lead.original_status_color === "Green" || lead.original_status_color === "Yellow") && !lead.last_contact_date;
        }
        const searchTerm = filters.search.toLowerCase().trim();
        const leadName = (lead.full_name || "").toLowerCase();
        const leadPhone = (lead.phone_number || "").replace(/\D/g, ''); 
        const searchPhone = searchTerm.replace(/\D/g, ''); 

        const matchesSearch = !searchTerm || leadName.includes(searchTerm) || leadPhone.includes(searchPhone);
        const matchesYear = filters.year === "all" || String(lead.source_year) === filters.year;
        
        const matchesStatus = filters.status === "all" 
            ? lead.lead_status !== "Converted" 
            : lead.lead_status === filters.status;

        return matchesSearch && matchesYear && matchesStatus;
    }).sort((a, b) => b.id - a.id);
  }, [leads, filters, leadStatuses]);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-white dark:bg-neutral-200">
            <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Users className="w-5 h-5" /></div>
                <div>
                    <p className="text-sm text-neutral-500">סה״כ לידים</p>
                    <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-900">{stats.total}</p>
                </div>
            </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white dark:bg-neutral-200">
            <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-teal-100 text-teal-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
                <div>
                    <p className="text-sm text-neutral-500">הומרו להזדמנות</p>
                    <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-900">{stats.conversionRate}%</p>
                </div>
            </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white dark:bg-neutral-200">
            <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><Activity className="w-5 h-5" /></div>
                <div>
                    <p className="text-sm text-neutral-500">פעילים בטיפול</p>
                    <p className="text-2xl font-bold text-neutral-800 dark:text-neutral-900">
                        {leads.filter(l => !l.lead_status.includes('Converted') && !l.lead_status.includes('Lost')).length}
                    </p>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-neutral-200 p-4 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-300">
        <div className="flex-1 w-full md:w-auto flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -tranneutral-y-1/2 w-4 h-4 text-neutral-400" />
            <Input 
              placeholder="חיפוש..." 
              className="pr-10 bg-neutral-50 dark:bg-neutral-300 border-neutral-200 dark:border-neutral-300 focus:bg-white dark:focus:bg-neutral-800 dark:text-neutral-900 transition-all rounded-xl"
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <div className="flex gap-2">
            <Select value={filters.status} onValueChange={v => setFilters({...filters, status: v})}>
                <SelectTrigger className="w-[160px] rounded-xl bg-neutral-50 dark:bg-neutral-300 border-neutral-200 dark:border-neutral-300 dark:text-neutral-900">
                <Filter className="w-3.5 h-3.5 ml-2 text-neutral-500" />
                <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                {/* כאן משתמשים בסטטוסים הדינמיים מה-Context! */}
                {leadStatuses.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                <SelectItem value="revival_2023" className="text-orange-600 font-bold">♻️ רשימת החייאה</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
             <Link to={createPageUrl('ImportLeads')} className="w-full md:w-auto">
                <Button variant="outline" className="w-full border-neutral-200 hover:bg-neutral-50 rounded-xl">
                    <Upload className="w-4 h-4 ml-2" />
                    ייבוא
                </Button>
            </Link>
            <Button onClick={() => setShowLeadForm(true)} className="w-full md:w-auto bg-neutral-800 hover:bg-neutral-800 text-white rounded-xl shadow-lg shadow-neutral-900/20">
            <Plus className="w-4 h-4 ml-2" />
            ליד חדש
            </Button>
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-3">
         <div className="hidden md:grid grid-cols-12 gap-4 px-6 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            <div className="col-span-3 text-right">לקוח</div>
            <div className="col-span-3 text-right">פרטי קשר</div>
            <div className="col-span-2 text-right">סטטוס</div>
            <div className="col-span-2 text-right">שנה / מקור</div>
            <div className="col-span-2 text-left pl-4">פעולות</div>
        </div>

        <AnimatePresence>
            {isLoading ? (
                <div className="text-center py-20 text-neutral-400">טוען נתונים...</div>
            ) : filteredLeads.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-neutral-200 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-300">
                    <p className="text-neutral-500">לא נמצאו לידים</p>
                </div>
            ) : (
                filteredLeads.map((lead, index) => (
                    <motion.div 
                        key={lead.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group bg-white dark:bg-neutral-200 rounded-2xl p-4 shadow-sm border border-neutral-100 dark:border-neutral-300 hover:shadow-md hover:border-teal-100 dark:hover:border-teal-900 transition-all duration-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                    >
                        <div className="col-span-3 flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-neutral-600 dark:text-neutral-700 bg-neutral-100 dark:bg-neutral-300 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/30 group-hover:text-teal-600 transition-colors`}>
                                {lead.full_name?.charAt(0) || <User className="w-5 h-5" />}
                             </div>
                             <div className="flex-1 min-w-0">
                                <InlineEdit 
                                    value={lead.full_name}
                                    onSave={(val) => updateLead.mutate({ id: lead.id, data: { full_name: val } })}
                                    className="font-bold text-neutral-800 dark:text-neutral-900 text-base"
                                />
                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                    <InlineEdit value={lead.city} placeholder="עיר" onSave={(val) => updateLead.mutate({ id: lead.id, data: { city: val } })} />
                                    <span>•</span>
                                    <span>{lead.age || '?'}</span>
                                </div>
                             </div>
                        </div>

                        <div className="col-span-3 flex items-center text-neutral-600 dark:text-neutral-600 gap-2">
                            <Phone className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
                            <InlineEdit 
                                value={lead.phone_number}
                                type="tel"
                                onSave={(val) => updateLead.mutate({ id: lead.id, data: { phone_number: val } })}
                                className="font-mono tracking-wide"
                            />
                            {lead.phone_number && (
                                <Button 
                                  size="icon" variant="ghost" className="h-7 w-7 text-green-500 hover:bg-green-50 rounded-full"
                                  onClick={() => {
                                      const cleanNum = lead.phone_number.replace(/\D/g, '').replace(/^0/, '');
                                      window.open(`https://wa.me/972${cleanNum}`, '_blank');
                                  }}
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </Button>
                            )}
                        </div>

                        <div className="col-span-2">
                             <InlineEdit 
                                type="select"
                                value={lead.lead_status}
                                options={leadStatuses} // שימוש בסטטוסים הדינמיים
                                onSave={(val) => {
                                    if (val === 'Converted') convertToOpportunity.mutate(lead);
                                    else updateLead.mutate({ id: lead.id, data: { lead_status: val } });
                                }}
                                formatDisplay={(val) => {
                                    const status = leadStatuses.find(o => o.value === val);
                                    return (
                                        <Badge variant="secondary" className={`${status?.color || 'bg-neutral-100'} border-0 px-3 py-1`}>
                                            {status?.label || val}
                                        </Badge>
                                    );
                                }}
                             />
                        </div>

                        <div className="col-span-2 flex flex-col justify-center text-sm text-neutral-500">
                            <span className="font-medium">{lead.source_year}</span>
                            <span className="text-xs text-neutral-400">{lead.last_contact_date || 'לא נוצר קשר'}</span>
                        </div>

                        <div className="col-span-2 flex justify-end gap-2 pl-2">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                onClick={() => { setEditingLead(lead); setShowLeadForm(true); }}
                                title="ערוך פרטים מלאים"
                            >
                                <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-neutral-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                                onClick={() => convertToOpportunity.mutate(lead)}
                                title="המר להזדמנות"
                            >
                                <Briefcase className="w-4 h-4" />
                            </Button>
                        </div>
                    </motion.div>
                )))}
            </AnimatePresence>
      </div>

      <Dialog open={showLeadForm} onOpenChange={(open) => { setShowLeadForm(open); if(!open) setEditingLead(null); }}>
        <DialogContent className="max-w-2xl p-0 bg-transparent border-none">
          <LeadForm 
            lead={editingLead} 
            onSubmit={(data) => {
                if (data.lead_status === 'Converted') {
                    if (editingLead) convertToOpportunity.mutate({ ...editingLead, ...data });
                    else createLead.mutate(data); 
                } else {
                    editingLead ? updateLead.mutate({ id: editingLead.id, data }) : createLead.mutate(data);
                }
            }}
            onCancel={() => setShowLeadForm(false)}
            isSubmitting={createLead.isPending || updateLead.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}