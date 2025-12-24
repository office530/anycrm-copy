import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await req.json();
        const { opportunityId } = payload;

        if (!opportunityId) {
             return Response.json({ error: 'Missing opportunityId' }, { status: 400 });
        }

        // Use service role for consistent behavior and permission bypass for system actions
        const adminClient = base44.asServiceRole;

        // 1. Fetch Opportunity
        const opportunities = await adminClient.entities.Opportunity.list();
        const opportunity = opportunities.find(o => o.id === opportunityId);

        if (!opportunity) {
             return Response.json({ error: 'Opportunity not found' }, { status: 404 });
        }

        if (opportunity.client_id) {
             return Response.json({ message: 'Client already exists for this opportunity', clientId: opportunity.client_id });
        }

        // 2. Fetch Lead
        const leads = await adminClient.entities.Lead.list();
        const lead = leads.find(l => l.id === opportunity.lead_id);

        if (!lead) {
             return Response.json({ error: 'Related Lead not found' }, { status: 404 });
        }

        // 3. Ensure Company Exists
        let companyId = opportunity.company_id || lead.company_id;
        
        // If no linked company but we have a client name that looks like a company, we could create one,
        // but for now we'll assume manual linking or skip if not present.
        // Or if we want to enforce Company creation:
        if (!companyId && opportunity.custom_data?.company_name) {
             const newComp = await adminClient.entities.Company.create({
                 name: opportunity.custom_data.company_name
             });
             companyId = newComp.id;
        }

        // 4. Ensure Contact Exists
        // We check if a contact exists with this email
        let contactId = opportunity.contact_id || lead.contact_id;
        
        if (!contactId && (lead.email || opportunity.email)) {
            const email = lead.email || opportunity.email;
            const contacts = await adminClient.entities.Contact.list();
            const existingContact = contacts.find(c => c.email === email);
            
            if (existingContact) {
                contactId = existingContact.id;
            } else {
                // Create new Contact
                const newContact = await adminClient.entities.Contact.create({
                    full_name: lead.full_name,
                    email: email,
                    phone_number: lead.phone_number || opportunity.phone_number,
                    company_id: companyId, // Link to company if we have it
                    job_title: lead.job_title || "Primary Contact"
                });
                contactId = newContact.id;
            }
        }

        // 5. Prepare Client Data (for CS)
        // Merge documents
        const leadDocs = lead.documents || [];
        const oppDocs = opportunity.documents || [];
        const allDocs = [...leadDocs, ...oppDocs].filter((doc, index, self) => 
            index === self.findIndex((d) => (d.url === doc.url))
        );

        const clientData = {
            crm_lead_id: lead.id,
            crm_opportunity_id: opportunity.id,
            full_name: lead.full_name,
            email: lead.email || opportunity.email,
            phone_number: lead.phone_number || opportunity.phone_number,
            product_type: opportunity.product_type,
            initial_amount: opportunity.amount,
            contract_start_date: new Date().toISOString().split('T')[0],
            onboarding_status: "Not Started",
            customer_segment: (opportunity.amount || 0) > 50000 ? "Key Account" : (opportunity.amount || 0) > 10000 ? "Enterprise" : "SMB", 
            health_score: 100,
            last_engagement_date: new Date().toISOString(),
            renewal_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
            assigned_csm: user.email,
            documents: allDocs,
            // Link to the core CRM entities
            // Note: Client entity schema might not have these fields yet, but we can add them to custom_data or update schema later
            // For now let's just keep the reference
        };

        // 6. Create Client
        const newClient = await adminClient.entities.Client.create(clientData);

        // 7. Update Opportunity with all links
        await adminClient.entities.Opportunity.update(opportunity.id, { 
            client_id: newClient.id,
            company_id: companyId, // Ensure these are synced
            contact_id: contactId
        });

        // 8. Update Lead with all links
        if (lead.lead_status !== "Converted") {
            await adminClient.entities.Lead.update(lead.id, { 
                lead_status: "Converted",
                converted_company_id: companyId,
                converted_contact_id: contactId,
                company_id: companyId, // Sync forward
                contact_id: contactId
            });
        }

        // 9. Create Onboarding Task
        await adminClient.entities.Task.create({
            title: `Onboard new client: ${newClient.full_name}`,
            description: `Complete initial onboarding checklist for ${newClient.full_name}. Source Opportunity: ${opportunity.product_type}`,
            status: "todo",
            priority: "high",
            assigned_to: user.email,
            related_client_id: newClient.id,
            due_date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0]
        });

        return Response.json({ 
            success: true, 
            client: newClient,
            links: { companyId, contactId }
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});