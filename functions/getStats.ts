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
    const winRate = totalOpportunities > 0 ? ((wonDeals / totalOpportunities) * 100).toFixed(1) : 0;

    const totalRevenue = opportunities
      .filter(o => o.deal_stage?.includes('Won') || o.deal_stage?.includes('בהצלחה'))
      .reduce((sum, o) => sum + (o.loan_amount_requested || 0), 0);

    const pipelineValue = opportunities
      .filter(o => !o.deal_stage?.includes('Won') && !o.deal_stage?.includes('Lost') && !o.deal_stage?.includes('אבוד'))
      .reduce((sum, o) => sum + (o.loan_amount_requested || 0), 0);

    const weightedPipeline = opportunities
      .filter(o => !o.deal_stage?.includes('Won') && !o.deal_stage?.includes('Lost'))
      .reduce((sum, o) => sum + ((o.loan_amount_requested || 0) * ((o.probability || 0) / 100)), 0);

    return Response.json({
      success: true,
      data: {
        leads: {
          total: totalLeads,
          converted: convertedLeads,
          conversion_rate: parseFloat(conversionRate)
        },
        opportunities: {
          total: totalOpportunities,
          won: wonDeals,
          win_rate: parseFloat(winRate)
        },
        revenue: {
          total_won: totalRevenue,
          pipeline_value: pipelineValue,
          weighted_pipeline: weightedPipeline
        }
      }
    }, { status: 200 });

  } catch (error) {
    return Response.json({ 
      error: 'Failed to fetch stats',
      details: error.message 
    }, { status: 500 });
  }
});