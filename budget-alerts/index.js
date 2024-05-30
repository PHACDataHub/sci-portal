const functions = require('@google-cloud/functions-framework');
const NotifyClient = require('notifications-node-client').NotifyClient

const { GC_NOTIFY_API_KEY, GC_NOTIFY_ALERT_TEMPLATE_ID, GC_NOTIFY_OVER_BUDGET_TEMPLATE_ID, BACKSTAGE_BUDGET_ALERT_EVENTS_TOKEN, GC_NOTIFY_URI, BACKSTAGE_URI } = process.env;
const notifyClient = new NotifyClient(GC_NOTIFY_URI, GC_NOTIFY_API_KEY);

functions.cloudEvent('manageBudgetAlerts', async cloudEvent => {

    const message_base64 = cloudEvent.data.message.data;
    const message = message_base64
        ? Buffer.from(message_base64, 'base64').toString()
        : undefined;

    if (!message) {
        return;
    }

    const jsonMessage = JSON.parse(message);

    const projectId = jsonMessage["budgetDisplayName"];
    const amount = jsonMessage["costAmount"];
    const budgetAmount = jsonMessage["budgetAmount"];
    const thresholdExceeded = jsonMessage["alertThresholdExceeded"];
    const currencyCode = jsonMessage["currencyCode"];

    const TEMPLATE_ID = thresholdExceeded < 1 ? GC_NOTIFY_ALERT_TEMPLATE_ID : GC_NOTIFY_OVER_BUDGET_TEMPLATE_ID;

    const url = `${BACKSTAGE_URI}/api/catalog/entities/by-name/component/default/${projectId}`;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BACKSTAGE_BUDGET_ALERT_EVENTS_TOKEN}`,
    };


    // Need to handle scenarios where Backstage is not reachable or when GC Notify is not reachable.
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: headers
        });
        const data = await response.json();
        const recipients = data.metadata.annotations['data-science-portal.phac-aspc.gc.ca/budget-alert-recipients'];
        if (!recipients) {
            return;
        }
        recipients.split(',').forEach(async recipient => {
            console.log(`Sending email to ${recipient}`);
            try {
                await notifyClient
                    .sendEmail(TEMPLATE_ID, recipient,
                        {
                            personalisation: {
                                "threshold": thresholdExceeded * 100,
                                "project_id": projectId,
                                "amount": amount,
                                "currency_code": currencyCode,
                                "budget_amount": budgetAmount
                            },
                        }
                    );
            } catch (error) {
                throw new Error(`Error unable to send email to ${recipient}.`, error);
            }
        });

    } catch (error) {
        console.log(error);
        throw new Error(`Error unable to fetch project:${projectId} catalog.`, error);
    }
});