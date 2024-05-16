import { createMockDirectory } from '@backstage/backend-test-utils';
import { fetchTemplateActionHandler } from './__testUtils__/fetchTemplateActionHandler';

describe('project-create: fetch:template', () => {
  const mockDir = createMockDirectory();

  afterEach(() => {
    mockDir.remove();
  });

  test('The fetch:template action should render the expected changes for the Pull Request', async () => {
    await fetchTemplateActionHandler({
      name: 'project-create',
      values: {
        requestId: '<uuid>',
        rootFolderId: '<root-folder-id>',
        projectName: '<project-name>',
        projectId: '<project-id>',
        owners: ['jane.doe@gcp.hc-sc.gc.ca', 'john.doe@gcp.hc-sc.gc.ca'],
        editors: [
          'samantha.jones@gcp.hc-sc.gc.ca',
          'alex.mcdonald@gcp.hc-sc.gc.ca',
          'john.campbell@gcp.hc-sc.gc.ca',
        ],
      },
      mockDir,
    });

    expect(mockDir.content({ path: 'workspace' })).toMatchInlineSnapshot(`
      {
        "project.yaml": "---
      apiVersion: data-science-portal.phac-aspc.gc.ca/v1alpha1
      kind: ProjectClaim
      metadata:
        name: <project-name>-<uuid>
      spec:
        rootFolderId: '<root-folder-id>'
        projectName: <project-name>
        projectId: <project-id>
        projectEditors:
          - user:jane.doe@gcp.hc-sc.gc.ca
          - user:john.doe@gcp.hc-sc.gc.ca
        projectViewers:
          - user:samantha.jones@gcp.hc-sc.gc.ca
          - user:alex.mcdonald@gcp.hc-sc.gc.ca
          - user:john.campbell@gcp.hc-sc.gc.ca
      ",
      }
    `);
  });
});
