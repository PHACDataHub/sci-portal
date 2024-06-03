const NotifyClient = require('notifications-node-client').NotifyClient;

const {
    GC_NOTIFY_API_KEY,
    GC_NOTIFY_URI,
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


module.exports = {
    sendNotifications,
};