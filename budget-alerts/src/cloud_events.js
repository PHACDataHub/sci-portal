/**
 * This type is based on the documentation at https://cloud.google.com/billing/docs/how-to/budgets-programmatic-notifications#notification_format.
 *
 * @typedef {Object} BudgetAlertNotification
 *
 * @property {string} billingAccountId
 * @property {string} budgetId
 * @property {string} schemaVersion
 *
 * @property {string} budgetDisplayName
 * @property {number} costAmount
 * @property {string} costIntervalStart
 * @property {number} budgetAmount
 * @property {"SPECIFIED_AMOUNT" | "LAST_MONTH_COST" | "LAST_PERIODS_COST"} budgetAmountType
 * @property {number} alertThresholdExceeded
 * @property {number} forecastThresholdExceeded
 * @property {string} currencyCode
 */

/**
 * Parses a CloudEvent message and returns the parsed JSON object.
 *
 * @param {Object} cloudEvent
 * @return {BudgetAlertNotification | undefined}
 */
function parseMessage(cloudEvent) {
  const encodedMessage = cloudEvent.data.message.data;
  if (!encodedMessage) {
    return undefined;
  }

  const message = Buffer.from(encodedMessage, 'base64').toString();
  return JSON.parse(message);
}

module.exports = { parseMessage };
