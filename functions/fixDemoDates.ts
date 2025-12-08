import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

function getRandomDate(daysBack) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
    return date.toISOString();
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const leads = await base44.entities.Lead.list();
        const demoLeads = leads.filter(l => l.tags && l.tags.includes("Demo Data"));
        
        const opps = await base44.entities.Opportunity.list();
        const demoLeadIds = new Set(demoLeads.map(l => l.id));
        const demoOpps = opps.filter(o => demoLeadIds.has(o.lead_id));

        console.log(`Updating ${demoLeads.length} leads and ${demoOpps.length} opps`);

        let updatedLeads = 0;
        let updatedOpps = 0;

        // Serial execution to be safe
        for (const lead of demoLeads) {
            try {
                const simDate = getRandomDate(90);
                // Ensure custom_data is an object
                const currentCustom = lead.custom_data && typeof lead.custom_data === 'object' ? lead.custom_data : {};
                await base44.entities.Lead.update(lead.id, {
                    custom_data: { ...currentCustom, simulated_date: simDate }
                });
                updatedLeads++;
            } catch (e) {
                console.error(`Failed lead ${lead.id}: ${e.message}`);
            }
        }

        for (const opp of demoOpps) {
            try {
                const simDate = getRandomDate(90);
                const currentCustom = opp.custom_data && typeof opp.custom_data === 'object' ? opp.custom_data : {};
                await base44.entities.Opportunity.update(opp.id, {
                    custom_data: { ...currentCustom, simulated_date: simDate }
                });
                updatedOpps++;
            } catch (e) {
                console.error(`Failed opp ${opp.id}: ${e.message}`);
            }
        }

        return Response.json({ success: true, updated_leads: updatedLeads, updated_opps: updatedOpps });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});