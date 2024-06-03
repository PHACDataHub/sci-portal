/**
 * Fetches project data for a given project ID from the backstage API and returns a list of email recipients for a given project.
 *
 * @param {string} projectId - The ID of the project to fetch data for.
 * @return {string[]} List of email recipients for the project.
 * @throws {Error} If the API request fails or returns a non-2xx status code.
 */
async function getBudgetAlertRecipients(projectId) {
  const {
    BACKSTAGE_BUDGET_ALERT_EVENTS_TOKEN,
    BACKSTAGE_URI,
  } = process.env;

  const url = `${BACKSTAGE_URI}/api/catalog/entities/by-name/component/default/${projectId}`;
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

  const data = await response.json();

  const recipients = data.metadata.annotations[
    'data-science-portal.phac-aspc.gc.ca/budget-alert-recipients'
  ].split(',').map(email => email.trim());

  return recipients;
}

module.exports = {
  getBudgetAlertRecipients,
};
