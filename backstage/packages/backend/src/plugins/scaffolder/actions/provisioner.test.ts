import { mockServices } from '@backstage/backend-test-utils';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import { provisionNewResourceAction } from './provisioner';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '<uuid>'),
}));

describe('provisioner', () => {
  describe('data-science-portal:template:get-context', () => {
    const config = mockServices.rootConfig({
      data: {
        backend: {
          plugins: {
            provisioner: {
              repo: {
                owner: '<repo-owner>',
                name: '<repo-name>',
              },
            },
          },
        },
      },
    });
    const action = provisionNewResourceAction(config);
    const mockContext = createMockActionContext({
      templateInfo: {
        entity: { metadata: { name: 'project-create' } },
        entityRef: '',
      },
    });

    beforeEach(() => {
      // Reset mock function calls before each test
      jest.clearAllMocks();
    });

    it('run the action', async () => {
      await action.handler({
        ...mockContext,
        input: {
          parameters: {
            department: 'ph',
            environment: 'x',
            vanityName: 'test-42',
          },
          costCentre: 'ABC123456789',
          section32ManagerEmail: 'emailAddress',
          justification: 'justification',
          serviceOwners:
            'jane.doe@gcp.hc-sc.gc.ca, john.doe@gcp.hc-sc.gc.ca, steve.smith@gcp.hc-sc.gc.ca',
          totalBudget: 10000,
        },
      });

      expect(mockContext.output).toHaveBeenCalledWith('request_id', '<uuid>');
      expect(mockContext.output).toHaveBeenCalledWith(
        'repo_owner',
        '<repo-owner>',
      );
      expect(mockContext.output).toHaveBeenCalledWith(
        'repo_name',
        '<repo-name>',
      );
      expect(mockContext.output).toHaveBeenCalledWith(
        'template',
        'project-create',
      );
      expect(mockContext.output).toHaveBeenCalledWith(
        'folderName',
        'ph-test-42',
      );
      expect(mockContext.output).toHaveBeenCalledWith(
        'projectName',
        'phx-test-42',
      );

      const actual = (mockContext.output as jest.Mock).mock.calls.find(
        call => call[0] === 'pr_description',
      )[1];
      expect(actual).toMatchInlineSnapshot(`
        "# Create 

        This PR was created using Backstage. The request ID is \`&lt;uuid&gt;\`.

        <!-- ### Client Name Email address -->

        ### GCP Project

        **Folder Name:** ph-test-42
        **Project Name:** phx-test-42

        ### Administrative Details

        **Cost Centre:** ABC123456789
        **Justification:** justification
        **Section 32 Manager Email:** emailAddress
        **Service Owners:** jane.doe@gcp.hc-sc.gc.ca, john.doe@gcp.hc-sc.gc.ca, steve.smith@gcp.hc-sc.gc.ca
        "
      `);

      expect(mockContext.output).toHaveBeenCalledWith('template_values', {
        requestId: '<uuid>',
        rootFolderId: '108494461414',
        folderName: 'ph-test-42',
        projectName: 'phx-test-42',
      });
    });
  });
});
