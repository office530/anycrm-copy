import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        // We use service role to ensure we can read all opportunities and update them regardless of owner if needed,
        // but for safety let's stick to user auth if possible, or assume admin is running this.
        // Actually, for a background migration, user auth is fine if the user is admin.
        
        const user = await base44.auth.me();
        if (!user) {
             return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Fetch all Won Opportunities that don't have a client_id
        // Filter support might be limited for "is_empty", so we'll fetch list and filter in memory for complex checks
        const opportunities = await base44.entities.Opportunity.list();
        const leads = await base44.entities.Lead.list();

        const wonOpportunities = opportunities.filter(o => 
            (o.deal_stage && o.deal_stage.includes('Won')) && !o.client_id
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
                    assigned_csm: user.email, 
                    documents: allDocs
                };

                // Create Client
                const newClient = await base44.entities.Client.create(clientData);

                // Update Opportunity
                await base44.entities.Opportunity.update(opportunity.id, { client_id: newClient.id });
                
                // Update Lead if needed
                if (lead.lead_status !== "Converted") {
                    await base44.entities.Lead.update(lead.id, { lead_status: "Converted" });
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