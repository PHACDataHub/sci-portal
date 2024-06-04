const BUDGET_ALERT_RECIPIENTS_ANNOTATION =
  'data-science-portal.phac-aspc.gc.ca/budget-alert-recipients';

/**
 * Fetches project data for a given project ID from the backstage API and returns a list of email recipients for a given project.
 *
 * @param {string} projectId - The ID of the project to fetch data for.
 * @return {string[]} List of email recipients for the project.
 * @throws {Error} If the API request fails or returns a non-2xx status code.
 */
async function getBudgetAlertRecipients(projectId) {
  const { BACKSTAGE_BUDGET_ALERT_EVENTS_TOKEN, BACKSTAGE_URI } = process.env;

  const params = new URLSearchParams({
    filter: `metadata.annotations.cloud.google.com/project=${projectId}`,
    fields: `metadata.annotations.${BUDGET_ALERT_RECIPIENTS_ANNOTATION}`,
  });
  const url = `${BACKSTAGE_URI}/api/catalog/entities/by-query?${params}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${BACKSTAGE_BUDGET_ALERT_EVENTS_TOKEN}`,
  };

  const response = await fetch(url, { method: 'GET', headers });
  if (!response.ok) {
    throw new Error(
      `Status:${response.status} - Failed to fetch project data for project ${projectId}`,
    );
  }

  const body = await response.json();

  const uniqueRecipients = new Set();
  for (const item of body.items) {
    const recipients =
      item.metadata.annotations[BUDGET_ALERT_RECIPIENTS_ANNOTATION].split(',');
    for (const recipient of recipients) {
      uniqueRecipients.add(recipient.trim());
    }
  }
  return Array.from(uniqueRecipients);
}

module.exports = {
  getBudgetAlertRecipients,
};
