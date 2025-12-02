import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import LeadForm from "@/components/crm/LeadForm";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function LeadDetailsPage() {
  const queryParams = new URLSearchParams(window.location.search);
  const leadId = queryParams.get('id');
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
      // Also invalidate list
      queryClient.invalidateQueries(['leads']);
    }
  });

  if (!leadId) return <div className="p-8 text-center">לא נבחר ליד</div>;
  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;
  if (!lead) return <div className="p-8 text-center">הליד לא נמצא</div>;

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Leads')}>
            <Button variant="outline" size="icon">
                <ArrowRight className="w-4 h-4" />
            </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">תיק לקוח: {lead.full_name}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-1">
        <LeadForm 
            lead={lead} 
            onSubmit={(data) => updateLead.mutate({ id: lead.id, data })}
            onCancel={() => window.history.back()} // Or navigate back
            isSubmitting={updateLead.isPending}
        />
      </div>
    </div>
  );
}