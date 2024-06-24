const { NotifyClient } = require('notifications-node-client');
const { sendEmail } = require('../gc_notify');
const logger = require('../logger');

jest.mock('notifications-node-client');
jest.mock('../logger');

describe('sendEmail', () => {
  beforeEach(() => {
    process.env.GC_NOTIFY_API_KEY = 'api-key';
    process.env.GC_NOTIFY_URI = 'https://api.notification.canada.ca';
  });

  test('When the GC_NOTIFY_API_KEY environment variable has not been set it should log an error', async () => {
    const templateId = '';
    const emailAddress = '';

    delete process.env.GC_NOTIFY_API_KEY;

    await expect(sendEmail(templateId, emailAddress)).rejects.toThrow(
      'The GC_NOTIFY_API_KEY environment variable has not been defined',
    );
  });

  test('When the GC_NOTIFY_URI environment variable has not been set it should log an error', async () => {
    const templateId = '';
    const emailAddress = '';

    delete process.env.GC_NOTIFY_URI;

    await expect(sendEmail(templateId, emailAddress)).rejects.toThrow(
      'The GC_NOTIFY_URI environment variable has not been defined',
    );
  });

  test('should send an email using the GC Notify API and log the response', async () => {
    const templateId = '<template-id>';
    const emailAddress = '<email-address>';
    const options = {
      personalisation: { projectId: '<project-id>' },
    };

    const sendEmailSpy = jest.spyOn(NotifyClient.prototype, 'sendEmail');
    sendEmailSpy.mockResolvedValueOnce({ data: { uri: '<notification-uri>' } });

    await sendEmail(templateId, emailAddress, options);

    expect(sendEmailSpy).toBeCalledTimes(1);
    expect(sendEmailSpy).toHaveBeenCalledWith(templateId, emailAddress, options);
    expect(logger.info).toHaveBeenCalledWith({
      message: 'An email has been sent to <email-address>. Inspect the notification at <notification-uri>.',
    });
  });

  test('When the GC notify API returns a non-200 HTTP Status Code it should throw an error', async () => {
    const templateId = '<template-id>';
    const emailAddress = '<email-address>';
    const options = {
      personalisation: { projectId: '<project-id>' },
    };

    const sendEmailSpy = jest.spyOn(NotifyClient.prototype, 'sendEmail');
    sendEmailSpy.mockRejectedValueOnce();

    await expect(sendEmail(templateId, emailAddress, options)).rejects.toThrowError(
      'Unable to send email to <email-address>',
    );
  });

  // Additional specifications:
  // - When the email is requested with GC Notify, the response is HTTP 201 Created.
  // - When the GC Notify account is a trial only members of the team can receive email. Otherwise they get a HTTP400.
});
