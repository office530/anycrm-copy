import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed. Use POST.' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    if (!payload.lead_id || !payload.type) {
      return Response.json({ 
        error: 'Missing required fields',
        required: ['lead_id', 'type']
      }, { status: 400 });
    }

    const activityData = {
      lead_id: payload.lead_id,
      opportunity_id: payload.opportunity_id || null,
      type: payload.type,
      status: payload.status || 'Completed',
      summary: payload.summary || '',
      date: payload.date || new Date().toISOString()
    };

    const newActivity = await base44.asServiceRole.entities.Activity.create(activityData);

    return Response.json({
      success: true,
      message: 'Activity logged successfully',
      activity_id: newActivity.id,
      data: newActivity
    }, { status: 201 });

  } catch (error) {
    return Response.json({ 
      error: 'Failed to log activity',
      details: error.message 
    }, { status: 500 });
  }
});