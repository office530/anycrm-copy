import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  if (req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed. Use GET.' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const leadId = url.searchParams.get('id');
    
    if (!leadId) {
      return Response.json({ 
        error: 'Missing required parameter: id'
      }, { status: 400 });
    }

    const leads = await base44.asServiceRole.entities.Lead.filter({ id: leadId });
    
    if (!leads || leads.length === 0) {
      return Response.json({ 
        error: 'Lead not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: leads[0]
    }, { status: 200 });

  } catch (error) {
    return Response.json({ 
      error: 'Failed to fetch lead',
      details: error.message 
    }, { status: 500 });
  }
});