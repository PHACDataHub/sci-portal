const { describe, expect, test } = require('@jest/globals');
const { parseMessage } = require('../cloud_events');

describe('parseMessage', () => {
  test('should parse a valid base64-encoded JSON message', () => {
    const cloudEvent = {
      data: {
        message: {
          data: 'ewogICJidWRnZXREaXNwbGF5TmFtZSI6ICJidWRnZXQtcGh4LXRlc3QtNDQ0IiwKICAiY29zdEFtb3VudCI6IDAuMDIsCiAgImNvc3RJbnRlcnZhbFN0YXJ0IjogIjIwMjQtMDEtMDFUMDg6MDA6MDBaIiwKICAiYnVkZ2V0QW1vdW50IjogMS4wLAogICJidWRnZXRBbW91bnRUeXBlIjogIlNQRUNJRklFRF9BTU9VTlQiLAogICJjdXJyZW5jeUNvZGUiOiAiQ0FEIgp9',
        },
      },
    };

    const actual = parseMessage(cloudEvent);
    const expected = {
      alertThresholdExceeded: 0,
      budgetAmount: 1,
      budgetAmountType: 'SPECIFIED_AMOUNT',
      budgetDisplayName: 'budget-phx-test-444',
      costAmount: 0.02,
      costIntervalStart: '2024-01-01T08:00:00Z',
      currencyCode: 'CAD'
    };
    expect(actual).toEqual(expected);
  });

  test('should return undefined if message data is missing', () => {
    const cloudEvent = {
      data: {
        message: {},
      },
    };

    const parsedResult = parseMessage(cloudEvent);
    expect(parsedResult).toEqual(undefined);
  });

  test('should throw an error for invalid JSON', () => {
    const cloudEvent = {
      data: {
        message: {
          data: Buffer.from('invalid json').toString('base64'),
        },
      },
    };
    expect(() => parseMessage(cloudEvent)).toThrow(SyntaxError);
  });
});
