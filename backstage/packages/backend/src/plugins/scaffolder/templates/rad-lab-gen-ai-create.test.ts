import { createMockDirectory } from '@backstage/backend-test-utils';
import { fetchTemplateActionHandler } from '../__testUtils__/fetchTemplateActionHandler';
import { getContextActionHandler } from '../__testUtils__/getContextActionHandler';
import { projectParameters } from './project-create.test';

jest.mock('ulidx', () => ({
  ulid: jest.fn(() => '01AN4Z07BY79KA1307SR9X4MV3'),
}));
jest.mock('uuid', () => ({
  v4: jest.fn(() => '6bedd76d-4259-44dd-81d1-1052cfd3fed3'),
}));

describe('rad-lab-gen-ai-create: fetch:template', () => {
  const mockDir = createMockDirectory();

  afterEach(() => {
    mockDir.remove();
  });

  test('The data-science-portal:template:get-context action should render the expected Pull Request description', async () => {
    const { ctx } = await getContextActionHandler({
      template: { name: 'rad-lab-gen-ai-create' },
      parameters: {
        ...projectParameters,
        machineSize: 'Medium',
      },
      user: {
        entity: {
          apiVersion: 'backstage.io/v1alpha1',
          kind: 'User',
          metadata: { name: '' },
          spec: { profile: { email: 'jane.doe@gcp.hc-sc.gc.ca' } },
        },
      },
      mockDir,
    });

    expect(ctx.getOutput('pr_description')).toMatchInlineSnapshot(`
      "This PR was created using Backstage.

      **Request ID:** \`6bedd76d-4259-44dd-81d1-1052cfd3fed3\`
      **Requested By:** jane.doe@gcp.hc-sc.gc.ca

      ### GCP Project

      **Project Name:** phx-test-42
      **Project ID:** phx-01an4z07by7
      **Data Classification:** Unclassified

      ### Administrative Details

      **Cost Centre:** ABC123456789
      **Cost Centre Name:** TPS Reports
      **Justification:** This project will be used for testing our custom action.
      **Section 32 Manager Email:** alice.grady@gcp.hc-sc.gc.ca
      **Owners:** jane.doe@gcp.hc-sc.gc.ca, john.doe@gcp.hc-sc.gc.ca
      **Editors:** samantha.jones@gcp.hc-sc.gc.ca, alex.mcdonald@gcp.hc-sc.gc.ca, john.campbell@gcp.hc-sc.gc.ca

      ### Budget

      **Annual Budget Amount (CAD):** $2,000
      **Budget Alert Email Recipients:** jane.doe@gcp.hc-sc.gc.ca, john.doe@gcp.hc-sc.gc.ca, steve.smith@gcp.hc-sc.gc.ca

      ### Rad Lab GenAI

      **Machine Size**: Medium
      "
    `);
  });

  test('The fetch:template action should render the expected changes for the Pull Request', async () => {
    await fetchTemplateActionHandler({
      template: { name: 'rad-lab-gen-ai-create' },
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
        costCentre: 'ABC123456789',
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
        labels:
          cost-centre: abc123456789
      ",
      }
    `);
  });
});
