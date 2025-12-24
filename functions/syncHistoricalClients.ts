import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Use service role for migration to bypass RLS and ensure all data is processed
        const adminClient = base44.asServiceRole;

        // 1. Fetch all Won Opportunities that don't have a client_id
        const opportunities = await adminClient.entities.Opportunity.list();
        const leads = await adminClient.entities.Lead.list();

        const wonOpportunities = opportunities.filter(o => 
            (o.deal_stage && (o.deal_stage.includes('Won') || o.deal_stage === 'Closed Won')) && !o.client_id
        );

        let processedCount = 0;
        const errors = [];

        for (const opportunity of wonOpportunities) {
            try {
                const lead = leads.find(l => l.id === opportunity.lead_id);
                if (!lead) {
                    errors.push(`Lead not found for opportunity ${opportunity.id}`);
                    continue;
                }

                // Prepare Client Data
                const leadDocs = lead.documents || [];
                const oppDocs = opportunity.documents || [];
                const allDocs = [...leadDocs, ...oppDocs].filter((doc, index, self) => 
                    index === self.findIndex((d) => (d.url === doc.url))
                );

                const clientData = {
                    crm_lead_id: lead.id,
                    crm_opportunity_id: opportunity.id,
                    full_name: lead.full_name,
                    email: lead.email || opportunity.email,
                    phone_number: lead.phone_number || opportunity.phone_number,
                    product_type: opportunity.product_type,
                    initial_amount: opportunity.amount,
                    contract_start_date: opportunity.updated_date ? opportunity.updated_date.split('T')[0] : new Date().toISOString().split('T')[0],
                    onboarding_status: "Not Started",
                    customer_segment: (opportunity.amount || 0) > 50000 ? "Key Account" : (opportunity.amount || 0) > 10000 ? "Enterprise" : "SMB",
                    health_score: 100,
                    last_engagement_date: opportunity.updated_date || new Date().toISOString(),
                    renewal_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                    // For migration, we might not have a specific CSM, so we can leave it empty or assign to a default admin if we knew one. 
                    // Let's leave assigned_csm empty or use 'system' if needed, but schema doesn't require it.
                    documents: allDocs
                };

                // Create Client
                const newClient = await adminClient.entities.Client.create(clientData);

                // Update Opportunity
                await adminClient.entities.Opportunity.update(opportunity.id, { client_id: newClient.id });
                
                // Update Lead if needed
                if (lead.lead_status !== "Converted") {
                    await adminClient.entities.Lead.update(lead.id, { lead_status: "Converted" });
                }

                processedCount++;

            } catch (err) {
                console.error(`Failed to process opportunity ${opportunity.id}:`, err);
                errors.push(`Error processing ${opportunity.id}: ${err.message}`);
            }
        }

        return Response.json({ 
            success: true, 
            processed: processedCount, 
            total_found: wonOpportunities.length,
            errors 
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});