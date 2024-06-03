/**
 * Parses a CloudEvent message and returns the parsed JSON object.
 *
 * @param {Object} cloudEvent
 * @return {Object|undefined}
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
