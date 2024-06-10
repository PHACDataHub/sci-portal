const NotifyClient = require('notifications-node-client').NotifyClient;

/** @type {import('notifications-node-client').NotifyClient | undefined} */
let client;

/**
 * Sends an email to a list of recipients using the specified template and data.
 *
 * @param {string} templateId
 * @param {string[]} recipients
 * @param {Object} personalisation - An object containing personalization values to be used in the notification template.
 *
 * @return {Promise<Array<undefined | Error>} A Promise that resolves to an array of results from sending the notifications.
 */
async function sendEmail(templateId, recipients, personalisation) {
  if (!client) {
    const { GC_NOTIFY_API_KEY, GC_NOTIFY_URI } = process.env;
    client = new NotifyClient(GC_NOTIFY_URI, GC_NOTIFY_API_KEY);
    if (!GC_NOTIFY_API_KEY) {
      console.error('GC_NOTIFY_API_KEY has not been set');
    }
    if (!GC_NOTIFY_URI) {
      console.error('GC_NOTIFY_URI has not been set');
    }
  }

  const sendPromises = recipients.map(async recipient => {
    try {
      const response = await client.sendEmail(templateId, recipient, { personalisation });
      console.log(`An email has been sent to ${recipient}. Inspect the notification at ${response?.uri}.`);
    } catch (error) {
      throw new Error(
        `Unable to send email to ${recipient}`,
        error.response.data,
      );
    }
  });

  return Promise.allSettled(sendPromises);
}

module.exports = {
  sendEmail,
};
