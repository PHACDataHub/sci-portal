const axios = require("axios");
const MockAdapter = require("axios-mock-adapter");

const {
    sendNotifications,
} = require('../gc_notify');


describe('sendNotifications', () => {
    test('should mock send notifications to all recipients', async () => {
        const recipients = 'test1@example.com,test2@example.com';
        const templateId = 'template-id';
        const personalisation = { data: 'data' };

        const mock = new MockAdapter(axios);

        mock.onPost("https://api.notification.canada.ca/v2/notifications/email").reply(200, {
            status: 200
        });

        await sendNotifications(recipients, templateId, personalisation);

    });

    test('should mock send notifications to recipients and throw error if any fail', async () => {
        const recipients = 'test1@example.com,test2@example.com';
        const templateId = 'template-id';
        const personalisation = { data: 'data' };

        const mock = new MockAdapter(axios);
        mock.onPost("https://api.notification.canada.ca/v2/notifications/email").reply(500, {
            status: 500
        });

        expect(sendNotifications(recipients, templateId, personalisation)).rejects.toThrow();

    });
});