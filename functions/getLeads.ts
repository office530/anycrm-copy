import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  if (req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed. Use GET.' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const filters = {};
    
    // Query parameters
    const leadStatus = url.searchParams.get('lead_status');
    const sourceYear = url.searchParams.get('source_year');
    const city = url.searchParams.get('city');
    const limit = url.searchParams.get('limit') || '100';
    
    if (leadStatus) filters.lead_status = leadStatus;
    if (sourceYear) filters.source_year = sourceYear;
    if (city) filters.city = city;
    
    let leads = await base44.asServiceRole.entities.Lead.filter(filters);
    
    // Apply limit
    leads = leads.slice(0, parseInt(limit));
    
    return Response.json({
      success: true,
      count: leads.length,
      data: leads
    }, { status: 200 });

  } catch (error) {
    return Response.json({ 
      error: 'Failed to fetch leads',
      details: error.message 
    }, { status: 500 });
  }
});