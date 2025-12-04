import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  if (req.method !== 'GET') {
    return Response.json({ error: 'Method not allowed. Use GET.' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const filters = {};
    
    const status = url.searchParams.get('status');
    const assignedTo = url.searchParams.get('assigned_to');
    const leadId = url.searchParams.get('lead_id');
    
    if (status) filters.status = status;
    if (assignedTo) filters.assigned_to = assignedTo;
    if (leadId) filters.related_lead_id = leadId;
    
    let tasks = await base44.asServiceRole.entities.Task.filter(filters);
    
    // Sort by due_date
    tasks.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    });

    return Response.json({
      success: true,
      count: tasks.length,
      data: tasks
    }, { status: 200 });

  } catch (error) {
    return Response.json({ 
      error: 'Failed to fetch tasks',
      details: error.message 
    }, { status: 500 });
  }
});