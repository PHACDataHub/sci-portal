const functions = require('@google-cloud/functions-framework');
const NotifyClient = require('notifications-node-client').NotifyClient;

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
 * Parses a CloudEvent message and returns the parsed JSON object.
 *
 * @param {Object} cloudEvent - The CloudEvent object containing the message data.
 * @return {Object|undefined} The parsed JSON object if the message is valid, undefined otherwise.
 */
function parseMessage(cloudEvent) {
    const message_base64 = cloudEvent.data.message.data;
    if (!message_base64) return undefined;

    const message = Buffer.from(message_base64, 'base64').toString();
    return JSON.parse(message);
}

/**
 * Fetches project data for a given project ID from the backstage API.
 *
 * @param {string} projectId - The ID of the project to fetch data for.
 * @return {Promise<Object>} A Promise that resolves to the project data as a JSON object.
 * @throws {Error} If the API request fails or returns a non-2xx status code.
 */
async function fetchProjectData(projectId) {
    const url = `${BACKSTAGE_URI}/api/catalog/entities/by-name/component/default/${projectId}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BACKSTAGE_BUDGET_ALERT_EVENTS_TOKEN}`,
    };

    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
        throw new Error(`Status:${response.status} - Failed to fetch project data for project ${projectId}`);
    }

    return response.json();
}

/**
 * Retrieves the recipients for budget alerts from the given data object.
 *
 * @param {Object} data - The data object containing metadata annotations.
 * @return {string|undefined} The recipients for budget alerts, or undefined if not found.
 */
function getRecipients(data) {
    return data.metadata.annotations['data-science-portal.phac-aspc.gc.ca/budget-alert-recipients'];
}

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
        const data = await fetchProjectData(projectId);
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