import { base44 } from "@/api/base44Client";

export const processAutomation = async (entityName, eventType, newData, previousData = null) => {
  try {
    console.log(`Processing automation for ${entityName} ${eventType}`, newData);
    
    // Fetch active rules for this entity and event
    const rules = await base44.entities.AutomationRule.filter({
      trigger_entity: entityName,
      trigger_event: eventType,
      is_active: true
    });

    if (!rules || rules.length === 0) return;

    for (const rule of rules) {
      let conditionMet = false;

      // Check conditions
      if (!rule.condition_field) {
        // No condition, always run (e.g. on create)
        conditionMet = true;
      } else {
        const currentValue = newData[rule.condition_field];
        // For update, we might want to check if it CHANGED to this value
        if (eventType === 'update' && previousData) {
            const previousValue = previousData[rule.condition_field];
            if (previousValue !== rule.condition_value && currentValue === rule.condition_value) {
                conditionMet = true;
            }
        } else {
            // For create or simple match
            // For update without previousData, we just check if current value matches (stateless check)
            if (currentValue === rule.condition_value) {
                conditionMet = true;
            }
        }
      }

      if (conditionMet) {
        console.log(`Executing rule: ${rule.name}`);
        await executeAction(rule, newData);
      }
    }
  } catch (error) {
    console.error("Automation Error:", error);
  }
};

const executeAction = async (rule, data) => {
  const config = rule.action_config || {};
  
  // Helper to replace placeholders like {{full_name}}
  const replacePlaceholders = (text) => {
    if (!text) return "";
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        return data[key] !== undefined ? data[key] : "";
    });
  };

  if (rule.action_type === 'send_email') {
    // Handle "Lead" having no email field directly, maybe in custom attributes or use placeholders
    const to = replacePlaceholders(config.email_to);
    
    if (to && to.includes('@')) {
        await base44.integrations.Core.SendEmail({
            to: to,
            subject: replacePlaceholders(config.email_subject),
            body: replacePlaceholders(config.email_body)
        });
    }
  } else if (rule.action_type === 'create_task') {
    const dueDays = Number(config.task_due_days) || 1;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);

    await base44.entities.Task.create({
        title: replacePlaceholders(config.task_title),
        description: replacePlaceholders(config.task_description),
        status: 'todo',
        due_date: dueDate.toISOString().split('T')[0],
        related_lead_id: rule.trigger_entity === 'Lead' ? data.id : (data.lead_id || null),
        related_opportunity_id: rule.trigger_entity === 'Opportunity' ? data.id : null
    });
  }
};