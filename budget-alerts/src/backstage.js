/**
 * Parses a CloudEvent message and returns the parsed JSON object.
 *
 * @param {Object} cloudEvent - The CloudEvent object containing the message data.
 * @return {Object|undefined} The parsed JSON object if the message is valid, undefined otherwise.
 */
function parseMessage(cloudEvent) {
  const message_base64 = cloudEvent.data.message.data;
  if (!message_base64) return undefined;

  const message = Buffer.from(message_base64, 'base64').toString();
  return JSON.parse(message);
}

/**
 * Fetches project data for a given project ID from the backstage API.
 *
 * @param {string} projectId - The ID of the project to fetch data for.
 * @param {string} bearerToken - Static token for accessing the Backstage API.
 * @param {string} backstageUri - Backstage API URI.
 * @return {Promise<Object>} A Promise that resolves to the project data as a JSON object.
 * @throws {Error} If the API request fails or returns a non-2xx status code.
 */
async function fetchProjectData(projectId, bearerToken, backstageUri) {
  const url = `${backstageUri}/api/catalog/entities/by-name/component/default/${projectId}`;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${bearerToken}`,
  };

  const response = await fetch(url, { method: 'GET', headers });
  if (!response.ok) {
    throw new Error(
      `Status:${response.status} - Failed to fetch project data for project ${projectId}`,
    );
  }

  return response.json();
}

/**
 * Retrieves the recipients for budget alerts from the given data object.
 *
 * @param {Object} data - The data object containing metadata annotations.
 * @return {string|undefined} The recipients for budget alerts, or undefined if not found.
 */
function getRecipients(data) {
  return data.metadata.annotations[
    'data-science-portal.phac-aspc.gc.ca/budget-alert-recipients'
  ];
}

module.exports = {
  parseMessage,
  fetchProjectData,
  getRecipients,
};
