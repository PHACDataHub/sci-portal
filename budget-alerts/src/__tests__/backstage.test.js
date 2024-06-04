const {
  describe,
  expect,
  test,
  beforeEach,
  afterEach,
} = require('@jest/globals');
const { http, HttpResponse } = require('msw');
const { server } = require('../../mocks/node');

const { getBudgetAlertRecipients } = require('../backstage');

describe('getBudgetAlertRecipients', () => {
  beforeAll(() => {
    server.listen();
    process.env.BACKSTAGE_BUDGET_ALERT_EVENTS_TOKEN = 'api-key';
    process.env.BACKSTAGE_URI = 'https://backstage.test.phac-aspc.gc.ca';
  });

  afterEach(() => server.resetHandlers());

  afterAll(() => server.close());

  test('fetchProjectData successfully returns project data', async () => {
    const baseUrl = 'https://backstage.test.phac-aspc.gc.ca';
    server.use(
      http.get(`${baseUrl}/api/catalog/entities/by-query`, () => {
        return HttpResponse.json({
          items: [
            {
              metadata: {
                annotations: {
                  // 'cloud.google.com/project': 'phx-01hz5f5jjef',
                  'data-science-portal.phac-aspc.gc.ca/budget-alert-recipients':
                    'jane.doe@gcp.hc-sc.gc.ca,john.doe@gcp.hc-sc.gc.ca',
                },
              },
            },
            {
              metadata: {
                annotations: {
                  // 'cloud.google.com/project': 'phx-01hz5f5jjef',
                  'data-science-portal.phac-aspc.gc.ca/budget-alert-recipients':
                    'jane.doe@gcp.hc-sc.gc.ca,john.doe@gcp.hc-sc.gc.ca',
                },
              },
            },
          ],
        });
      }),
    );

    const projectId = 'phx-01hz5f5jjef';
    const actual = await getBudgetAlertRecipients(projectId);
    const expected = ['jane.doe@gcp.hc-sc.gc.ca', 'john.doe@gcp.hc-sc.gc.ca'];

    expect(actual).toEqual(expected);
  });

  test('fetchProjectData fails to return project data', async () => {
    const baseUrl = 'https://backstage.test.phac-aspc.gc.ca';

    server.use(
      http.get(`${baseUrl}/api/catalog/entities/by-query`, () => {
        return HttpResponse.status(500);
      }),
    );

    const projectId = 'phx-01hz5f5jjef';
    await expect(getBudgetAlertRecipients(projectId)).rejects.toThrow();
  });
});
