import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { leadId, companyId, companyName, createNewCompany } = await req.json();

        if (!leadId) {
            return Response.json({ error: 'Lead ID is required' }, { status: 400 });
        }

        // 1. Get the Lead
        const leads = await base44.entities.Lead.list({ id: leadId });
        const lead = leads[0];
        
        if (!lead) {
            return Response.json({ error: 'Lead not found' }, { status: 404 });
        }

        let targetCompanyId = companyId;

        // 2. Create Company if needed
        if (createNewCompany && companyName) {
            const newCompany = await base44.entities.Company.create({
                name: companyName,
                assigned_to: lead.assigned_to || user.email,
                lifecycle_stage: 'Lead'
            });
            targetCompanyId = newCompany.id;
        }

        // 3. Create Contact
        const newContact = await base44.entities.Contact.create({
            company_id: targetCompanyId, // Can be null if no company linked yet
            full_name: lead.full_name,
            email: lead.email,
            phone_number: lead.phone_number,
            notes: lead.notes,
            assigned_to: lead.assigned_to || user.email,
            status: 'Active'
        });

        // 4. Create Opportunity (Optional - good practice to auto-create)
        const newOpportunity = await base44.entities.Opportunity.create({
            company_id: targetCompanyId,
            contact_id: newContact.id,
            lead_id: lead.id, // Keep trace
            product_type: "Other", // Default
            deal_stage: "New",
            amount: 0,
            probability: 10,
            expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +30 days
        });

        // 5. Update Lead as Converted
        await base44.entities.Lead.update(lead.id, {
            lead_status: 'Converted',
            is_converted: true,
            converted_company_id: targetCompanyId,
            converted_contact_id: newContact.id
        });

        return Response.json({ 
            success: true,
            companyId: targetCompanyId,
            contactId: newContact.id,
            opportunityId: newOpportunity.id
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});