import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const FIRST_NAMES = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen", "Lisa", "Nancy", "Betty", "Margaret", "Sandra"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Garcia", "Martinez", "Robinson"];
const SOURCES = ["Google Ads", "Facebook", "Referral", "Website", "LinkedIn", "Webinar", "Cold Call"];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(daysBack) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
    return date.toISOString();
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me(); // Ensure auth

        const createdLeads = [];
        const createdOpps = [];

        const TOTAL_RECORDS = 40;
        const BATCH_SIZE = 5;

        for (let i = 0; i < TOTAL_RECORDS; i += BATCH_SIZE) {
            const batchPromises = [];
            
            for (let j = 0; j < BATCH_SIZE && (i + j) < TOTAL_RECORDS; j++) {
                batchPromises.push((async () => {
                    const firstName = getRandomElement(FIRST_NAMES);
                    const lastName = getRandomElement(LAST_NAMES);
                    const fullName = `${firstName} ${lastName}`;
                    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${getRandomInt(1, 999)}@example.com`;
                    const source = getRandomElement(SOURCES);
                    const createdDate = getRandomDate(90);
                    
                    // Determine Status Group
                    const rand = Math.random();
                    let leadStatus, dealStage, probability, leadTemp;

                    if (rand < 0.2) {
                        leadStatus = "New";
                        dealStage = "New";
                        probability = 10;
                        leadTemp = "Cold";
                    } else if (rand < 0.5) {
                        leadStatus = getRandomElement(["Attempting Contact", "Contacted - Qualifying", "Sales Ready"]);
                        dealStage = getRandomElement(["Discovery", "Proposal", "Negotiation"]);
                        probability = dealStage === "Discovery" ? 20 : dealStage === "Proposal" ? 50 : 75;
                        leadTemp = "Warm";
                    } else if (rand < 0.8) {
                        leadStatus = "Converted";
                        dealStage = "Closed Won";
                        probability = 100;
                        leadTemp = "Hot History";
                    } else {
                        leadStatus = "Lost / Unqualified";
                        dealStage = "Closed Lost";
                        probability = 0;
                        leadTemp = "Cold";
                    }

                    // Create Lead
                    const leadData = {
                        full_name: fullName,
                        email: email,
                        phone_number: `555-0${getRandomInt(100, 999)}`,
                        age: getRandomInt(28, 75),
                        city: getRandomElement(["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"]),
                        source_year: "2024",
                        lead_status: leadStatus,
                        lead_temperature: leadTemp,
                        notes: `Source: ${source}. Interested in ${getRandomElement(["Consulting", "Software", "Service"])}.`,
                        tags: ["Demo Data", source],
                        created_date: createdDate
                    };

                    const lead = await base44.entities.Lead.create(leadData);
                    createdLeads.push(lead);

                    // Create Opportunity
                    const bigAmount = getRandomInt(500000, 2500000);

                    const oppData = {
                        lead_id: lead.id,
                        lead_name: fullName,
                        email: email,
                        phone_number: leadData.phone_number,
                        product_type: getRandomElement(["Consulting", "Service", "Product", "Software"]),
                        amount: bigAmount,
                        deal_stage: dealStage,
                        probability: probability,
                        expected_close_date: getRandomDate(-30),
                        main_pain_point: getRandomElement(["Budget", "Timeline", "Features", "Authority", "Need"]),
                        created_date: createdDate
                    };
                    
                    const opp = await base44.entities.Opportunity.create(oppData);
                    createdOpps.push(opp);
                })());
            }

            await Promise.all(batchPromises);
        }

        return Response.json({ 
            success: true, 
            message: `Created ${createdLeads.length} leads and ${createdOpps.length} opportunities`,
            sample_lead: createdLeads[0],
            sample_opp: createdOpps[0]
        });

    } catch (error) {
        return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
});