import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  if (req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed. Use GET.' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    const [leads, opportunities] = await Promise.all([
      base44.asServiceRole.entities.Lead.list(),
      base44.asServiceRole.entities.Opportunity.list()
    ]);

    const totalLeads = leads.length;
    const convertedLeads = leads.filter(l => l.lead_status === 'Converted').length;
    const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0;

    const totalOpportunities = opportunities.length;
    const wonDeals = opportunities.filter(o => 
      o.deal_stage?.includes('Won') || o.deal_stage?.includes('בהצלחה')
    ).length;
    const lostDeals = opportunities.filter(o => 
      o.deal_stage?.includes('Lost') || o.deal_stage?.includes('אבוד')
    ).length;
    const winRate = totalOpportunities > 0 ? ((wonDeals / totalOpportunities) * 100).toFixed(1) : 0;

    // Funnel data
    const funnel = [
      { stage: 'Total Leads', count: totalLeads },
      { stage: 'Converted to Opportunities', count: convertedLeads },
      { stage: 'Total Opportunities', count: totalOpportunities },
      { stage: 'Won Deals', count: wonDeals }
    ];

    // By product type
    const byProduct = {};
    opportunities.forEach(o => {
      const product = o.product_type || 'Unknown';
      if (!byProduct[product]) {
        byProduct[product] = { total: 0, won: 0, lost: 0 };
      }
      byProduct[product].total++;
      if (o.deal_stage?.includes('Won') || o.deal_stage?.includes('בהצלחה')) {
        byProduct[product].won++;
      }
      if (o.deal_stage?.includes('Lost') || o.deal_stage?.includes('אבוד')) {
        byProduct[product].lost++;
      }
    });

    return Response.json({
      success: true,
      data: {
        overview: {
          total_leads: totalLeads,
          converted_leads: convertedLeads,
          conversion_rate: parseFloat(conversionRate),
          total_opportunities: totalOpportunities,
          won_deals: wonDeals,
          lost_deals: lostDeals,
          win_rate: parseFloat(winRate)
        },
        funnel,
        by_product: byProduct
      }
    }, { status: 200 });

  } catch (error) {
    return Response.json({ 
      error: 'Failed to fetch conversion report',
      details: error.message 
    }, { status: 500 });
  }
});