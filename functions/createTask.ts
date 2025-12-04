import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed. Use POST.' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    if (!payload.title) {
      return Response.json({ 
        error: 'Missing required field: title'
      }, { status: 400 });
    }

    const taskData = {
      title: payload.title,
      description: payload.description || '',
      status: payload.status || 'todo',
      due_date: payload.due_date || null,
      assigned_to: payload.assigned_to || null,
      related_lead_id: payload.related_lead_id || null,
      related_opportunity_id: payload.related_opportunity_id || null
    };

    const newTask = await base44.asServiceRole.entities.Task.create(taskData);

    return Response.json({
      success: true,
      message: 'Task created successfully',
      task_id: newTask.id,
      data: newTask
    }, { status: 201 });

  } catch (error) {
    return Response.json({ 
      error: 'Failed to create task',
      details: error.message 
    }, { status: 500 });
  }
});