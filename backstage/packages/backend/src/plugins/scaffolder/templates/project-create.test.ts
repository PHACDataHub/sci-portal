import { createMockDirectory } from '@backstage/backend-test-utils';
import { fetchTemplateActionHandler } from '../__testUtils__/fetchTemplateActionHandler';
import { getContextActionHandler } from '../__testUtils__/getContextActionHandler';
import { createUser } from '../__testUtils__/createUser';
import { skip } from '../__testUtils__/skip';

jest.mock('ulidx', () => ({
  ulid: jest.fn(() => '01AN4Z07BY79KA1307SR9X4MV3'),
}));
jest.mock('uuid', () => ({
  v4: jest.fn(() => '6bedd76d-4259-44dd-81d1-1052cfd3fed3'),
}));

export const projectParameters = {
  department: 'ph' as const,
  dataClassification: 'UCLL' as const,
  vanityName: 'test-42',
  editors: 'john.doe@gcp.hc-sc.gc.ca',
  viewers:
    'samantha.jones@gcp.hc-sc.gc.ca, alex.mcdonald@gcp.hc-sc.gc.ca, john.campbell@gcp.hc-sc.gc.ca',
  costCentre: 'ABC123456789',
  costCentreName: 'TPS Reports',
  section32ManagerEmail: 'alice.grady@gcp.hc-sc.gc.ca',
  justification: 'This project will be used for testing our custom action.',
  budgetAmount: 2_000,
  budgetAlertEmailRecipients:
    'john.doe@gcp.hc-sc.gc.ca, steve.smith@gcp.hc-sc.gc.ca',
};

describe('project-create: fetch:template', () => {
  const mockDir = createMockDirectory();

  afterEach(() => {
    mockDir.remove();
  });

  test('The data-science-portal:template:get-context action should render the expected Pull Request description', async () => {
    const { ctx } = await getContextActionHandler({
      template: { name: 'project-create' },
      parameters: {
        ...projectParameters,
      },
      user: createUser({ email: 'jane.doe@gcp.hc-sc.gc.ca' }),
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
      **Editors:** jane.doe@gcp.hc-sc.gc.ca, john.doe@gcp.hc-sc.gc.ca
      **Viewers:** samantha.jones@gcp.hc-sc.gc.ca, alex.mcdonald@gcp.hc-sc.gc.ca, john.campbell@gcp.hc-sc.gc.ca

      ### Budget

      **Annual Budget Amount (CAD):** $2,000
      **Pricing Structure**: Subscription
      **Budget Alert Email Recipients:** jane.doe@gcp.hc-sc.gc.ca, john.doe@gcp.hc-sc.gc.ca, steve.smith@gcp.hc-sc.gc.ca
      "
    `);
  });

  skip('win32')(
    'The fetch:template action should render the expected changes for the Pull Request',
    async () => {
      await fetchTemplateActionHandler({
        template: { name: 'project-create' },
        input: {
          url: './pull-request-changes',
          templateFileExtension: '.njk',
          values: {
            requestId: '<uuid>',
            rootFolderId: '<root-folder-id>',
            projectName: '<project-name>',
            projectId: '<project-id>',
            projectLabels: {
              classification: '<classification>',
              'controlled-by': 'science-portal',
              'cost-centre': '<cost-centre>',
              'cost-centre-name': '<cost-centre-name>',
              department: '<department>',
              'pricing-structure': 'subscription',
              'vanity-name': '<project-name>',
            },
            editors: [
              { email: 'jane.doe@gcp.hc-sc.gc.ca' },
              { email: 'john.doe@gcp.hc-sc.gc.ca' },
            ],
            viewers: [
              { email: 'samantha.jones@gcp.hc-sc.gc.ca' },
              { email: 'alex.mcdonald@gcp.hc-sc.gc.ca' },
              { email: 'john.campbell@gcp.hc-sc.gc.ca' },
            ],
            catalogEntityOwner: 'user:default/jane.doe',
            sourceLocation: 'DMIA-PHAC/SciencePlatform/<project-id>/',
            budgetAlertEmailRecipients: [
              'jane.doe@gcp.hc-sc.gc.ca',
              'samantha.jones@phac-aspc.gc.ca',
              'alex.mcdonald@phac-aspc.gc.ca',
            ],
          },
        },
        mockDir,
      });

      expect(mockDir.content({ path: 'workspace' })).toMatchInlineSnapshot(`
        {
          "catalog-info.yaml": "---
        apiVersion: backstage.io/v1alpha1
        kind: Resource
        metadata:
          name: <project-id>
          title: <project-name>
          annotations:
            backstage.io/source-location: https://github.com/PHACDevHub/sci-portal/DMIA-PHAC/SciencePlatform/<project-id>/
            backstage.io/source-template: template:default/project-create
            cloud.google.com/project: <project-id>
            data-science-portal.phac-aspc.gc.ca/budget-alert-recipients: jane.doe@gcp.hc-sc.gc.ca,samantha.jones@phac-aspc.gc.ca,alex.mcdonald@phac-aspc.gc.ca
        spec:
          type: project
          owner: user:default/jane.doe
        ",
          "claim.yaml": "---
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
          labels:
            classification: '<classification>'
            controlled-by: 'science-portal'
            cost-centre: '<cost-centre>'
            cost-centre-name: '<cost-centre-name>'
            department: '<department>'
            pricing-structure: 'subscription'
            vanity-name: '<project-name>'
        ",
        }
      `);
    },
  );
});
