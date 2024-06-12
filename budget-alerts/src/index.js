const functions = require('@google-cloud/functions-framework');

const { getBudgetAlertRecipients } = require('./backstage');
const { parseMessage } = require('./cloud_events');
const { sendEmail } = require('./gc_notify');
const { validateIfAlertEmailSent } = require('./cloud_storage_interact');

const { GC_NOTIFY_ALERT_TEMPLATE_ID, GC_NOTIFY_OVER_BUDGET_TEMPLATE_ID } =
  process.env;

/**
 * Returns true when the budget is less than 100% spent.
 * @param {import('./cloud_events').BudgetAlertNotification} notification
 */
const isUnderBudget = notification => notification.alertThresholdExceeded < 1.0;

/**
 * Sends Budget Alert emails using GC Notify.
 *
 * @param {Object} cloudEvent - The CloudEvent object containing the budget alert message.
 * @return {Promise<void>} A Promise that resolves when the budget alert is handled successfully,
 * or rejects with an error if any step fails.
 */
async function sendBudgetAlerts(cloudEvent) {
  const message = parseMessage(cloudEvent);
  if (!message) {
    console.error('The message did not contain the expected data');
    console.log('Exiting with no message to process.');
    return;
  }

  // By convention the budget Display Name is the Project ID.
  const projectId = message.budgetDisplayName;

  const cost = message.costAmount.toFixed(2);
  const budget = message.budgetAmount.toFixed(2);
  const percentage = (100 * (message.alertThresholdExceeded ?? (message.costAmount / message.budgetAmount))).toFixed(0);
  const currencyCode = message.currencyCode;

  console.log(JSON.stringify({
    severity: 'INFO',
    message: `Handling a message for project ID ${projectId}. The project has used ${percentage}% of the $${budget} ${currencyCode} budget ($${cost} ${currencyCode}).`,
    component: {
      message,

      // Include the base64 encoded message for manual testing.
      data: cloudEvent.data.message.data,
    },
  }));

  // This key is not present if the actual cost does not exceed a threshold.
  // We can expect messages multiple times per day with the current status.
  if (!message.alertThresholdExceeded) {
    console.log('Exiting with threshold exceeded message to process.');
    return;
  }

  // Check if email sent for the current threshold + costIntervalStart combination previously
  // Read the boolean value into the sendEmail variable and use variable value to exit in case set to false
  const sendEmail = JSON.parse(validateIfAlertEmailSent(message));

  if (!(sendEmail.sendEmail)) {
    console.log('Exiting since alert email already sent at ' + String(sendEmail.alertEmailSentAt));
    return;
  }

  try {
    const recipients = await getBudgetAlertRecipients(projectId);
    if (!recipients) {
      console.log('Exiting with no recipients to notify.');
      return;
    }

    /** @type {string} */
    let templateId;
    if (isUnderBudget(message)) {
      templateId = GC_NOTIFY_ALERT_TEMPLATE_ID;
    } else {
      templateId = GC_NOTIFY_OVER_BUDGET_TEMPLATE_ID;
    }

    // The templates are personalized with the following data.
    const data = {
      project_id: projectId,
      threshold: percentage,
      amount: cost,
      budget_amount: budget,
      currency_code: message.currencyCode, // e.g.: CAD
    };

    await sendEmail(templateId, recipients, data);
    console.log(`Exiting after notifying ${recipients.length} recipients.`);
  } catch (error) {
    console.error(
      `Error processing budget alert for project ${projectId}:`,
      error,
    );
  }
}

functions.cloudEvent('sendBudgetAlerts', sendBudgetAlerts);
