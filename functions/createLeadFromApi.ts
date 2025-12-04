import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed. Use POST.' }, { status: 405 });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    // Parse the incoming lead data
    const payload = await req.json();
    
    // Validate required fields
    if (!payload.full_name || !payload.phone_number) {
      return Response.json({ 
        error: 'Missing required fields',
        required: ['full_name', 'phone_number']
      }, { status: 400 });
    }

    // Prepare lead data with defaults
    const leadData = {
      full_name: payload.full_name,
      phone_number: payload.phone_number,
      email: payload.email || null,
      city: payload.city || null,
      age: payload.age || null,
      source_year: payload.source_year || new Date().getFullYear().toString(),
      lead_status: payload.lead_status || 'New',
      notes: payload.notes || '',
      tags: payload.tags || [],
      marital_status: payload.marital_status || null,
      estimated_property_value: payload.estimated_property_value || null,
      existing_mortgage_balance: payload.existing_mortgage_balance || null,
      has_children: payload.has_children || false,
      spouse_age: payload.spouse_age || null
    };

    // Create the lead using service role (no user auth required for API)
    const newLead = await base44.asServiceRole.entities.Lead.create(leadData);

    return Response.json({
      success: true,
      message: 'Lead created successfully',
      lead_id: newLead.id,
      data: newLead
    }, { status: 201 });

  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ 
      error: 'Failed to create lead',
      details: error.message 
    }, { status: 500 });
  }
});