import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

function getRandomDate(daysBack) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
    return date.toISOString();
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // 1. Fetch all leads and filter for Demo Data
        const leads = await base44.entities.Lead.list();
        const demoLeads = leads.filter(l => l.tags && l.tags.includes("Demo Data"));
        
        // 2. Fetch all opportunities
        const opps = await base44.entities.Opportunity.list();
        const demoLeadIds = new Set(demoLeads.map(l => l.id));
        const demoOpps = opps.filter(o => demoLeadIds.has(o.lead_id));

        console.log(`Found ${demoLeads.length} demo leads and ${demoOpps.length} demo opps`);

        // 3. Prepare updates
        const promises = [];

        // Update Leads with random dates
        for (const lead of demoLeads) {
            const simDate = getRandomDate(90);
            promises.push(
                base44.entities.Lead.update(lead.id, {
                    custom_data: { ...lead.custom_data, simulated_date: simDate }
                })
            );
        }

        // Update Opps with random dates
        for (const opp of demoOpps) {
            const simDate = getRandomDate(90);
            promises.push(
                base44.entities.Opportunity.update(opp.id, {
                    custom_data: { ...opp.custom_data, simulated_date: simDate }
                })
            );
        }

        // Execute in batches to avoid rate limits
        const BATCH_SIZE = 10;
        for (let i = 0; i < promises.length; i += BATCH_SIZE) {
            await Promise.all(promises.slice(i, i + BATCH_SIZE));
        }

        return Response.json({ 
            success: true, 
            updated_leads: demoLeads.length, 
            updated_opps: demoOpps.length 
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});