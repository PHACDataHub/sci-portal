const functions = require('@google-cloud/functions-framework');

const {
    parseMessage,
    fetchProjectData,
    getRecipients,
} = require('./backstage');

const {
    sendNotifications,
} = require('./gc_notify');

const {
    GC_NOTIFY_ALERT_TEMPLATE_ID,
    GC_NOTIFY_OVER_BUDGET_TEMPLATE_ID,
    BACKSTAGE_BUDGET_ALERT_EVENTS_TOKEN,
    BACKSTAGE_URI
} = process.env;


/**
 * Handles a budget alert by parsing the CloudEvent message, retrieving project data,
 * determining the notification template ID, and sending notifications to recipients.
 *
 * @param {Object} cloudEvent - The CloudEvent object containing the budget alert message.
 * @return {Promise<void>} A Promise that resolves when the budget alert is handled successfully,
 * or rejects with an error if any step fails.
 */
async function handleBudgetAlert(cloudEvent) {
    const jsonMessage = parseMessage(cloudEvent);
    if (!jsonMessage) return;

    const { budgetDisplayName: projectId, costAmount: amount, budgetAmount, alertThresholdExceeded: thresholdExceeded, currencyCode } = jsonMessage;
    const templateId = thresholdExceeded < 1 ? GC_NOTIFY_ALERT_TEMPLATE_ID : GC_NOTIFY_OVER_BUDGET_TEMPLATE_ID;

    try {
        const data = await fetchProjectData(projectId, BACKSTAGE_BUDGET_ALERT_EVENTS_TOKEN, BACKSTAGE_URI);
        const recipients = getRecipients(data);
        if (!recipients) return;

        const personalisation = {
            threshold: thresholdExceeded * 100,
            project_id: projectId,
            amount,
            currency_code: currencyCode,
            budget_amount: budgetAmount
        };

        await sendNotifications(recipients, templateId, personalisation);

    } catch (error) {
        console.error(`Error processing budget alert for project ${projectId}:`, error);
    }
}

functions.cloudEvent('manageBudgetAlerts', handleBudgetAlert);