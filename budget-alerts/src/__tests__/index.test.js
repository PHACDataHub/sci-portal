const {
  createThresholdExceededEvent,
  createQueuedBudgetAlertEmailsEvent,
  getUnqueuedThresholdExceededEvents,
  getQueuedBudgetAlertEmails,
  createSendingBudgetAlertEmailEvent,
} = require('../index');

describe('getUnqueuedThresholdExceededEvents', () => {
  test('Given no events it should return an empty array', () => {
    const actual = getUnqueuedThresholdExceededEvents([]);
    expect(actual).toEqual([]);
  });

  test('Given THRESHOLD_EXCEEDED events without corresponding QUEUED_BUDGET_ALERT_EMAILS events it should return them in an array', () => {
    const events = [
      createThresholdExceededEvent(
        /** @type {any} */ ({ projectId: 'test-project', alertThresholdExceeded: 0.5 }),
      ),
      createThresholdExceededEvent(
        /** @type {any} */ ({ projectId: 'test-project', alertThresholdExceeded: 0.75 }),
      ),
    ];
    const actual = getUnqueuedThresholdExceededEvents(events);
    expect(actual).toEqual(events);
  });

  test('Given THRESHOLD_EXCEEDED events without corresponding QUEUED_BUDGET_ALERT_EMAILS events it should return them in an array', () => {
    const events = [
      createThresholdExceededEvent(
        /** @type {any} */ ({ projectId: 'test-project', alertThresholdExceeded: 0.5 }),
      ),
      createThresholdExceededEvent(
        /** @type {any} */ ({ projectId: 'test-project', alertThresholdExceeded: 0.75 }),
      ),
      createThresholdExceededEvent(
        /** @type {any} */ ({ projectId: 'test-project', alertThresholdExceeded: 1.0 }),
      ),
    ];
    const actual = getUnqueuedThresholdExceededEvents(events);
    expect(actual).toEqual(events);
  });

  test('Given THRESHOLD_EXCEEDED events without corresponding QUEUED_BUDGET_ALERT_EMAILS events it should return them in an array', () => {
    const events = [
      createThresholdExceededEvent(
        /** @type {any} */ ({ projectId: 'test-project', alertThresholdExceeded: 0.5 }),
      ),
      createQueuedBudgetAlertEmailsEvent(
        /** @type {any} */ ({ projectId: 'test-project', alertThresholdExceeded: 0.5 }),
        [],
      ),
      createThresholdExceededEvent(
        /** @type {any} */ ({ projectId: 'test-project', alertThresholdExceeded: 0.75 }),
      ),
      createThresholdExceededEvent(
        /** @type {any} */ ({ projectId: 'test-project', alertThresholdExceeded: 1.0 }),
      ),
      createQueuedBudgetAlertEmailsEvent(
        /** @type {any} */ ({ projectId: 'test-project', alertThresholdExceeded: 1.0 }),
        [],
      ),
    ];

    const actual = getUnqueuedThresholdExceededEvents(events);
    expect(actual).toEqual([
      createThresholdExceededEvent(
        /** @type {any} */ ({ projectId: 'test-project', alertThresholdExceeded: 0.75 }),
      ),
    ]);
  });
});

describe('getQueuedBudgetAlertEmails', () => {
  test('Given no events it should return an empty array', () => {
    const actual = getQueuedBudgetAlertEmails([]);
    expect(actual).toEqual([]);
  });

  test('Given an email has been queued but no emails have been sent it should return an item for each recipient', () => {
    const projectId = 'test-project';
    const costIntervalStart = '<timestamp>';
    const alertThresholdExceeded = 0.25;
    const events = [
      createQueuedBudgetAlertEmailsEvent(
        /** @type {any} */ ({ projectId, costIntervalStart, alertThresholdExceeded }),
        ['jane.doe@gcp.hc-sc.gc.ca', 'john.doe@gcp.hc-sc.gc.ca'],
      ),
    ];

    const actual = getQueuedBudgetAlertEmails(events);
    const expected = [
      {
        projectId,
        costIntervalStart,
        alertThresholdExceeded,
        recipient: 'jane.doe@gcp.hc-sc.gc.ca',
      },
      {
        projectId,
        costIntervalStart,
        alertThresholdExceeded,
        recipient: 'john.doe@gcp.hc-sc.gc.ca',
      },
    ];

    expect(actual).toEqual(expected);
  });

  test('Given an email has been queued but no emails have been sent it should return an item for each recipient', () => {
    const events = [
      createQueuedBudgetAlertEmailsEvent(
        /** @type {any} */ ({
          projectId: 'test-project',
          costIntervalStart: '<timestamp>',
          alertThresholdExceeded: 0.25,
        }),
        ['jane.doe@gcp.hc-sc.gc.ca', 'john.doe@gcp.hc-sc.gc.ca'],
      ),
    ];

    const actual = getQueuedBudgetAlertEmails(events);
    const expected = [
      {
        projectId: 'test-project',
        costIntervalStart: '<timestamp>',
        alertThresholdExceeded: 0.25,
        recipient: 'jane.doe@gcp.hc-sc.gc.ca',
      },
      {
        projectId: 'test-project',
        costIntervalStart: '<timestamp>',
        alertThresholdExceeded: 0.25,
        recipient: 'john.doe@gcp.hc-sc.gc.ca',
      },
    ];

    expect(actual).toEqual(expected);
  });

  test('Given an email has been queued and is sending it should not return that recipient', () => {
    const projectId = 'test-project';
    const costIntervalStart = '<timestamp>';
    const alertThresholdExceeded = 0.25;
    const events = [
      createQueuedBudgetAlertEmailsEvent(
        /** @type {any} */ ({
          projectId,
          costIntervalStart,
          alertThresholdExceeded,
        }),
        ['jane.doe@gcp.hc-sc.gc.ca', 'john.doe@gcp.hc-sc.gc.ca'],
      ),
      createSendingBudgetAlertEmailEvent(
        /** @type {any} */ ({
          projectId,
          costIntervalStart,
          alertThresholdExceeded,
          recipient: 'jane.doe@gcp.hc-sc.gc.ca',
        }),
      ),
    ];

    const actual = getQueuedBudgetAlertEmails(events);
    const expected = [
      {
        projectId,
        costIntervalStart,
        alertThresholdExceeded,
        recipient: 'john.doe@gcp.hc-sc.gc.ca',
      },
    ];

    expect(actual).toEqual(expected);
  });
});
