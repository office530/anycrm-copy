import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  if (req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed. Use GET.' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    // Parse query parameters for filtering
    const url = new URL(req.url);
    const filters = {};
    
    // Optional filters
    const dealStage = url.searchParams.get('deal_stage');
    const leadId = url.searchParams.get('lead_id');
    const minProbability = url.searchParams.get('min_probability');
    const productType = url.searchParams.get('product_type');
    
    if (dealStage) filters.deal_stage = dealStage;
    if (leadId) filters.lead_id = leadId;
    if (productType) filters.product_type = productType;
    
    // Get opportunities using service role
    let opportunities = await base44.asServiceRole.entities.Opportunity.filter(filters);
    
    // Apply probability filter if provided
    if (minProbability) {
      const minProb = parseInt(minProbability);
      opportunities = opportunities.filter(opp => (opp.probability || 0) >= minProb);
    }
    
    // Sort by created_date descending
    opportunities.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    
    return Response.json({
      success: true,
      count: opportunities.length,
      data: opportunities
    }, { status: 200 });

  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ 
      error: 'Failed to fetch opportunities',
      details: error.message 
    }, { status: 500 });
  }
});