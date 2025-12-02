import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, Search, Phone, MoreHorizontal, ArrowLeft, Calendar, Upload, Filter, User, MessageCircle
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

export default function LeadsPage() {
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

  // --- Mutations ---
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
    onSuccess: (data) => {
      queryClient.invalidateQueries(['leads']);
      // Future: Add global toast here
    }
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
            deal_stage: "New (חדש)",
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

  // --- Settings ---
  const statusOptions = [
    { value: "New", label: "חדש", color: "bg-blue-100 text-blue-700" },
    { value: "Attempting Contact", label: "בטיפול", color: "bg-yellow-100 text-yellow-700" },
    { value: "Contacted - Qualifying", label: "בירור צרכים", color: "bg-orange-100 text-orange-700" },
    { value: "Sales Ready", label: "בשל למכירה", color: "bg-purple-100 text-purple-700" },
    { value: "Converted", label: "הומר להזדמנות", color: "bg-emerald-100 text-emerald-700" },
    { value: "Lost / Unqualified", label: "לא רלוונטי", color: "bg-gray-100 text-gray-600" }
  ];

  // --- Filtering ---
  const filteredLeads = leads.filter(lead => {
    if (filters.status === "revival_2023") {
      return (lead.original_status_color === "Green" || lead.original_status_color === "Yellow") && !lead.last_contact_date;
    }
    const matchesSearch = lead.full_name?.toLowerCase().includes(filters.search.toLowerCase()) || lead.phone_number?.includes(filters.search);
    const matchesYear = filters.year === "all" || String(lead.source_year) === filters.year;
    const matchesStatus = filters.status === "all" ? lead.lead_status !== "Converted" : lead.lead_status === filters.status;
    return matchesSearch && matchesYear && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex-1 w-full md:w-auto flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="חיפוש שם או טלפון..." 
              className="pr-10 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-xl"
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <div className="flex gap-2">
            <Select value={filters.status} onValueChange={v => setFilters({...filters, status: v})}>
                <SelectTrigger className="w-[160px] rounded-xl bg-slate-50 border-slate-200">
                <Filter className="w-3.5 h-3.5 ml-2 text-slate-500" />
                <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                {statusOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                <SelectItem value="revival_2023" className="text-orange-600 font-bold">♻️ רשימת החייאה</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
             <Link to={createPageUrl('ImportLeads')} className="w-full md:w-auto">
                <Button variant="outline" className="w-full border-slate-200 hover:bg-slate-50 rounded-xl">
                    <Upload className="w-4 h-4 ml-2" />
                    ייבוא
                </Button>
            </Link>
            <Button onClick={() => setShowLeadForm(true)} className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-900/20">
            <Plus className="w-4 h-4 ml-2" />
            ליד חדש
            </Button>
        </div>
      </div>

      {/* Leads List - Floating Cards */}
      <div className="space-y-3">
        {/* Column Headers (Desktop Only) */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <div className="col-span-3 text-right">לקוח</div>
            <div className="col-span-3 text-right">פרטי קשר</div>
            <div className="col-span-2 text-right">סטטוס</div>
            <div className="col-span-2 text-right">שנה / מקור</div>
            <div className="col-span-2 text-left pl-4">פעולות</div>
        </div>

        <AnimatePresence>
            {isLoading ? (
                <div className="text-center py-20 text-slate-400">טוען נתונים...</div>
            ) : filteredLeads.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                    <p className="text-slate-500">לא נמצאו לידים התואמים את הסינון</p>
                </div>
            ) : (
                filteredLeads.map((lead, index) => (
                    <motion.div 
                        key={lead.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-teal-100 transition-all duration-200 grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
                    >
                        {/* Name & Details */}
                        <div className="col-span-3 flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-slate-600 bg-slate-100 group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors`}>
                                {lead.full_name?.charAt(0) || <User className="w-5 h-5" />}
                             </div>
                             <div className="flex-1 min-w-0">
                                <InlineEdit 
                                    value={lead.full_name}
                                    onSave={(val) => updateLead.mutate({ id: lead.id, data: { full_name: val } })}
                                    className="font-bold text-slate-800 text-base"
                                />
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <InlineEdit 
                                        value={lead.city} 
                                        placeholder="עיר"
                                        onSave={(val) => updateLead.mutate({ id: lead.id, data: { city: val } })}
                                    />
                                    <span>•</span>
                                    <span>בן {lead.age || '?'}</span>
                                </div>
                             </div>
                        </div>

                        {/* Phone & WhatsApp */}
                        <div className="col-span-3 flex items-center text-slate-600 gap-2">
                            <Phone className="w-4 h-4 text-slate-300" />
                            <InlineEdit 
                                value={lead.phone_number}
                                type="tel"
                                onSave={(val) => updateLead.mutate({ id: lead.id, data: { phone_number: val } })}
                                className="font-mono tracking-wide"
                            />
                            {lead.phone_number && (
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-7 w-7 text-green-500 hover:bg-green-50 hover:text-green-600 rounded-full"
                                  onClick={() => {
                                      const cleanNum = lead.phone_number.replace(/\D/g, '').replace(/^0/, '');
                                      window.open(`https://wa.me/972${cleanNum}`, '_blank');
                                  }}
                                  title="שלח הודעת וואטסאפ"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </Button>
                            )}
                        </div>

                        {/* Status - Smart Edit */}
                        <div className="col-span-2">
                             <InlineEdit 
                                type="select"
                                value={lead.lead_status}
                                options={statusOptions}
                                onSave={(val) => {
                                    if (val === 'Converted') convertToOpportunity.mutate(lead);
                                    else updateLead.mutate({ id: lead.id, data: { lead_status: val } });
                                }}
                                formatDisplay={(val) => {
                                    const status = statusOptions.find(o => o.value === val);
                                    return (
                                        <Badge variant="secondary" className={`${status?.color || 'bg-slate-100'} border-0 px-3 py-1`}>
                                            {status?.label || val}
                                        </Badge>
                                    );
                                }}
                             />
                        </div>

                        {/* Year & Source */}
                        <div className="col-span-2 flex flex-col justify-center text-sm text-slate-500">
                            <span className="font-medium">{lead.source_year}</span>
                            <span className="text-xs text-slate-400">{lead.last_contact_date || 'לא נוצר קשר'}</span>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 flex justify-end pl-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100">
                                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl">
                                    <DropdownMenuItem onClick={() => { setEditingLead(lead); setShowLeadForm(true); }}>
                                        ערוך פרטים מלאים
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        className="text-teal-600 focus:text-teal-700 font-medium"
                                        onClick={() => convertToOpportunity.mutate(lead)}
                                    >
                                        <ArrowLeft className="w-4 h-4 ml-2" />
                                        המר להזדמנות
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </motion.div>
                ))
            )}
        </AnimatePresence>
      </div>

      {/* Edit/Create Modal */}
      <Dialog open={showLeadForm} onOpenChange={(open) => {
        setShowLeadForm(open);
        if (!open) setEditingLead(null);
      }}>
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