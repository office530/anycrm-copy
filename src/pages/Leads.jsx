import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  Phone, 
  MoreHorizontal,
  ArrowLeft,
  Calendar,
  Upload
  } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LeadForm from "@/components/crm/LeadForm";
import OpportunityForm from "@/components/crm/OpportunityForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { processAutomation } from "@/components/automation/rulesEngine";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function LeadsPage() {
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showOppForm, setShowOppForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [convertingLead, setConvertingLead] = useState(null);
  const [filters, setFilters] = useState({ search: "", year: "all", status: "all" });

  const queryClient = useQueryClient();

  // Fetch Leads
  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list(),
    initialData: []
  });

  // Mutations
  const createLead = useMutation({
    mutationFn: (data) => base44.entities.Lead.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['leads']);
      setShowLeadForm(false);
      processAutomation('Lead', 'create', data);
    }
  });

  const updateLead = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['leads']);
      setShowLeadForm(false);
      setEditingLead(null);

      // Process Automation
      // We need to fetch the OLD data to compare? 
      // The mutation doesn't return old data. 
      // In a real app we might need to fetch before update or pass it.
      // For now, we'll rely on 'editingLead' state if available, or just pass previous as null
      // if we only care about current state match.
      // However, 'editingLead' holds the state BEFORE the user started editing, 
      // but 'variables.data' holds the NEW data requested.
      // 'data' is the server response (new data).
      processAutomation('Lead', 'update', data, editingLead);
    }
  });

  const createOpportunity = useMutation({
    mutationFn: async (formData) => {
        // Extract special flags
        const { _createTask, _leadName, ...oppData } = formData;
        
        const newOpp = await base44.entities.Opportunity.create(oppData);

        if (_createTask) {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 2); // Due in 2 days

            await base44.entities.Task.create({
                title: `פגישת המשך - ${_leadName || 'לקוח'}`,
                description: "נוצר אוטומטית בעת המרת ליד להזדמנות. יש ליצור קשר לתיאום פגישה.",
                status: "todo",
                due_date: dueDate.toISOString().split('T')[0],
                related_lead_id: oppData.lead_id,
                related_opportunity_id: newOpp.id
            });
        }

        return newOpp;
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries(['opportunities']);
      
      // Update the lead status ONLY after opportunity is created successfully
      if (convertingLead) {
          await base44.entities.Lead.update(convertingLead.id, { lead_status: "Converted to Opportunity" });
          queryClient.invalidateQueries(['leads']);
      }

      setShowOppForm(false);
      setConvertingLead(null);
      processAutomation('Opportunity', 'create', data);
    }
  });

  // Filtering Logic
  const filteredLeads = leads.filter(lead => {
    // Revival List Logic
    if (filters.status === "revival_2023") {
      const isGreenOrYellow = lead.original_status_color === "Green" || lead.original_status_color === "Yellow";
      // "Last Contact Date" is empty or old (let's say empty for strictly following request)
      // Request says: "Last Contact Date" is empty.
      const noRecentContact = !lead.last_contact_date;
      return isGreenOrYellow && noRecentContact;
    }

    const matchesSearch = lead.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                         lead.phone_number?.includes(filters.search) ||
                         lead.city?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesYear = filters.year === "all" || lead.source_year === filters.year;
    // Default: Exclude converted leads unless specifically asked for
    const matchesStatus = filters.status === "all" 
        ? lead.lead_status !== "Converted to Opportunity"
        : lead.lead_status === filters.status;
        
    return matchesSearch && matchesYear && matchesStatus;
  });

  const handleLeadSubmit = (data) => {
    if (editingLead) {
      updateLead.mutate({ id: editingLead.id, data });
    } else {
      createLead.mutate(data);
    }
  };

  const statusColors = {
    "New": "bg-blue-100 text-blue-800",
    "Contact Attempt 1": "bg-yellow-100 text-yellow-800",
    "Contact Attempt 2": "bg-orange-100 text-orange-800",
    "Nurturing": "bg-purple-100 text-purple-800",
    "Unqualified": "bg-gray-100 text-gray-800",
    "Converted to Opportunity": "bg-emerald-100 text-emerald-800"
  };

  const statusLabels = {
    "New": "חדש",
    "Contact Attempt 1": "ניסיון 1",
    "Contact Attempt 2": "ניסיון 2",
    "Nurturing": "טיפוח",
    "Unqualified": "לא רלוונטי",
    "Converted to Opportunity": "הומר להזדמנות"
  };

  const legacyColors = {
    "Green": "bg-green-500",
    "Red": "bg-red-500",
    "Yellow": "bg-yellow-400",
    "Orange": "bg-orange-500"
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 w-full md:w-auto flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="חיפוש שם, טלפון, עיר..." 
              className="pr-9"
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <Select value={filters.year} onValueChange={v => setFilters({...filters, year: v})}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="שנה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל השנים</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={v => setFilters({...filters, status: v})}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              <SelectItem value="New">חדש</SelectItem>
              <SelectItem value="Contact Attempt 1">ניסיון 1</SelectItem>
              <SelectItem value="Converted to Opportunity">הומר להזדמנות</SelectItem>
              <SelectItem value="revival_2023" className="text-orange-600 font-bold">♻️ רשימת החייאה 2023</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowLeadForm(true)} className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
          <Plus className="w-4 h-4 ml-2" />
          הוסף ליד
          </Button>
          <Link to={createPageUrl('ImportLeads')}>
          <Button variant="outline" className="w-full md:w-auto border-slate-300 text-slate-700 hover:bg-slate-100">
              <Upload className="w-4 h-4 ml-2" />
              ייבוא קובץ
          </Button>
          </Link>
          </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[250px] text-right">שם הלקוח</TableHead>
              <TableHead className="text-right">פרטי קשר</TableHead>
              <TableHead className="text-right">סטטוס</TableHead>
              <TableHead className="text-right">שנת מקור</TableHead>
              <TableHead className="text-right">קשר אחרון</TableHead>
              <TableHead className="text-left">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={6} className="text-center py-8">טוען נתונים...</TableCell>
               </TableRow>
            ) : filteredLeads.map((lead) => (
              <TableRow key={lead.id} className="hover:bg-slate-50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${legacyColors[lead.original_status_color] || 'bg-gray-300'}`} title={`Legacy Color: ${lead.original_status_color}`} />
                    <div>
                      <Link to={`${createPageUrl('LeadDetails')}?id=${lead.id}`} className="font-medium text-slate-900 hover:text-blue-600 hover:underline">
                        {lead.full_name}
                      </Link>
                      <p className="text-xs text-slate-500">{lead.city}, בן/בת {lead.age}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-slate-600">
                    <Phone className="w-3 h-3 ml-2" />
                    {lead.phone_number}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusColors[lead.lead_status]}>
                    {statusLabels[lead.lead_status] || lead.lead_status}
                  </Badge>
                </TableCell>
                <TableCell>{lead.source_year}</TableCell>
                <TableCell>
                  <div className="flex items-center text-slate-500 text-sm">
                    <Calendar className="w-3 h-3 ml-2" />
                    {lead.last_contact_date}
                  </div>
                </TableCell>
                <TableCell className="text-left">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingLead(lead); setShowLeadForm(true); }}>
                        ערוך פרטים
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-emerald-600"
                        onClick={() => {
                           setConvertingLead(lead);
                           setShowOppForm(true);
                        }}
                      >
                        <ArrowLeft className="w-4 h-4 ml-2" />
                        המר להזדמנות
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Lead Form Dialog */}
      <Dialog open={showLeadForm} onOpenChange={(open) => {
        setShowLeadForm(open);
        if (!open) setEditingLead(null);
      }}>
        <DialogContent className="max-w-2xl p-0 bg-transparent border-none">
          <LeadForm 
            lead={editingLead} 
            onSubmit={handleLeadSubmit} 
            onCancel={() => setShowLeadForm(false)}
            isSubmitting={createLead.isPending || updateLead.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Opportunity Creation Prompt Dialog */}
      <Dialog open={showOppForm} onOpenChange={(open) => {
        setShowOppForm(open);
        if (!open) setConvertingLead(null);
      }}>
         <DialogContent className="max-w-2xl p-0 bg-transparent border-none">
          {convertingLead && (
            <OpportunityForm 
              initialLead={convertingLead}
              onSubmit={(data) => createOpportunity.mutate(data)}
              onCancel={() => setShowOppForm(false)}
              isSubmitting={createOpportunity.isPending}
              title="כל הכבוד! בוא נפתח הזדמנות חדשה"
            />
          )}
         </DialogContent>
      </Dialog>
    </div>
  );
}