import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  if (req.method !== 'PATCH') {
    return Response.json({ error: 'Method not allowed. Use PATCH.' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    if (!payload.lead_id) {
      return Response.json({ 
        error: 'Missing required field: lead_id'
      }, { status: 400 });
    }

    const { lead_id, ...updateData } = payload;
    
    const updatedLead = await base44.asServiceRole.entities.Lead.update(lead_id, updateData);

    return Response.json({
      success: true,
      message: 'Lead updated successfully',
      data: updatedLead
    }, { status: 200 });

  } catch (error) {
    return Response.json({ 
      error: 'Failed to update lead',
      details: error.message 
    }, { status: 500 });
  }
});