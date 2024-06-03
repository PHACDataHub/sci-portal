const { describe, expect, test } = require('@jest/globals');
const { parseMessage } = require('../cloud_events');

describe('parseMessage', () => {
  test('should parse a valid base64-encoded JSON message', () => {
    const inputData = {
      hello: 'world',
    };

    const cloudEvent = {
      data: {
        message: {
          data: Buffer.from(JSON.stringify(inputData)).toString('base64'),
        },
      },
    };

    const parsedResult = parseMessage(cloudEvent);
    expect(parsedResult).toEqual(inputData);
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
