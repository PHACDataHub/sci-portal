import {
  createMockDirectory,
  mockServices,
} from '@backstage/backend-test-utils';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import { createProvisionTemplateAction } from './provisioner';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '<uuid>'),
}));

const createContext = (options: {
  workspacePath: string;
}) => ({
  ...createMockActionContext({
    input: {
      parameters: {
        department: 'ph' as const,
        environment: 'x' as const,
        vanityName: 'test-42',
      },
      costCentre: 'ABC123456789',
      section32ManagerEmail: 'emailAddress',
      justification: 'justification',
      serviceOwners:
        'jane.doe@gcp.hc-sc.gc.ca, john.doe@gcp.hc-sc.gc.ca',
      totalBudget: 10_000,
      notifyList: 'jane.doe@gcp.hc-sc.gc.ca, john.doe@gcp.hc-sc.gc.ca, steve.smith@gcp.hc-sc.gc.ca',
    },
    templateInfo: {
      entity: { metadata: { name: 'project-create' } },
      entityRef: '',
    },
    workspacePath: options.workspacePath,
  }),
});

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
    const workspacePath = createMockDirectory().resolve('workspace');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should set the template name in the output', async () => {
      const action = createProvisionTemplateAction(config);
      const ctx = createContext({ workspacePath });
      await action.handler(ctx);

      const name = 'template';
      const call = (ctx.output as jest.Mock).mock.calls.find(
        args => args[0] === name,
      );
      expect(call).toEqual([name, 'project-create']);
    });

    it('should set the GitOps repo owner in the output', async () => {
      const action = createProvisionTemplateAction(config);
      const ctx = createContext({ workspacePath });
      await action.handler(ctx);

      const name = 'repo_owner';
      const call = (ctx.output as jest.Mock).mock.calls.find(
        args => args[0] === name,
      );
      expect(call).toEqual([name, '<repo-owner>']);
    });

    it('should set the GitOps repo name in the output', async () => {
      const action = createProvisionTemplateAction(config);
      const ctx = createContext({ workspacePath });
      await action.handler(ctx);

      const name = 'repo_name';
      const call = (ctx.output as jest.Mock).mock.calls.find(
        args => args[0] === name,
      );
      expect(call).toEqual([name, '<repo-name>']);
    });

    it('should set the GitOps branch name in the output', async () => {
      const action = createProvisionTemplateAction(config);
      const ctx = createContext({ workspacePath });
      await action.handler(ctx);

      const name = 'branch';
      const call = (ctx.output as jest.Mock).mock.calls.find(
        args => args[0] === name,
      );
      expect(call).toEqual([name, 'request-<uuid>']);
    });

    it('should set the GCP Folder name in the output', async () => {
      const action = createProvisionTemplateAction(config);
      const ctx = createContext({ workspacePath });
      await action.handler(ctx);

      const name = 'folderName';
      const call = (ctx.output as jest.Mock).mock.calls.find(
        args => args[0] === name,
      );
      expect(call).toEqual([name, 'ph-test-42']);
    });

    it('should set the owners of the created Catalog entity in the output', async () => {
      const action = createProvisionTemplateAction(config);
      const ctx = createContext({ workspacePath });
      await action.handler(ctx);

      const name = 'service_owners';
      const call = (ctx.output as jest.Mock).mock.calls.find(
        args => args[0] === name,
      );
      expect(call).toEqual([name, ['jane.doe@gcp.hc-sc.gc.ca', 'john.doe@gcp.hc-sc.gc.ca']]);
    });

    it('should set the budget alert notification recipients in the output', async () => {
      const action = createProvisionTemplateAction(config);
      const ctx = createContext({ workspacePath });
      await action.handler(ctx);

      const name = 'notify_list';
      const call = (ctx.output as jest.Mock).mock.calls.find(
        args => args[0] === name,
      );
      expect(call).toEqual([name, ['jane.doe@gcp.hc-sc.gc.ca', 'john.doe@gcp.hc-sc.gc.ca', 'steve.smith@gcp.hc-sc.gc.ca']]);
    });

    it('should set the pull request description in the output', async () => {
      const action = createProvisionTemplateAction(config);
      const ctx = createContext({ workspacePath });
      await action.handler(ctx);

      const name = 'pr_description';
      const call = (ctx.output as jest.Mock).mock.calls.find(
        args => args[0] === name,
      );
      expect(call[1]).toMatchInlineSnapshot(`
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
        **Service Owners:** jane.doe@gcp.hc-sc.gc.ca, john.doe@gcp.hc-sc.gc.ca
        "
      `);
    });

    it('should set the pull request content template values in the output', async () => {
      const action = createProvisionTemplateAction(config);
      const ctx = createContext({ workspacePath });
      await action.handler(ctx);

      const name = 'template_values';
      const call = (ctx.output as jest.Mock).mock.calls.find(
        args => args[0] === name,
      );
      expect(call).toEqual([
        name,
        {
          requestId: '<uuid>',
          rootFolderId: '108494461414',
          folderName: 'ph-test-42',
          projectName: 'phx-test-42',
        },
      ]);
    });
  });
});
