import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed. Use POST.' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    
    if (!payload.lead_id || !payload.product_type) {
      return Response.json({ 
        error: 'Missing required fields',
        required: ['lead_id', 'product_type']
      }, { status: 400 });
    }

    const opportunityData = {
      lead_id: payload.lead_id,
      lead_name: payload.lead_name || '',
      phone_number: payload.phone_number || '',
      email: payload.email || '',
      product_type: payload.product_type,
      deal_stage: payload.deal_stage || 'New (חדש)',
      probability: payload.probability || 10,
      property_value: payload.property_value || null,
      loan_amount_requested: payload.loan_amount_requested || null,
      expected_close_date: payload.expected_close_date || null,
      next_task: payload.next_task || null,
      main_pain_point: payload.main_pain_point || null
    };

    const newOpportunity = await base44.asServiceRole.entities.Opportunity.create(opportunityData);

    return Response.json({
      success: true,
      message: 'Opportunity created successfully',
      opportunity_id: newOpportunity.id,
      data: newOpportunity
    }, { status: 201 });

  } catch (error) {
    return Response.json({ 
      error: 'Failed to create opportunity',
      details: error.message 
    }, { status: 500 });
  }
});