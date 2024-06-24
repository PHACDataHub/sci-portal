/**
 * The severity levels are defined at https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry.
 * @typedef {('DEFAULT' | 'DEBUG' | 'INFO' | 'NOTICE' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'ALERT' | 'EMERGENCY')} LogSeverity
 */

/**
 * @param {LogSeverity} severity
 * @returns {(({ message, component }: { message: any, component?: any }) => void)}
 */
const logEntry =
  (severity) =>
  ({ message, component }) =>
    console.log(JSON.stringify({ severity, message, component }));

module.exports = {
  debug: logEntry('DEBUG'),
  error: logEntry('ERROR'),
  info: logEntry('INFO'),
  warn: logEntry('WARNING'),
};
