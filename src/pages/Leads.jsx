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
  Filter, 
  Phone, 
  MoreHorizontal,
  ArrowRight,
  Calendar
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

export default function LeadsPage() {
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showOppForm, setShowOppForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [convertingLead, setConvertingLead] = useState(null); // For the auto-prompt logic
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
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      setShowLeadForm(false);
    }
  });

  const updateLead = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['leads']);
      setShowLeadForm(false);
      setEditingLead(null);
      
      // Automation Logic: If converting to opportunity, prompt user
      if (variables.data.lead_status === 'Converted to Opportunity') {
        setConvertingLead(data);
        setShowOppForm(true);
      }
    }
  });

  const createOpportunity = useMutation({
    mutationFn: (data) => base44.entities.Opportunity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['opportunities']);
      setShowOppForm(false);
      setConvertingLead(null);
    }
  });

  // Filtering Logic
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.full_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                         lead.phone_number?.includes(filters.search) ||
                         lead.city?.toLowerCase().includes(filters.search.toLowerCase());
    const matchesYear = filters.year === "all" || lead.source_year === filters.year;
    const matchesStatus = filters.status === "all" || lead.lead_status === filters.status;
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search name, phone, city..." 
              className="pl-9"
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})}
            />
          </div>
          <Select value={filters.year} onValueChange={v => setFilters({...filters, year: v})}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={v => setFilters({...filters, status: v})}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Contact Attempt 1">Attempt 1</SelectItem>
              <SelectItem value="Converted to Opportunity">Converted</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowLeadForm(true)} className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[250px]">Client Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
               </TableRow>
            ) : filteredLeads.map((lead) => (
              <TableRow key={lead.id} className="hover:bg-slate-50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${legacyColors[lead.original_status_color] || 'bg-gray-300'}`} title={`Legacy Color: ${lead.original_status_color}`} />
                    <div>
                      <p className="font-medium text-slate-900">{lead.full_name}</p>
                      <p className="text-xs text-slate-500">{lead.city}, {lead.age}yo</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-slate-600">
                    <Phone className="w-3 h-3 mr-2" />
                    {lead.phone_number}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusColors[lead.lead_status]}>
                    {lead.lead_status}
                  </Badge>
                </TableCell>
                <TableCell>{lead.source_year}</TableCell>
                <TableCell>
                  <div className="flex items-center text-slate-500 text-sm">
                    <Calendar className="w-3 h-3 mr-2" />
                    {lead.last_contact_date}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingLead(lead); setShowLeadForm(true); }}>
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-emerald-600"
                        onClick={() => {
                           updateLead.mutate({ 
                             id: lead.id, 
                             data: { ...lead, lead_status: "Converted to Opportunity" } 
                           });
                        }}
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Convert to Opportunity
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
              title="Great Job! Now Create the Opportunity"
            />
          )}
         </DialogContent>
      </Dialog>
    </div>
  );
}