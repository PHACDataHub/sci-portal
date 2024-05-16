import { createMockDirectory } from '@backstage/backend-test-utils';
import { fetchTemplateActionHandler } from './__testUtils__/fetchTemplateActionHandler';

describe('rad-lab-gen-ai-create: fetch:template', () => {
  const mockDir = createMockDirectory();

  afterEach(() => {
    mockDir.remove();
  });

  test('The fetch:template action should render the expected changes for the Pull Request', async () => {
    await fetchTemplateActionHandler({
      name: 'rad-lab-gen-ai-create',
      values: {
        requestId: '<uuid>',
        rootFolderId: '<root-folder-id>',
        projectName: '<project-name>',
        projectId: '<project-id>',
        owners: [
          { email: 'jane.doe@gcp.hc-sc.gc.ca' },
          { email: 'john.doe@gcp.hc-sc.gc.ca' },
        ],
        editors: [
          { email: 'samantha.jones@gcp.hc-sc.gc.ca' },
          { email: 'alex.mcdonald@gcp.hc-sc.gc.ca' },
          { email: 'john.campbell@gcp.hc-sc.gc.ca' },
        ],
      },
      mockDir,
    });

    expect(mockDir.content({ path: 'workspace' })).toMatchInlineSnapshot(`
      {
        "claim.yaml": "---
      apiVersion: data-science-portal.phac-aspc.gc.ca/v1alpha1
      kind: RadLabGenAIClaim
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
