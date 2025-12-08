import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Search, Phone, MoreHorizontal, ArrowLeft, Upload, Filter, User, MessageCircle, Users, Activity, CheckCircle2, Pencil, Briefcase, Tag, ArrowUp, ArrowDown, ArrowUpDown, Trash2, LayoutGrid, List as ListIcon, Sparkles, Eye 
} from "lucide-react";

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import LeadForm from "@/components/crm/LeadForm";
import LeadsKanban from "@/components/crm/LeadsKanban";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { processAutomation } from "@/components/automation/rulesEngine";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { InlineEdit } from "@/components/ui/InlineEdit";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/components/context/SettingsContext";
import AiLeadImport from "@/components/crm/AiLeadImport";
import { usePermissions } from '@/components/hooks/usePermissions';

import { useLocation } from "react-router-dom";

export default function LeadsPage() {
  const { canCreate, canEdit, canDelete } = usePermissions();
  const { leadStatuses, theme } = useSettings();
  const location = useLocation();
  // Custom statuses to match LeadForm exactly
  const displayStatuses = [
  { value: "New", label: "חדש (New)", color: "bg-red-100 text-red-800 border-red-200" },
  { value: "Attempting Contact", label: "בטיפול - מנסה ליצור קשר", color: "bg-neutral-200 text-neutral-800 border-neutral-300" },
  { value: "Contacted - Qualifying", label: "נוצר קשר - בירור צרכים", color: "bg-neutral-200 text-neutral-800 border-neutral-300" },
  { value: "Sales Ready", label: "בשל להזדמנות / חם", color: "bg-neutral-800 text-white border-neutral-900" },
  { value: "Converted", label: "הומר להזדמנות (Converted)", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "Lost / Unqualified", label: "לא רלוונטי (סופי)", color: "bg-slate-100 text-slate-500 border-slate-200" }];


  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // Default to list view
  const [filters, setFilters] = useState({ search: "", year: "all", status: "all", tag: "all" });
  const [sortConfig, setSortConfig] = useState({ key: 'created_date', direction: 'desc' });
  const [showAiImport, setShowAiImport] = useState(false);

  // Check for action=new or action=ai-import in URL
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
        setEditingLead(null);
        setShowLeadForm(true);
        // Clean URL
        window.history.replaceState({}, '', location.pathname);
    } else if (params.get('action') === 'ai-import') {
        setShowAiImport(true);
        // Clean URL
        window.history.replaceState({}, '', location.pathname);
    }
  }, [location]);

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

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 1000 * 60 * 5 // Cache for 5 minutes
  });

  const { data: activities } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list(),
    initialData: []
  });

  // Get last activity date for each lead
  const getLastActivityDate = (leadId) => {
    const leadActivities = activities.filter(a => a.lead_id === leadId);
    if (!leadActivities.length) return null;
    const sorted = leadActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted[0]?.date;
  };

  const uniqueTags = useMemo(() => {
    const tags = new Set();
    leads.forEach((lead) => {
      if (lead.tags && Array.isArray(lead.tags)) {
        lead.tags.forEach((tag) => tags.add(tag));
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
    onSuccess: async (data) => {
      queryClient.invalidateQueries(['leads']);
      // No automatic close - handled by handlers
      processAutomation('Lead', 'create', data);

      // Create notification
      try {
          // In a real app, you'd fetch the admin email or iterate relevant users
          const currentUser = await base44.auth.me();
          await base44.entities.Notification.create({
              title: 'ליד חדש התקבל',
              message: `${data.full_name} - ${data.phone_number}`,
              type: 'lead',
              related_entity_type: 'Lead',
              related_entity_id: data.id,
              user_email: currentUser.email, // Notify self for now, should be 'admin' or logic
              is_read: false
          });
      } catch (e) { console.error("Failed to create notification", e); }
    }
  });

  const updateLead = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      // No automatic close - handled by handlers
    }
  });

  const deleteLead = useMutation({
    mutationFn: (id) => base44.entities.Lead.update(id, { is_deleted: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      alert("הליד הועבר לארכיון בהצלחה (מחיקה רכה)");
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
      // 1. Soft Delete Check
      if (lead.is_deleted) return false;

      // 2. Row Level Security (Permission Check)
      if (currentUser && currentUser.role !== 'admin') {
         const isCreator = lead.created_by === currentUser.email;
         const isAssigned = lead.assigned_to === currentUser.email;
         if (!isCreator && !isAssigned) return false;
      }

      // Special case: revival list
      if (filters.status === "revival_2023") {
        return (lead.original_status_color === "Green" || lead.original_status_color === "Yellow") && !lead.last_contact_date;
      }

      // Search filter - only by name
      const searchTerm = filters.search.toLowerCase().trim();
      const matchesSearch = !searchTerm || (lead.full_name || "").toLowerCase().includes(searchTerm);

      // Year filter
      const matchesYear = filters.year === "all" || String(lead.source_year) === filters.year;

      // Status filter
      const matchesStatus = filters.status === "all" || lead.lead_status === filters.status;

      // Tag filter
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
    <div className={`space-y-6 pb-24 font-sans transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
      
      {/* כרטיסי מידע עליונים */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Users} label="סה״כ לידים" value={stats.total} color="bg-red-100 text-red-700" />
        <StatCard icon={CheckCircle2} label="הומרו להזדמנות" value={`${stats.conversionRate}%`} color="bg-emerald-100 text-emerald-700" />
        <StatCard icon={Activity} label="פעילים בטיפול" value={leads.filter((l) => !l.lead_status.includes('Converted')).length} color="bg-slate-100 text-slate-700" />
      </div>

      {/* סרגל כלים וחיפוש */}
      <div className={`p-4 rounded-xl shadow-sm border flex flex-col md:flex-row gap-4 justify-between items-start md:items-center transition-colors ${
        theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div className="w-full md:w-auto flex flex-col md:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="חיפוש לפי שם..."
              className={`pr-10 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'bg-slate-900 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500' 
                  : 'border-slate-300 focus:border-red-500 focus:ring-red-500'
              }`}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })} />

          </div>
          <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <SelectTrigger className={`w-full md:w-[160px] font-medium rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'bg-slate-900 border-slate-600 text-white' 
                    : 'border-slate-300 text-slate-700'
                }`}>
                    <Filter className={`w-4 h-4 ml-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                    <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent className={`text-right transition-colors ${
                  theme === 'dark' ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900'
                }`}>
                    <SelectItem value="all" className="text-right">כל הסטטוסים</SelectItem>
                    {leadStatuses.map((opt) => <SelectItem key={opt.value} value={opt.value} className="text-right hover:bg-slate-50">{opt.label}</SelectItem>)}
                    <SelectItem value="revival_2023" className="text-red-600 font-bold text-right hover:bg-red-50">♻️ רשימת החייאה</SelectItem>
                </SelectContent>
          </Select>

          <Select value={filters.tag} onValueChange={(v) => setFilters({ ...filters, tag: v })}>
                <SelectTrigger className={`w-full md:w-[140px] font-medium rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'bg-slate-900 border-slate-600 text-white' 
                    : 'border-slate-300 text-slate-700'
                }`}>
                    <Tag className={`w-4 h-4 ml-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`} />
                    <SelectValue placeholder="תגיות" />
                </SelectTrigger>
                <SelectContent className={`text-right transition-colors ${
                  theme === 'dark' ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900'
                }`}>
                    <SelectItem value="all" className="text-right">כל התגיות</SelectItem>
                    {uniqueTags.map((tag) => <SelectItem key={tag} value={tag} className="text-right hover:bg-slate-50">{tag}</SelectItem>)}
                </SelectContent>
          </Select>


          </div>

          <div className="flex gap-2 w-full md:w-auto items-center flex-wrap md:flex-nowrap">
             {/* View Toggle */}
             <div className={`p-1 rounded-lg flex border transition-colors ${
               theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-200'
             }`}>
                <Button variant="ghost" size="sm" onClick={() => setViewMode('kanban')} className={`h-7 px-2 ${
                  viewMode === 'kanban' 
                    ? theme === 'dark' ? 'bg-slate-700 text-cyan-400 shadow-sm' : 'bg-white shadow-sm text-slate-900'
                    : theme === 'dark' ? 'text-slate-400 hover:text-cyan-400' : 'text-slate-500'
                }`}>
                    <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setViewMode('list')} className={`h-7 px-2 ${
                  viewMode === 'list' 
                    ? theme === 'dark' ? 'bg-slate-700 text-cyan-400 shadow-sm' : 'bg-white shadow-sm text-slate-900'
                    : theme === 'dark' ? 'text-slate-400 hover:text-cyan-400' : 'text-slate-500'
                }`}>
                    <ListIcon className="w-4 h-4" />
                </Button>
             </div>

             {canCreate && (
               <>
                 <Button 
                    variant="outline" 
                    onClick={() => setShowAiImport(true)}
                    className="bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 border-purple-200 hover:from-purple-100 hover:to-blue-100 font-medium"
                 >
                    <Sparkles className="w-4 h-4 ml-2" />
                    ייבוא AI
                 </Button>
                 <Link to={createPageUrl('ImportLeads')} className="hidden md:flex">
                    <Button variant="outline" className={`transition-colors ${
                      theme === 'dark' 
                        ? 'bg-slate-900 text-slate-300 border-slate-600 hover:bg-slate-800' 
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}>
                        <Upload className="w-4 h-4 ml-2" />
                        ייבוא רגיל
                    </Button>
                 </Link>
                <Button onClick={() => setShowLeadForm(true)} className="w-full md:w-auto md:flex-none bg-red-700 hover:bg-red-800 text-white font-bold shadow-md shadow-red-900/10 order-first md:order-last">
                    <Plus className="w-4 h-4 ml-2" />
                    ליד חדש
                </Button>
               </>
             )}
        </div>
      </div>

      {/* --- תצוגת קאנבן --- */}
      {viewMode === 'kanban' && (
        <div className="h-[calc(100vh-280px)]">
            <LeadsKanban 
                leads={filteredLeads} 
                statuses={displayStatuses}
                activities={activities}
                onStatusChange={(id, status) => updateLead.mutate({ id, data: { lead_status: status } })}
                onEdit={(lead) => { setEditingLead(lead); setShowLeadForm(true); }}
                onDelete={(id) => { if (window.confirm('למחוק ליד?')) deleteLead.mutate(id); }}
                onConvert={(lead) => convertToOpportunity.mutate(lead)}
            />
        </div>
      )}

      {/* --- תצוגת רשימה (דסקטופ + מובייל) --- */}
      {viewMode === 'list' && (
        <div className="space-y-6">
      {/* --- תצוגת דסקטופ (טבלה) --- */}
      <div className={`hidden md:block rounded-xl border shadow-sm overflow-hidden transition-colors ${
        theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
         <div className={`grid grid-cols-12 gap-4 px-6 py-3 border-b text-xs font-bold uppercase tracking-wide select-none transition-colors ${
           theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
         }`}>
            <div className="col-span-3 text-right flex items-center gap-1 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('full_name')}>
                לקוח
                {sortConfig.key === 'full_name' ?
            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" /> :
            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-30 hover:opacity-100" />}
            </div>
            <div className="col-span-2 text-right flex items-center gap-1 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('lead_status')}>
                סטטוס ליד
                {sortConfig.key === 'lead_status' ?
            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" /> :
            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-30 hover:opacity-100" />}
            </div>
            <div className="col-span-2 text-right flex items-center gap-1 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('phone_number')}>
                פרטי קשר
                {sortConfig.key === 'phone_number' ?
            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" /> :
            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-30 hover:opacity-100" />}
            </div>
            <div className="col-span-2 text-right flex items-center gap-1 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('created_date')}>
                תאריך יצירה
                {sortConfig.key === 'created_date' ?
            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" /> :
            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-30 hover:opacity-100" />}
            </div>
            <div className="col-span-1 text-right flex items-center gap-1 cursor-pointer hover:text-slate-900 transition-colors" onClick={() => handleSort('source_year')}>
                שנה
                {sortConfig.key === 'source_year' ?
            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" /> :
            <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-30 hover:opacity-100" />}
            </div>
            <div className="col-span-2 text-left pl-4">פעולות</div>
        </div>

        <div className={`divide-y transition-colors ${
          theme === 'dark' ? 'divide-slate-700' : 'divide-slate-100'
        }`}>
            {isLoading ? <div className={`p-10 text-center ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>טוען נתונים...</div> :
          filteredLeads.map((lead) =>
          <div key={lead.id} className={`grid grid-cols-12 gap-4 px-6 py-3 items-center transition-colors group ${
            theme === 'dark' ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50/80'
          }`}>
                    <div className="col-span-3 flex items-center gap-3">
                         <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                           theme === 'dark' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-50 text-red-700'
                         }`}>
                            {lead.full_name?.charAt(0)}
                         </div>
                         <div className="flex-1">
                            <Link to={`${createPageUrl('LeadDetails')}?leadId=${lead.id}`} className={`font-bold transition-colors ${
                              theme === 'dark' ? 'text-white hover:text-cyan-400' : 'text-slate-800 hover:text-red-600'
                            }`}>
                                {lead.full_name}
                            </Link>
                            <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{lead.city}</div>
                            {getLastActivityDate(lead.id) && (
                              <div className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5">
                                ✓ פעילות אחרונה: {new Date(getLastActivityDate(lead.id)).toLocaleDateString('he-IL')}
                              </div>
                            )}
                            {lead.tags && lead.tags.length > 0 &&
                    <div className="flex flex-wrap gap-1 mt-1">
                                    {lead.tags.map((tag, i) =>
                    <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded border border-slate-200">{tag}</span>
                    )}
                                </div>
                    }
                         </div>
                    </div>
                    <div className="col-span-2">
                        <StatusBadge lead={lead} statuses={displayStatuses} updateLead={updateLead} convert={convertToOpportunity} />
                    </div>
                    <div className={`col-span-2 text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        <Phone className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
                        <InlineEdit value={lead.phone_number} type="tel" className="font-mono" onSave={(v) => updateLead.mutate({ id: lead.id, data: { phone_number: v } })} />
                        {lead.phone_number && <WhatsAppBtn phone={lead.phone_number} />}
                    </div>
                    <div className={`col-span-2 text-xs dir-ltr ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {lead.created_date ? new Date(lead.created_date).toLocaleDateString('he-IL') : '-'}
                        <br/>
                        <span className="text-[10px] opacity-70">{lead.created_date ? new Date(lead.created_date).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                    </div>
                    <div className={`col-span-1 text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        {lead.source_year}
                    </div>
                    <div className="col-span-2 flex justify-end gap-1">
                        <div className="flex items-center justify-end gap-1">
                            {canDelete && (
                                <Button variant="ghost" size="sm" onClick={() => {
                        if (window.confirm('האם אתה בטוח שברצונך למחוק ליד זה? פעולה זו לא ניתנת לביטול.')) deleteLead.mutate(lead.id);
                        }} className="h-8 px-2 text-slate-400 hover:text-red-600 hover:bg-red-50" title="מחק ליד">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => {setEditingLead(lead);setShowLeadForm(true);}} className="h-8 px-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50" title={canEdit ? "ערוך ליד" : "צפה בליד"}>
                                {canEdit ? <Pencil className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            {canEdit && (lead.lead_status === 'Converted' ?
                        <div className="h-8 px-2 flex items-center justify-center text-emerald-600" title="הומר להזדמנות">
                                    <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                                </div> :

                        <Button variant="ghost" size="sm" onClick={() => convertToOpportunity.mutate(lead)} className="h-8 px-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" title="המר להזדמנות מיידי">
                                    <CheckCircle2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
          )}
        </div>
      </div>

      {/* --- תצוגת מובייל (כרטיסים) --- */}
      <div className="md:hidden space-y-4 pb-20">
         {filteredLeads.map((lead) =>
        <div key={lead.id} className={`p-4 rounded-xl shadow-sm border flex flex-col gap-3 transition-colors ${
          theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          theme === 'dark' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-red-50 text-red-700'
                        }`}>
                            {lead.full_name?.charAt(0)}
                        </div>
                        <div>
                            <Link to={`${createPageUrl('LeadDetails')}?leadId=${lead.id}`} className={`font-bold text-lg transition-colors block ${
                              theme === 'dark' ? 'text-white hover:text-cyan-400' : 'text-slate-900 hover:text-red-600'
                            }`}>
                                {lead.full_name}
                            </Link>
                            <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{lead.city}</div>
                            {getLastActivityDate(lead.id) && (
                              <div className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                                ✓ פעילות אחרונה: {new Date(getLastActivityDate(lead.id)).toLocaleDateString('he-IL')}
                              </div>
                            )}
                            {lead.tags && lead.tags.length > 0 &&
                    <div className="flex flex-wrap gap-1 mt-1">
                                    {lead.tags.map((tag, i) =>
                    <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded border border-slate-200">{tag}</span>
                    )}
                                </div>
                    }
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => {
                if (window.confirm('האם אתה בטוח שברצונך למחוק ליד זה?')) deleteLead.mutate(lead.id);
              }} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => {setEditingLead(lead);setShowLeadForm(true);}} className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                            <Pencil className="w-4 h-4" />
                        </Button>
                        {lead.lead_status === 'Converted' ?
              <div className="h-8 w-8 flex items-center justify-center text-emerald-600">
                                <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                            </div> :

              <Button variant="ghost" size="icon" onClick={() => convertToOpportunity.mutate(lead)} className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                                <CheckCircle2 className="w-4 h-4" />
                            </Button>
              }
                    </div>
                    </div>

                    <div className={`p-3 rounded-lg flex items-center justify-between border transition-colors ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'
                    }`}>
                     <InlineEdit value={lead.phone_number} type="tel" className={`font-mono font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`} onSave={(v) => updateLead.mutate({ id: lead.id, data: { phone_number: v } })} />
                     {lead.phone_number && <WhatsAppBtn phone={lead.phone_number} />}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>{lead.source_year}</span>
                    </div>
            </div>
        )}
      </div>
      </div>
      )}

      {/* דיאלוג עריכה */}
      <Dialog open={showLeadForm} onOpenChange={(open) => {setShowLeadForm(open);if (!open) setEditingLead(null);}}>
        <DialogContent className="max-w-2xl p-0 bg-transparent border-none">
          <LeadForm
            lead={editingLead}
            onSaveAndClose={(data) => {
              const wasConverted = editingLead?.lead_status === 'Converted';
              const isNowConverted = data.lead_status === 'Converted';
              
              if (isNowConverted && !wasConverted) {
                // המרה חדשה - צריך ליצור הזדמנות
                if (editingLead) {
                  convertToOpportunity.mutate({ ...editingLead, ...data });
                } else {
                  // ליד חדש שנוצר כבר כ-Converted
                  createLead.mutate(data);
                }
              } else {
                // עדכון רגיל או יצירה רגילה
                editingLead ? updateLead.mutate({ id: editingLead.id, data }) : createLead.mutate(data);
              }
              setShowLeadForm(false);
              setEditingLead(null);
            }}
            onSaveAndStay={(data) => {
              const wasConverted = editingLead?.lead_status === 'Converted';
              const isNowConverted = data.lead_status === 'Converted';
              
              if (isNowConverted && !wasConverted && editingLead) {
                // המרה חדשה - צריך ליצור הזדמנות ולהישאר בתיק
                convertToOpportunity.mutate({ ...editingLead, ...data });
              } else if (editingLead) {
                // עדכון רגיל
                updateLead.mutate({ id: editingLead.id, data });
              }
            }}
            onCancel={() => { setShowLeadForm(false); setEditingLead(null); }}
            isSubmitting={createLead.isPending || updateLead.isPending} />

        </DialogContent>
      </Dialog>

      {/* דיאלוג ייבוא AI */}
      <AiLeadImport 
        open={showAiImport}
        onOpenChange={setShowAiImport}
        onLeadCreated={(leadData) => createLead.mutate(leadData)}
      />
    </div>
  );
}

// קומפוננטות עזר קטנות
function StatCard({ icon: Icon, label, value, color }) {
  const { theme } = useSettings();
  return (
    <Card className={`border-none shadow-sm transition-colors ${
      theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white'
    }`}>
            <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 rounded-xl ${color}`}><Icon className="w-5 h-5" /></div>
                <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{value}</p>
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
        return <Badge variant="outline" className={`${isRevival ? 'text-red-600 font-bold border-red-200 bg-red-50' : s?.color?.replace('font-medium', '') || 'bg-slate-100 text-slate-900 font-normal'} border-0 px-3 py-1 w-full justify-start`}>{s?.label || val}</Badge>;
      }} />);


}