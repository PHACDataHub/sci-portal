const logger = require('./logger');

const ANNOTATION = 'data-science-portal.phac-aspc.gc.ca/budget-alert-recipients';

/**
 * Returns the budget alert recipients for a given project ID from Backstage.
 * @param {string} projectId
 * @throws {Error} If the API request fails or returns a non-2xx status code.
 */
async function getBudgetAlertRecipients(projectId) {
  const baseUrl = process.env.BACKSTAGE_URI;
  const params = new URLSearchParams({
    filter: `metadata.annotations.cloud.google.com/project-id=${projectId}`,
    fields: `kind,metadata.annotations.${ANNOTATION}`,
  });
  const url = `${baseUrl}/api/catalog/entities/by-query?${params}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.BACKSTAGE_BUDGET_ALERT_EVENTS_TOKEN}`,
  };
  const response = await fetch(url, { method: 'GET', headers });
  logger.debug({
    message: `HTTP ${response.status} ${response.statusText} - GET ${url}`,
  });
  if (!response.ok) {
    throw new Error(
      `Failed to fetch budget alert recipients for ${projectId} from Backstage (HTTP ${response.status} ${response.statusText})`,
    );
  }

  let body;
  try {
    body = await response.json();
    if (!(typeof body === 'object' && 'items' in body && Array.isArray(body.items))) {
      throw new Error(`Unexpected response from Backstage for ${projectId}`);
    }
  } catch (err) {
    throw new Error(`Failed to parse the response from Backstage for ${projectId}`);
  }

  const recipients = new Set();
  for (const item of body.items) {
    if (!item?.metadata?.annotations[ANNOTATION]) {
      continue;
    }
    for (const recipient of item.metadata.annotations[ANNOTATION].split(',')) {
      recipients.add(recipient.trim());
    }
  }
  return Array.from(recipients);
}

module.exports = {
  getBudgetAlertRecipients,
};
