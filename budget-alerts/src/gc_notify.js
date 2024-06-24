const { NotifyClient } = require('notifications-node-client');
const logger = require('./logger');

/** @type {import('notifications-node-client').NotifyClient | undefined} */
let client;

/**
 * @param {string} templateId
 * @param {string} emailAddress
 * @param {import('notifications-node-client').SendEmailOptions} options
 */
const sendEmail = async (templateId, emailAddress, options = {}) => {
  // We cannot instantiate NotifyClient with undefined values. It throws.
  if (!process.env.GC_NOTIFY_API_KEY) {
    throw new Error('The GC_NOTIFY_API_KEY environment variable has not been defined');
  }
  if (!process.env.GC_NOTIFY_URI) {
    throw new Error('The GC_NOTIFY_URI environment variable has not been defined');
  }

  // Instantiate a singleton client.
  if (!client) {
    client = new NotifyClient(process.env.GC_NOTIFY_URI, process.env.GC_NOTIFY_API_KEY);
  }

  try {
    const response = await client.sendEmail(templateId, emailAddress, options);
    logger.info({
      message: `An email has been sent to ${emailAddress}. Inspect the notification at ${response?.data?.uri}.`,
    });
    return response;
  } catch (error) {
    // The error is most likely an AxiosError.
    logger.error({
      message: `An error occurred sending an email to ${emailAddress}.`,
      component: {
        error,
        body: error?.response?.data,
      }
    });
    throw new Error(`Unable to send email to ${emailAddress}`, { cause: error });
  }
};

module.exports = {
  sendEmail,
};
