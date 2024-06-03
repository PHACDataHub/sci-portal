const functions = require('@google-cloud/functions-framework');
const NotifyClient = require('notifications-node-client').NotifyClient;

const {
    parseMessage,
    fetchProjectData,
    getRecipients,
} = require('./backstage');

const {
    GC_NOTIFY_API_KEY,
    GC_NOTIFY_ALERT_TEMPLATE_ID,
    GC_NOTIFY_OVER_BUDGET_TEMPLATE_ID,
    BACKSTAGE_BUDGET_ALERT_EVENTS_TOKEN,
    GC_NOTIFY_URI,
    BACKSTAGE_URI
} = process.env;


const notifyClient = new NotifyClient(GC_NOTIFY_URI, GC_NOTIFY_API_KEY);

/**
 * Sends notifications to a list of recipients using a specified template and personalization.
 *
 * @param {string} recipients - A comma-separated string of email addresses to send notifications to.
 * @param {string} templateId - The ID of the notification template to use.
 * @param {Object} personalisation - An object containing personalization values to be used in the notification template.
 * @return {Promise<Array>} A Promise that resolves to an array of results from sending the notifications.
 * @throws {Error} If there was an error sending any of the notifications.
 */
async function sendNotifications(recipients, templateId, personalisation) {
    const recipientList = recipients.split(',');
    const sendPromises = recipientList.map(async recipient => {
        try {
            await notifyClient.sendEmail(templateId, recipient, { personalisation });
        } catch (error) {
            throw new Error(`Unable to send email to ${recipient}:`, error.response.data);
        }
    });

    return Promise.all(sendPromises);
}

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