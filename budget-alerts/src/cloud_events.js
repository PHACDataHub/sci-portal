/**
 * This type is based on the documentation at https://cloud.google.com/billing/docs/how-to/budgets-programmatic-notifications#notification_format.
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
 * @property {number | undefined} alertThresholdExceeded
 * @property {number | undefined} forecastThresholdExceeded
 * @property {string} currencyCode
 *
 * @property {string} projectId
 */

/**
 * Returns decoded BudgetAlertNotification, or undefined.
 * @param {any} cloudEvent
 * @return {BudgetAlertNotification | undefined}
 */
const toBudgetAlertNotification = (cloudEvent) => {
  const encodedMessage = cloudEvent?.data?.message.data;
  if (!encodedMessage) {
    return undefined;
  }

  return {
    ...JSON.parse(Buffer.from(encodedMessage, 'base64').toString()),

    /** Returns the project ID from the Budget Alert Notification. */
    get projectId() {
      return this.budgetDisplayName; // By convention the project ID is the budget display name.
    },
  };
};

module.exports = { toBudgetAlertNotification };
