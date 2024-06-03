const functions = require('@google-cloud/functions-framework');

const { getBudgetAlertRecipients } = require('./backstage');
const { parseMessage } = require('./cloud_events');
const { sendNotifications } = require('./gc_notify');

const { GC_NOTIFY_ALERT_TEMPLATE_ID, GC_NOTIFY_OVER_BUDGET_TEMPLATE_ID } = process.env;

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
    return;
  }

  const {
    budgetDisplayName: project_id,
    costAmount: amount,
    budgetAmount: budget_amount,
    alertThresholdExceeded: threshold,
    currencyCode: currency_code,
  } = message;

  try {
    const recipients = await getBudgetAlertRecipients(project_id);
    if (!recipients) {
      return;
    }

    const personalisation = {
      threshold: (threshold * 100).toFixed(1), // The alert sends a value from 0-1, which we convert to a percentage.
      project_id,
      amount,
      currency_code,
      budget_amount,
    };

    const templateId =
      thresholdExceeded < 1
        ? GC_NOTIFY_ALERT_TEMPLATE_ID
        : GC_NOTIFY_OVER_BUDGET_TEMPLATE_ID;
    await sendNotifications(recipients, templateId, personalisation);
  } catch (error) {
    console.error(
      `Error processing budget alert for project ${projectId}:`,
      error,
    );
  }
}

functions.cloudEvent('sendBudgetAlerts', sendBudgetAlerts);
