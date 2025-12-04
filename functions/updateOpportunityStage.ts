import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  if (req.method !== 'PATCH') {
    return Response.json({ error: 'Method not allowed. Use PATCH.' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    if (!payload.opportunity_id || !payload.deal_stage) {
      return Response.json({ 
        error: 'Missing required fields',
        required: ['opportunity_id', 'deal_stage']
      }, { status: 400 });
    }

    const updateData = {
      deal_stage: payload.deal_stage,
      probability: payload.probability || undefined
    };

    const updatedOpportunity = await base44.asServiceRole.entities.Opportunity.update(
      payload.opportunity_id, 
      updateData
    );

    return Response.json({
      success: true,
      message: 'Opportunity stage updated successfully',
      data: updatedOpportunity
    }, { status: 200 });

  } catch (error) {
    return Response.json({ 
      error: 'Failed to update opportunity stage',
      details: error.message 
    }, { status: 500 });
  }
});