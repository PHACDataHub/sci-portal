const { toBudgetAlertNotification } = require('../cloud_events');

describe('toBudgetAlertNotification', () => {
  test('Given an invalid CloudEvent it should return undefined', () => {
    const cloudEvent = { data: { message: {} } };

    const actual = toBudgetAlertNotification(cloudEvent);

    expect(actual).toBeUndefined();
  });

  test('Given a CloudEvent that contains a Budget Alert Notification it should return the parsed object', () => {
    const cloudEvent = {
      data: {
        message: {
          data: 'eyJidWRnZXRBbW91bnQiOjEsImJ1ZGdldEFtb3VudFR5cGUiOiJTUEVDSUZJRURfQU1PVU5UIiwiYnVkZ2V0RGlzcGxheU5hbWUiOiJwaHgtdGVzdC00NDQiLCJjb3N0QW1vdW50IjowLjAyLCJjb3N0SW50ZXJ2YWxTdGFydCI6IjIwMjQtMDEtMDFUMDg6MDA6MDBaIiwiY3VycmVuY3lDb2RlIjoiQ0FEIn0=',
        },
      },
    };

    const actual = toBudgetAlertNotification(cloudEvent);
    const expected = {
      budgetAmount: 1,
      budgetAmountType: 'SPECIFIED_AMOUNT',
      budgetDisplayName: 'phx-test-444',
      costAmount: 0.02,
      costIntervalStart: '2024-01-01T08:00:00Z',
      currencyCode: 'CAD',

      projectId: 'phx-test-444',
    };
    expect(actual).toEqual(expected);
  });
});
