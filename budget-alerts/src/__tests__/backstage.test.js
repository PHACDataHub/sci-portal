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
    process.env.BACKSTAGE_URI = 'https://backstage.alpha.phac-aspc.gc.ca';
  });

  afterEach(() => server.resetHandlers());

  afterAll(() => server.close());

  test('fetchProjectData successfully returns project data', async () => {
    const backstageUri = 'https://backstage.alpha.phac-aspc.gc.ca';
    const projectId = 'phx-01hz5f5jjef';
    server.use(
      http.get(
        `${backstageUri}/api/catalog/entities/by-name/component/default/${projectId}`,
        () => {
          return HttpResponse.json({
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: {
              name: 'phx-01hz5f5jjef',
              title: 'phx-rad-lab-demo',
              annotations: {
                'backstage.io/source-template':
                  'template:default/rad-lab-gen-ai-create',
                'cloud.google.com/project': 'phx-01hz5f5jjef',
                'data-science-portal.phac-aspc.gc.ca/budget-alert-recipients':
                'jane.doe@gcp.hc-sc.gc.ca,john.doe@gcp.hc-sc.gc.ca',
              },
            },
            spec: {
              type: 'rad-lab-module',
              owner: 'user:default/hello.world',
              lifecycle: 'experimental',
            },
          });
        },
      ),
    );

    const actual = await getBudgetAlertRecipients(projectId);
    const expected = ['jane.doe@gcp.hc-sc.gc.ca','john.doe@gcp.hc-sc.gc.ca'];

    expect(actual).toEqual(expected);
  });

  test('fetchProjectData fails to return project data', async () => {
    const backstageUri = 'https://backstage.alpha.phac-aspc.gc.ca';
    const projectId = 'phx-01hz5f5jjef';

    server.use(
      http.get(
        `${backstageUri}/api/catalog/entities/by-name/component/default/${projectId}`,
        () => {
          return HttpResponse.status(500);
        },
      ),
    );

    await expect(getBudgetAlertRecipients(projectId)).rejects.toThrow();
  });
});
