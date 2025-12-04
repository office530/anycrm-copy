import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  if (req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed. Use GET.' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const filters = {};
    
    const leadId = url.searchParams.get('lead_id');
    const opportunityId = url.searchParams.get('opportunity_id');
    const type = url.searchParams.get('type');
    
    if (leadId) filters.lead_id = leadId;
    if (opportunityId) filters.opportunity_id = opportunityId;
    if (type) filters.type = type;
    
    let activities = await base44.asServiceRole.entities.Activity.filter(filters);
    
    // Sort by date descending
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    return Response.json({
      success: true,
      count: activities.length,
      data: activities
    }, { status: 200 });

  } catch (error) {
    return Response.json({ 
      error: 'Failed to fetch activities',
      details: error.message 
    }, { status: 500 });
  }
});