import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import LeadForm from "@/components/crm/LeadForm";
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LeadDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const leadId = queryParams.get('id') || queryParams.get('leadId');
  const queryClient = useQueryClient();

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      // Since .get(id) isn't explicitly documented in the prompt's examples but usually exists,
      // I'll use filter or list. But usually list() returns all.
      // Best practice from prompt: base44.entities.Lead.list() and find, OR filter.
      // Actually, usually there is a .get(id). If not, I'll filter.
      // Let's try filter by ID which is safer if get isn't available.
      const leads = await base44.entities.Lead.filter({ id: leadId });
      return leads[0];
    },
    enabled: !!leadId
  });

  const updateLead = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['lead', leadId]);
      queryClient.invalidateQueries(['leads']);
      navigate(createPageUrl('Leads'));
    }
  });

  const handleClose = () => {
    navigate(createPageUrl('Leads'));
  };

  if (!leadId) {
    navigate(createPageUrl('Leads'));
    return null;
  }

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;
  if (!lead) {
    navigate(createPageUrl('Leads'));
    return null;
  }

  return (
    <Dialog open={!!lead} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl p-0 bg-transparent border-none">
        <LeadForm 
          lead={lead} 
          onSubmit={(data) => updateLead.mutate({ id: lead.id, data })}
          onCancel={handleClose}
          isSubmitting={updateLead.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}