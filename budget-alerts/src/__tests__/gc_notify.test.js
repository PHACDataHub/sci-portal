const { describe, expect, test } = require('@jest/globals');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

const { sendEmail } = require('../gc_notify');

describe('sendEmail', () => {
  beforeAll(() => {
    process.env.GC_NOTIFY_API_KEY = 'api-key';
    process.env.GC_NOTIFY_URI = 'https://api.notification.canada.ca';
  });

  test('should mock send notifications to all recipients', async () => {
    const recipients = ['jane.doe@gcp.hc-sc.gc.ca', 'john.doe@gcp.hc-sc.gc.ca'];
    const templateId = 'template-id';
    const personalisation = { data: 'data' };

    const mock = new MockAdapter(axios);

    mock
      .onPost('https://api.notification.canada.ca/v2/notifications/email')
      .reply(200, {
        status: 200,
      });

    const result = await sendEmail(
      templateId,
      recipients,
      personalisation,
    );

    expect(result).toEqual([
      { status: 'fulfilled', value: undefined },
      { status: 'fulfilled', value: undefined },
    ]);
  });

  test('should mock send notifications to recipients and throw error if any fail', async () => {
    const recipients = ['jane.doe@gcp.hc-sc.gc.ca', 'john.doe@gcp.hc-sc.gc.ca'];
    const templateId = 'template-id';
    const personalisation = { data: 'data' };

    const mock = new MockAdapter(axios);
    mock
      .onPost('https://api.notification.canada.ca/v2/notifications/email')
      .reply(500, {
        status: 500,
      });

    const result = await sendEmail(
      templateId,
      recipients,
      personalisation,
    );

    expect(result).toEqual([
      {
        reason: new Error('Unable to send email to jane.doe@gcp.hc-sc.gc.ca'),
        status: 'rejected',
      },
      {
        reason: new Error('Unable to send email to john.doe@gcp.hc-sc.gc.ca'),
        status: 'rejected',
      },
    ]);
  });
});
