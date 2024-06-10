const functions = require('@google-cloud/functions-framework');

const { getBudgetAlertRecipients } = require('./backstage');
const { parseMessage } = require('./cloud_events');
const { sendEmail } = require('./gc_notify');

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
    console.log('The message did not contain the expected data');
    console.log('Exiting with no message to process.');
    return;
  }

  try {
    const recipients = await getBudgetAlertRecipients(message.projectId);
    if (!recipients) {
      console.log('Existing with no recipients to notify');
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
    const personalisation = {
      // The display name is the project ID, by convention.
      project_id: message.budgetDisplayName,

      // Transform the threshold from 0 to 1 to a percentage to a whole number.
      threshold: (message.alertThresholdExceeded * 100).toFixed(0),

      // Costs accrued.
      amount: message.costAmount,

      // Amount allocated in the budget.
      budget_amount: message.budgetAmount,

      currency_code: message.currencyCode, // e.g.: CAD
    };

    await sendEmail(templateId, recipients, personalisation);
    console.log(`Exiting after notifying ${recipients.length} recipients that ${personalisation.project_id} has reached ${personalisation.threshold}% of the budget (${personalisation.amount}$ ${personalisation.currency_code})`);
  } catch (error) {
    console.error(
      `Error processing budget alert for project ${projectId}:`,
      error,
    );
  }
}

functions.cloudEvent('sendBudgetAlerts', sendBudgetAlerts);
