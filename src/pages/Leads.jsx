import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
        Plus, Search, Phone, MoreHorizontal, ArrowLeft, Upload, Filter, User, MessageCircle, Users, Activity, CheckCircle2, Pencil, Briefcase, Tag, ArrowUp, ArrowDown, ArrowUpDown } from
      "lucide-react";

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import LeadForm from "@/components/crm/LeadForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { processAutomation } from "@/components/automation/rulesEngine";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { InlineEdit } from "@/components/ui/InlineEdit";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/components/context/SettingsContext";

export default function LeadsPage() {
  const { leadStatuses } = useSettings();
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [filters, setFilters] = useState({ search: "", year: "all", status: "all", tag: "all" });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };


  const queryClient = useQueryClient();

  // שליפת נתונים
  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list(),
    initialData: []
  });

  const uniqueTags = useMemo(() => {
    const tags = new Set();
    leads.forEach(lead => {
      if (lead.tags && Array.isArray(lead.tags)) {
        lead.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags);
  }, [leads]);

  // חישוב סטטיסטיקות
  const stats = useMemo(() => {
    const total = leads.length;
    const convertedCount = leads.filter((l) => l.lead_status.includes('Converted')).length;
    const conversionRate = total > 0 ? (convertedCount / total * 100).toFixed(1) : 0;
    return { total, conversionRate };
  }, [leads]);

  // מוטציות (פעולות שרת)
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
        deal_stage: "New (חדש)",
        probability: 10
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['opportunities']);
      queryClient.invalidateQueries(['leads']);
      processAutomation('Opportunity', 'create', data);
      alert("🎉 הליד הפך להזדמנות בהצלחה!");
    }
  });

  // סינון
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (filters.status === "revival_2023") {
        return (lead.original_status_color === "Green" || lead.original_status_color === "Yellow") && !lead.last_contact_date;
      }
      const searchTerm = filters.search.toLowerCase().trim();
      const leadName = (lead.full_name || "").toLowerCase();
      const leadPhone = (lead.phone_number || "").replace(/\D/g, '');
      const searchPhone = searchTerm.replace(/\D/g, '');
      const matchesSearch = !searchTerm || leadName.includes(searchTerm) || leadPhone.includes(searchPhone);
      const matchesYear = filters.year === "all" || String(lead.source_year) === filters.year;

      // Status Logic: If "all", hide converted leads by default
      const matchesStatus = filters.status === "all" ? lead.lead_status !== "Converted" : lead.lead_status === filters.status;

      // Tag Logic
      const matchesTag = filters.tag === "all" || (lead.tags && lead.tags.includes(filters.tag));

      return matchesSearch && matchesYear && matchesStatus && matchesTag;
      }).sort((a, b) => {
        if (!sortConfig.key) return b.id - a.id; // Default sort by ID descending

        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle null/undefined
        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';

        // Specific handling for numbers if needed, but currently fields are strings/mixed
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
      }, [leads, filters, sortConfig]);

  return (
    <div className="space-y-6 pb-24 font-sans text-slate-900">
      
      {/* כרטיסי מידע עליונים */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Users} label="סה״כ לידים" value={stats.total} color="bg-red-100 text-red-700" />
        <StatCard icon={CheckCircle2} label="הומרו להזדמנות" value={`${stats.conversionRate}%`} color="bg-emerald-100 text-emerald-700" />
        <StatCard icon={Activity} label="פעילים בטיפול" value={leads.filter((l) => !l.lead_status.includes('Converted')).length} color="bg-slate-100 text-slate-700" />
      </div>

      {/* סרגל כלים וחיפוש */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="חיפוש שם או טלפון..."
              className="pr-10 border-slate-300 focus:border-red-500 focus:ring-red-500 rounded-lg"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })} />

          </div>
          <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <SelectTrigger className="w-full md:w-[160px] border-slate-300 text-slate-700 font-medium rounded-lg">
                    <Filter className="w-4 h-4 ml-2 text-slate-500" />
                    <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent className="bg-white text-slate-900 text-right">
                    <SelectItem value="all" className="text-right">כל הסטטוסים</SelectItem>
                    {leadStatuses.map((opt) => <SelectItem key={opt.value} value={opt.value} className="text-right hover:bg-slate-50">{opt.label}</SelectItem>)}
                    <SelectItem value="revival_2023" className="text-red-600 font-bold text-right hover:bg-red-50">♻️ רשימת החייאה</SelectItem>
                </SelectContent>
          </Select>

          <Select value={filters.tag} onValueChange={(v) => setFilters({ ...filters, tag: v })}>
                <SelectTrigger className="w-full md:w-[140px] border-slate-300 text-slate-700 font-medium rounded-lg">
                    <Tag className="w-4 h-4 ml-2 text-slate-500" />
                    <SelectValue placeholder="תגיות" />
                </SelectTrigger>
                <SelectContent className="bg-white text-slate-900 text-right">
                    <SelectItem value="all" className="text-right">כל התגיות</SelectItem>
                    {uniqueTags.map((tag) => <SelectItem key={tag} value={tag} className="text-right hover:bg-slate-50">{tag}</SelectItem>)}
                </SelectContent>
          </Select>


          </div>

          <div className="flex gap-2 w-full md:w-auto">
             <Link to={createPageUrl('ImportLeads')} className="flex-1 md:flex-none">
                <Button variant="outline" className="bg-background text-slate-50 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm h-9 w-full border-slate-300 hover:text-red-700 hover:bg-red-50 hover:border-red-200">
                    <Upload className="w-4 h-4 ml-2" />
                    ייבוא
                </Button>
            </Link>
            <Button onClick={() => setShowLeadForm(true)} className="flex-1 md:flex-none bg-red-700 hover:bg-red-800 text-white font-bold shadow-md shadow-red-900/10">
                <Plus className="w-4 h-4 ml-2" />
                ליד חדש
            </Button>
        </div>
      </div>

      {/* --- תצוגת דסקטופ (טבלה) --- */}
      {/* --- תצוגת דסקטופ (טבלה) --- */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wide select-none">
            <div className="col-span-4 text-right flex items-center gap-1 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('full_name')}>
                לקוח
                {sortConfig.key === 'full_name' ? (
                    sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                ) : <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-30 hover:opacity-100" />}
            </div>
            <div className="col-span-4 text-right flex items-center gap-1 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('phone_number')}>
                פרטי קשר
                {sortConfig.key === 'phone_number' ? (
                    sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                ) : <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-30 hover:opacity-100" />}
            </div>
            <div className="col-span-2 text-right flex items-center gap-1 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('source_year')}>
                שנה / מקור
                {sortConfig.key === 'source_year' ? (
                    sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                ) : <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-30 hover:opacity-100" />}
            </div>
            <div className="col-span-2 text-left pl-4">פעולות</div>
        </div>

        <div className="divide-y divide-slate-100">
            {isLoading ? <div className="p-10 text-center text-slate-500">טוען נתונים...</div> :
          filteredLeads.map((lead) =>
          <div key={lead.id} className="grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-slate-50/80 transition-colors group">
                    <div className="col-span-4 flex items-center gap-3">
                         <div className="w-9 h-9 rounded-full bg-red-50 text-red-700 flex items-center justify-center font-bold text-sm">
                            {lead.full_name?.charAt(0)}
                         </div>
                         <div className="flex-1">
                            <InlineEdit value={lead.full_name} className="font-bold text-slate-800" onSave={(v) => updateLead.mutate({ id: lead.id, data: { full_name: v } })} />
                            <div className="text-xs text-slate-500">{lead.city}</div>
                            {lead.tags && lead.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {lead.tags.map((tag, i) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded border border-slate-200">{tag}</span>
                                    ))}
                                </div>
                            )}
                         </div>
                    </div>
                    <div className="col-span-4 text-sm text-slate-600 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <InlineEdit value={lead.phone_number} type="tel" className="font-mono" onSave={(v) => updateLead.mutate({ id: lead.id, data: { phone_number: v } })} />
                        {lead.phone_number && <WhatsAppBtn phone={lead.phone_number} />}
                    </div>
                    <div className="col-span-2 text-sm text-slate-600">
                        {lead.source_year} <span className="text-slate-400 text-xs">({lead.last_contact_date || '-'})</span>
                    </div>
                    <div className="col-span-2 flex justify-end gap-1">
                        <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => {setEditingLead(lead);setShowLeadForm(true);}} className="h-8 px-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50" title="פתח ליד">
                                <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => convertToOpportunity.mutate(lead)} className="h-8 px-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" title="המר להזדמנות מיידי">
                                <CheckCircle2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
          )}
        </div>
      </div>

      {/* --- תצוגת מובייל (כרטיסים) --- */}
      <div className="md:hidden space-y-4">
         {filteredLeads.map((lead) =>
        <div key={lead.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-50 text-red-700 flex items-center justify-center font-bold text-lg">
                            {lead.full_name?.charAt(0)}
                        </div>
                        <div>
                            <InlineEdit value={lead.full_name} className="font-bold text-slate-900 text-lg" onSave={(v) => updateLead.mutate({ id: lead.id, data: { full_name: v } })} />
                            <div className="text-sm text-slate-500">{lead.city}</div>
                            {lead.tags && lead.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {lead.tags.map((tag, i) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded border border-slate-200">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => {setEditingLead(lead);setShowLeadForm(true);}} className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => convertToOpportunity.mutate(lead)} className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                            <CheckCircle2 className="w-4 h-4" />
                        </Button>
                    </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between border border-slate-100">
                     <InlineEdit value={lead.phone_number} type="tel" className="font-mono text-slate-700 font-medium" onSave={(v) => updateLead.mutate({ id: lead.id, data: { phone_number: v } })} />
                     {lead.phone_number && <WhatsAppBtn phone={lead.phone_number} />}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-bold text-slate-400">{lead.source_year}</span>
                    </div>
            </div>
        )}
      </div>

      {/* דיאלוג עריכה */}
      <Dialog open={showLeadForm} onOpenChange={(open) => {setShowLeadForm(open);if (!open) setEditingLead(null);}}>
        <DialogContent className="max-w-2xl p-0 bg-transparent border-none">
          <LeadForm
            lead={editingLead}
            onSubmit={(data) => {
              if (data.lead_status === 'Converted') {
                if (editingLead) convertToOpportunity.mutate({ ...editingLead, ...data });else
                createLead.mutate(data);
              } else {
                editingLead ? updateLead.mutate({ id: editingLead.id, data }) : createLead.mutate(data);
              }
            }}
            onCancel={() => setShowLeadForm(false)}
            isSubmitting={createLead.isPending || updateLead.isPending} />

        </DialogContent>
      </Dialog>
    </div>);

}

// קומפוננטות עזר קטנות
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${color}`}><Icon className="w-5 h-5" /></div>
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="text-2xl font-bold text-slate-800">{value}</p>
                </div>
            </CardContent>
        </Card>);

}

function WhatsAppBtn({ phone }) {
  const cleanNum = phone.replace(/\D/g, '').replace(/^0/, '');
  return (
    <Button
      size="icon" variant="ghost" className="h-7 w-7 text-green-600 bg-green-50 hover:bg-green-100 rounded-full"
      onClick={() => window.open(`https://wa.me/972${cleanNum}`, '_blank')}>

            <MessageCircle className="w-4 h-4" />
        </Button>);

}

function StatusBadge({ lead, statuses, updateLead, convert }) {
  return (
    <InlineEdit
      type="select"
      value={lead.lead_status}
      options={statuses}
      onSave={(val) => val === 'Converted' ? convert.mutate(lead) : updateLead.mutate({ id: lead.id, data: { lead_status: val } })}
      formatDisplay={(val) => {
        const s = statuses.find((o) => o.value === val);
        const isRevival = val === 'revival_2023' || s?.label?.includes('החייאה');
        return <Badge variant="outline" className={`${isRevival ? 'text-red-600 font-bold border-red-200 bg-red-50' : (s?.color?.replace('font-medium', '') || 'bg-slate-100 text-slate-900 font-normal')} border-0 px-3 py-1 w-full justify-start`}>{s?.label || val}</Badge>;
      }} />);


}