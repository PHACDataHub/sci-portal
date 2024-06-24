const { http, HttpResponse } = require('msw');
const { server } = require('../__testUtils__/msw');
const { getBudgetAlertRecipients } = require('../backstage');

jest.mock('../logger');

const baseUrl = 'https://backstage.test.phac-aspc.gc.ca';

/**
 * @param {({ kind: string, recipients?: string })} options
 */
const createEntity = ({ kind, recipients }) => {
  /** @type {{ kind: string, metadata?: { annotations?: { 'data-science-portal.phac-aspc.gc.ca/budget-alert-recipients': string }}}} */
  const entity = { kind };
  if (recipients) {
    entity.metadata = {
      annotations: {
        'data-science-portal.phac-aspc.gc.ca/budget-alert-recipients': recipients,
      },
    };
  }
  return entity;
};

describe('getBudgetAlertRecipients', () => {
  beforeAll(() => {
    server.listen();
    process.env.BACKSTAGE_BUDGET_ALERT_EVENTS_TOKEN = 'api-key';
    process.env.BACKSTAGE_URI = baseUrl;
  });

  afterEach(() => server.resetHandlers());

  afterAll(() => server.close());

  test('Given a project ID it should return a unique list of budget alert recipients', async () => {
    server.use(
      http.get(`${baseUrl}/api/catalog/entities/by-query`, () => {
        return HttpResponse.json({
          items: [
            createEntity({ kind: 'Group' }),
            createEntity({
              kind: 'Resource',
              recipients: 'jane.doe@gcp.hc-sc.gc.ca,john.doe@gcp.hc-sc.gc.ca',
            }),
            createEntity({
              kind: 'Component',
              recipients: 'jane.doe@gcp.hc-sc.gc.ca,john.doe@gcp.hc-sc.gc.ca',
            }),
          ],
        });
      }),
    );

    const projectId = 'phx-01hz5f5jjef';
    const actual = await getBudgetAlertRecipients(projectId);
    const expected = ['jane.doe@gcp.hc-sc.gc.ca', 'john.doe@gcp.hc-sc.gc.ca'];

    expect(actual).toEqual(expected);
  });

  test('Given the request fails it should throw an error', async () => {
    server.use(
      http.get(`${baseUrl}/api/catalog/entities/by-query`, () => {
        return new HttpResponse(null, { status: 401 });
      }),
    );

    const projectId = '<project-id>';
    await expect(getBudgetAlertRecipients(projectId)).rejects.toThrow(
      'Failed to fetch budget alert recipients for <project-id> from Backstage (HTTP 401 Unauthorized)',
    );
  });

  test('Given the response contains an unexpected body it should throw an error', async () => {
    server.use(
      http.get(`${baseUrl}/api/catalog/entities/by-query`, () => {
        return HttpResponse.text('<!DOCTYPE html>...');
      }),
    );

    const projectId = '<project-id>';
    await expect(getBudgetAlertRecipients(projectId)).rejects.toThrow(
      'Failed to parse the response from Backstage for <project-id>',
    );
  });
});
