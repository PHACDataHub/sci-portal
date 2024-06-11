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
    fields: `kind,metadata.annotations.${BUDGET_ALERT_RECIPIENTS_ANNOTATION}`,
  });
  const url = `${BACKSTAGE_URI}/api/catalog/entities/by-query?${params}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${BACKSTAGE_BUDGET_ALERT_EVENTS_TOKEN}`,
  };

  const response = await fetch(url, { method: 'GET', headers });
  let body;
  let err;
  try {
    body = await response.json();
  }
  catch (err) {
    err = err;
  }
  console.log(JSON.stringify({ 
    severity: 'INFO',
    message: `HTTP${response.status} ${response.statusText} - GET ${url}`,
    component: { body, err }, // Uncomment to debug.
  }));

  if (!response.ok) {
    throw new Error(
      `HTTP${response.status} ${response.statusText}: Failed to fetch data from Backstage for project ID ${projectId}`,
    );
  }

  const uniqueRecipients = new Set();
  for (const item of body.items) {
    if (item.kind === 'Group') {
      continue;
    }

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
