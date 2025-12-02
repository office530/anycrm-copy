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
  const [editingLead, setEditingLead] = useState(null);
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
      
      if (data.lead_status === 'Converted') {
         convertToOpportunity.mutate(data);
      }
    }
  });

  const updateLead = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['leads']);
      setShowLeadForm(false);
      setEditingLead(null);
      processAutomation('Lead', 'update', data, editingLead);
    }
  });

  const convertToOpportunity = useMutation({
    mutationFn: async (leadData) => {
        // Step 1: Update lead status first
        await base44.entities.Lead.update(leadData.id, { 
            lead_status: "Converted" 
        });

        // Step 2: Create Opportunity with mapped fields
        const newOpp = await base44.entities.Opportunity.create({
            lead_id: leadData.id,
            lead_name: leadData.full_name,
            phone_number: leadData.phone_number, // Mapped from Lead
            email: leadData.email,               // Mapped from Lead (if exists)
            
            // Default Opportunity fields
            product_type: "Reverse Mortgage", 
            property_value: leadData.estimated_property_value || 0,
            loan_amount_requested: 0,
            deal_stage: "New (חדש)",
            probability: 10,
            main_pain_point: "Supplement Monthly Income (השלמת הכנסה חודשית)",
            current_objection: "",
        });

        return newOpp;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['opportunities']);
      queryClient.invalidateQueries(['leads']);
      
      setShowLeadForm(false);
      setEditingLead(null);
      
      // Notify user
      alert("הליד הפך להזדמנות בהצלחה! (The lead was successfully converted to an opportunity)");
      
      processAutomation('Opportunity', 'create', data);
    },
    onError: (error) => {
        console.error("Failed to convert opportunity:", error);
        alert("אירעה שגיאה בהמרת הליד להזדמנות (Error converting lead)");
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
        ? lead.lead_status !== "Converted"
        : lead.lead_status === filters.status;
        
    return matchesSearch && matchesYear && matchesStatus;
  });

  const handleLeadSubmit = (formData) => {
    // Check if user selected "Converted"
    if (formData.lead_status === 'Converted') {
        if (editingLead) {
            // Merge old data with new form data to ensure we have all fields
            const mergedData = { ...editingLead, ...formData };
            convertToOpportunity.mutate(mergedData);
        } else {
            // Create new lead directly as opportunity
            createLead.mutate(formData);
        }
    } else {
        // Standard update/create
        if (editingLead) {
            updateLead.mutate({ id: editingLead.id, data: formData });
        } else {
            createLead.mutate(formData);
        }
    }
  };

  const statusColors = {
    "New": "bg-blue-100 text-blue-800",
    "Attempting Contact": "bg-yellow-100 text-yellow-800",
    "Contacted - Qualifying": "bg-orange-100 text-orange-800",
    "Sales Ready": "bg-purple-100 text-purple-800",
    "Lost / Unqualified": "bg-gray-100 text-gray-800",
    "Converted": "bg-emerald-100 text-emerald-800"
  };

  const statusLabels = {
    "New": "חדש",
    "Attempting Contact": "בטיפול",
    "Contacted - Qualifying": "בירור צרכים",
    "Sales Ready": "בשל למכירה",
    "Lost / Unqualified": "לא רלוונטי",
    "Converted": "הומר להזדמנות"
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
              <SelectItem value="Attempting Contact">בטיפול</SelectItem>
              <SelectItem value="Contacted - Qualifying">בירור צרכים</SelectItem>
              <SelectItem value="Sales Ready">בשל למכירה</SelectItem>
              <SelectItem value="Converted">הומר להזדמנות</SelectItem>
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
                        onClick={() => convertToOpportunity.mutate(lead)}
                        disabled={convertToOpportunity.isPending}
                      >
                        {convertToOpportunity.isPending ? (
                            <span className="flex items-center">מבצע המרה...</span>
                        ) : (
                            <>
                            <ArrowLeft className="w-4 h-4 ml-2" />
                            המר להזדמנות (אוטומטי)
                            </>
                        )}
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

      {/* Opportunity Form removed - Conversion is now automatic */}
    </div>
  );
}