const functions = require('@google-cloud/functions-framework');
const { Storage } = require('@google-cloud/storage');

const { toBudgetAlertNotification } = require('./cloud_events');
const backstage = require('./backstage');
const GCNotify = require('./gc_notify');
const logger = require('./logger');

/**
 * @typedef {object} ThresholdExceededEvent
 * @property {'THRESHOLD_EXCEEDED'} type
 * @property {string} projectId
 * @property {string} costIntervalStart
 * @property {number} alertThresholdExceeded
 */

/**
 * @param {import('./cloud_events').BudgetAlertNotification} budgetAlert
 * @returns {ThresholdExceededEvent}
 */
const createThresholdExceededEvent = (budgetAlert) => ({
  type: 'THRESHOLD_EXCEEDED',
  projectId: budgetAlert.projectId,
  costIntervalStart: budgetAlert.costIntervalStart,
  alertThresholdExceeded: budgetAlert.alertThresholdExceeded,
});

/**
 * @typedef {object} QueuedBudgetAlertEmailsEvent
 * @property {'QUEUED_BUDGET_ALERT_EMAILS'} type
 * @property {string} projectId
 * @property {string} costIntervalStart
 * @property {number} alertThresholdExceeded
 * @property {string[]} recipients
 */

/**
 * @param {ThresholdExceededEvent} event
 * @param {string[]} recipients
 * @returns {QueuedBudgetAlertEmailsEvent}
 */
const createQueuedBudgetAlertEmailsEvent = (event, recipients) => ({
  type: 'QUEUED_BUDGET_ALERT_EMAILS',
  projectId: event.projectId,
  costIntervalStart: event.costIntervalStart,
  alertThresholdExceeded: event.alertThresholdExceeded,
  recipients,
});

/**
 * @typedef {object} SendingBudgetAlertEmailEvent
 * @property {'SENDING_BUDGET_ALERT_EMAIL_EVENT'} type
 * @property {string} projectId
 * @property {string} costIntervalStart
 * @property {number} alertThresholdExceeded
 * @property {string} recipient
 */

/**
 * @param {BudgetAlertEmailMetadata} event
 * @returns {SendingBudgetAlertEmailEvent}
 */
const createSendingBudgetAlertEmailEvent = (event) => ({
  type: 'SENDING_BUDGET_ALERT_EMAIL_EVENT',
  projectId: event.projectId,
  costIntervalStart: event.costIntervalStart,
  alertThresholdExceeded: event.alertThresholdExceeded,
  recipient: event.recipient,
});

/**
 * @typedef {object} SentBudgetAlertEmail
 * @property {'SENT_BUDGET_ALERT_EMAIL'} type
 * @property {string} projectId
 * @property {string} costIntervalStart
 * @property {number} alertThresholdExceeded
 * @property {string} recipient
 */

/**
 * @param {BudgetAlertEmailMetadata} event
 * @returns {SentBudgetAlertEmail}
 */
const createSentBudgetAlertEmail = (event) => ({
  type: 'SENT_BUDGET_ALERT_EMAIL',
  projectId: event.projectId,
  costIntervalStart: event.costIntervalStart,
  alertThresholdExceeded: event.alertThresholdExceeded,
  recipient: event.recipient,
});

/**
 * @typedef {object} SendBudgetAlertEmailFailed
 * @property {'SEND_BUDGET_ALERT_EMAIL_FAILED'} type
 * @property {string} projectId
 * @property {string} costIntervalStart
 * @property {number} alertThresholdExceeded
 * @property {string} recipient
 */

/**
 * @param {BudgetAlertEmailMetadata} event
 * @returns {SendBudgetAlertEmailFailed}
 */
const createSendBudgetAlertEmailFailed = (event) => ({
  type: 'SEND_BUDGET_ALERT_EMAIL_FAILED',
  projectId: event.projectId,
  costIntervalStart: event.costIntervalStart,
  alertThresholdExceeded: event.alertThresholdExceeded,
  recipient: event.recipient,
});

/**
 * @typedef {ThresholdExceededEvent | QueuedBudgetAlertEmailsEvent | SendingBudgetAlertEmailEvent | SentBudgetAlertEmail | SendBudgetAlertEmailFailed} Event
 */

/**
 * @param {import('@google-cloud/storage').Storage} storage
 * @param {string} projectId
 * @returns {Promise<{ events: Event[], generation: string | number }>}
 */
const readEvents = async (storage, projectId) => {
  const file = storage.bucket(process.env.BUDGET_ALERTS_STORAGE_BUCKET).file(`${projectId}.json`);
  const [exists] = await file.exists();
  if (!exists) {
    return { events: [], generation: 0 };
  }

  const [metadata] = await file.getMetadata();
  const [contents] = await file.download();

  return {
    events: JSON.parse(contents.toString()),
    generation: metadata.generation,
  };
};

/**
 * @param {import('@google-cloud/storage').Storage} storage
 * @param {{ events: Event[], generation: string | number }} state
 * @param {Event[]} events
 * @throws If the file has been changed by another process this will throw an unhandled 412 Precondition Failed error.
 */
const recordEvents = async (storage, state, ...events) => {
  const contents = JSON.stringify([...state.events, ...events], null, 2);
  const file = storage.bucket(process.env.BUDGET_ALERTS_STORAGE_BUCKET).file(`${events[0].projectId}.json`);
  await file.save(contents, { preconditionOpts: { ifGenerationMatch: state.generation } });
};

/**
 * Returns true when the alert threshold has not been crossed yet.
 * @param {Event[]} events
 * @param {import('./cloud_events').BudgetAlertNotification} budgetAlert
 * @returns {boolean}
 */
const isThresholdExceededAlert = (events, budgetAlert) => {
  // The Budget Alerts do not include "alertThresholdExceeded" when a threshold has not been crossed.
  if (budgetAlert.alertThresholdExceeded === undefined) {
    return false;
  }

  // Iterating backwards for performance, find an event that has the same project, budget start timestamp, and threshold.
  // We safely compare numbers by asserting the difference is less than EPSILON, the smallest floating point number greater than 1.
  const match = events.findLast(
    (event) =>
      event.type === 'THRESHOLD_EXCEEDED' &&
      event.projectId === budgetAlert.projectId &&
      event.costIntervalStart === budgetAlert.costIntervalStart &&
      Math.abs(event.alertThresholdExceeded - budgetAlert.alertThresholdExceeded) < Number.EPSILON,
  );

  // If no match is found this is a new THRESHOLD_EXCEEDED event.
  return match === undefined;
};

/**
 * Returns all THRESHOLD_EXCEEDED events without a corresponding QUEUED_BUDGET_ALERT_EMAILS event.
 * @param {Event[]} events
 * @returns {ThresholdExceededEvent[]}
 */
const getUnqueuedThresholdExceededEvents = (events) => {
  const result = [];
  for (const event of events) {
    if (event.type === 'THRESHOLD_EXCEEDED') {
      result.push(event);
    }
    if (event.type === 'QUEUED_BUDGET_ALERT_EMAILS') {
      const index = result.findIndex(
        (value) =>
          value.type === 'THRESHOLD_EXCEEDED' &&
          value.projectId === event.projectId &&
          value.costIntervalStart === event.costIntervalStart &&
          Math.abs(value.alertThresholdExceeded - event.alertThresholdExceeded) < Number.EPSILON,
      );
      if (index !== -1) {
        result.splice(index, 1);
      }
    }
  }
  return result;
};

/**
 * @typedef {object} BudgetAlertEmailMetadata
 * @property {string} projectId
 * @property {string} costIntervalStart
 * @property {number} alertThresholdExceeded
 * @property {string} recipient
 */

/**
 * Returns the recipients from QUEUED_BUDGET_ALERT_EMAILS that are queued or failed.
 * @param {Event[]} events
 * @returns {BudgetAlertEmailMetadata[]}
 */
const getQueuedBudgetAlertEmails = (events) => {
  /** @type {Array<BudgetAlertEmailMetadata & { status: 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED' }>} */
  const emails = [];

  for (const event of events) {
    if (event.type === 'QUEUED_BUDGET_ALERT_EMAILS') {
      for (const recipient of event.recipients) {
        emails.push({
          projectId: event.projectId,
          costIntervalStart: event.costIntervalStart,
          alertThresholdExceeded: event.alertThresholdExceeded,
          recipient,
          status: 'QUEUED',
        });
      }
    }

    else if (event.type === 'SENDING_BUDGET_ALERT_EMAIL_EVENT') {
      for (let i = 0; i < emails.length; i += 1) {
        if (
          emails[i].projectId === event.projectId &&
          emails[i].costIntervalStart === event.costIntervalStart &&
          emails[i].alertThresholdExceeded === event.alertThresholdExceeded &&
          emails[i].recipient === event.recipient
        ) {
          emails[i].status = 'SENDING';
        }
      }
    }

    else if (event.type === 'SENT_BUDGET_ALERT_EMAIL') {
      for (let i = 0; i < emails.length; i += 1) {
        if (
          emails[i].projectId === event.projectId &&
          emails[i].costIntervalStart === event.costIntervalStart &&
          emails[i].alertThresholdExceeded === event.alertThresholdExceeded &&
          emails[i].recipient === event.recipient
        ) {
          emails[i].status = 'SENT';
        }
      }
    }

    else if (event.type === 'SEND_BUDGET_ALERT_EMAIL_FAILED') {
      for (let i = 0; i < emails.length; i += 1) {
        if (
          emails[i].projectId === event.projectId &&
          emails[i].costIntervalStart === event.costIntervalStart &&
          emails[i].alertThresholdExceeded === event.alertThresholdExceeded &&
          emails[i].recipient === event.recipient
        ) {
          emails[i].status = 'FAILED';
        }
      }
    }
  }

  const result = [];
  for (let i = 0; i < emails.length; i += 1) {
    if (emails[i].status === 'QUEUED' || emails[i].status === 'FAILED') {
      delete emails[i].status;
      result.push(emails[i]);
    }
  }
  return result;
};

/**
 * Returns true when the budget is less than 100% spent.
 * @param {import('./cloud_events').BudgetAlertNotification} budgetAlert
 */
const isOverBudget = (budgetAlert) => budgetAlert.alertThresholdExceeded >= 1.0;

/**
 * @param {import('@google-cloud/functions-framework').CloudEvent<unknown>} cloudEvent
 * @returns Promise<void>
 */
const sendBudgetAlerts = async (cloudEvent) => {
  // Transform the CloudEvent into a Budget Alert Notification, or undefined
  const budgetAlert = toBudgetAlertNotification(cloudEvent);
  if (!budgetAlert) {
    logger.error({
      message: 'An unexpected message was received.',
      component: cloudEvent,
    });
    return;
  }

  // Format the data
  const formattedCost = budgetAlert.costAmount.toFixed(4);
  const formattedBudget = budgetAlert.budgetAmount.toFixed(0);
  const percentageSpent = ((100 * budgetAlert.costAmount) / budgetAlert.budgetAmount).toFixed(1);
  const thresholdExceeded = (100 * budgetAlert.alertThresholdExceeded).toFixed(0);
  const currencyCode = budgetAlert.currencyCode;

  // Log the message
  logger.info({
    message: `Handling a message for project ID ${budgetAlert.projectId}. The project has used ${percentageSpent}% of the $${formattedBudget} ${currencyCode} budget ($${formattedCost} ${currencyCode}).`,
    component: budgetAlert,
  });

  // Read the event log
  if (!process.env.BUDGET_ALERTS_STORAGE_BUCKET) {
    throw new Error('The BUDGET_ALERTS_STORAGE_BUCKET environment variable has not been defined');
  }
  const storage = new Storage();

  // If the message is **not** a periodic status update, and it is a new threshold exceeded alert, record it.
  let state = await readEvents(storage, budgetAlert.projectId);
  if (isThresholdExceededAlert(state.events, budgetAlert)) {
    logger.info({
      message: `The ${thresholdExceeded}% threshold has been exceeded.`,
    });
    await recordEvents(storage, state, createThresholdExceededEvent(budgetAlert));
  } else {
    logger.info({ message: 'A threshold has not been exceeded.' });
  }

  // Queue email alerts for any new threshold exceeded events.
  state = await readEvents(storage, budgetAlert.projectId);
  const unqueuedThresholdExceededEvents = getUnqueuedThresholdExceededEvents(state.events);
  if (unqueuedThresholdExceededEvents.length > 0) {
    /** @type {string[]} */
    let recipients;
    try {
      recipients = await backstage.getBudgetAlertRecipients(budgetAlert.projectId);
      if (recipients.length === 0) {
        logger.warn({
          message: `No budget alert recipients found for ${budgetAlert.projectId}.`,
        });
      }
      const events = unqueuedThresholdExceededEvents.map((budgetAlert) =>
        createQueuedBudgetAlertEmailsEvent(budgetAlert, recipients),
      );
      await recordEvents(storage, state, ...events);
    } catch (error) {
      logger.error({
        message: `Failed to fetch the budget alert recipients from Backstage.`,
        component: error,
      });
    }
  }

  // Send email
  while (true) {
    // Are there emails to send?
    state = await readEvents(storage, budgetAlert.projectId);
    const queue = getQueuedBudgetAlertEmails(state.events);
    if (queue.length === 0) {
      logger.info({ message: 'No emails to send.' });
      return;
    }

    // Mark the email as pending
    try {
      await recordEvents(storage, state, createSendingBudgetAlertEmailEvent(queue[0]));
    } catch (error) {
      if (error.code === 412 /* Precondition failed */) {
        continue;
      }
    }
    state = await readEvents(storage, budgetAlert.projectId);

    try {
      const templateId = isOverBudget(budgetAlert)
        ? process.env.GC_NOTIFY_OVER_BUDGET_TEMPLATE_ID
        : process.env.GC_NOTIFY_ALERT_TEMPLATE_ID;
      const personalisation = {
        project_id: budgetAlert.projectId,
        threshold: thresholdExceeded,
        amount: formattedCost,
        budget_amount: formattedBudget,
        currency_code: currencyCode,
      };
      await GCNotify.sendEmail(templateId, queue[0].recipient, { personalisation });
      await recordEvents(storage, state, createSentBudgetAlertEmail(queue[0]));
    } catch (error) {
      await recordEvents(storage, state, createSendBudgetAlertEmailFailed(queue[0]));
    }
  }
};

functions.cloudEvent('sendBudgetAlerts', sendBudgetAlerts);

module.exports = {
  createThresholdExceededEvent,
  createQueuedBudgetAlertEmailsEvent,
  createSendingBudgetAlertEmailEvent,
  getUnqueuedThresholdExceededEvents,
  getQueuedBudgetAlertEmails,
};
