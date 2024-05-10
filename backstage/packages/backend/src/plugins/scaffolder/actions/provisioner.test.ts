import {
  createMockDirectory,
  mockServices,
} from '@backstage/backend-test-utils';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import {
  createProvisionTemplateAction,
  getConfig,
  parseEmailInput,
} from './provisioner';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '<uuid>'),
}));

const config = mockServices.rootConfig({
  data: {
    backend: {
      plugins: {
        provisioner: {
          repo: {
            owner: '<repo-owner>',
            name: '<repo-name>',
          },
          templateDir: '../../../../../../templates',
        },
      },
    },
  },
});
const workspacePath = createMockDirectory().resolve('workspace');

const createContext = ({ workspacePath }: { workspacePath: string }) => ({
  ...createMockActionContext({
    input: {
      parameters: {
        department: 'ph' as const,
        dataClassification: 'UCLL' as const,
        vanityName: 'test-42',
        owners: 'jane.doe@gcp.hc-sc.gc.ca, john.doe@gcp.hc-sc.gc.ca',
        editors:
          'samantha.jones@gcp.hc-sc.gc.ca, alex.mcdonald@gcp.hc-sc.gc.ca, john.campbell@gcp.hc-sc.gc.ca',
        costCentre: 'ABC123456789',
        section32ManagerEmail: 'alice.grady@gcp.hc-sc.gc.ca',
        justification:
          'This project will be used for testing our custom action.',
        budgetAmount: 2_000,
        budgetAlertEmailRecipients:
          'jane.doe@gcp.hc-sc.gc.ca, john.doe@gcp.hc-sc.gc.ca, steve.smith@gcp.hc-sc.gc.ca',

        additionalProperty: 'foo',
      },
    },
    templateInfo: {
      entity: {
        metadata: {
          name: 'project-create',
          title: 'Project Template',
        },
      },
      entityRef: '',
    },
    workspacePath,
  }),
});

describe('provisioner', () => {
  describe('data-science-portal:template:get-context', () => {
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

    it('should set the pull request description in the output', async () => {
      const action = createProvisionTemplateAction(config);
      const ctx = createContext({ workspacePath });
      await action.handler(ctx);

      const name = 'pr_description';
      const call = (ctx.output as jest.Mock).mock.calls.find(
        args => args[0] === name,
      );
      expect(call[1]).toMatchInlineSnapshot(`
        "This PR was created using Backstage. The request ID is \`&lt;uuid&gt;\`.

        <!-- ### Client Name Email address -->

        ### GCP Project

        **Folder Name:** ph-test-42
        **Project Name:** ph-test-42
        **Project ID:** ph-test-42
        **Data Classification:** Unclassified

        ### Administrative Details

        **Cost Centre:** ABC123456789
        **Justification:** This project will be used for testing our custom action.
        **Section 32 Manager Email:** alice.grady@gcp.hc-sc.gc.ca
        **Service Owners:** jane.doe@gcp.hc-sc.gc.ca, john.doe@gcp.hc-sc.gc.ca
        **Editors:** samantha.jones@gcp.hc-sc.gc.ca, alex.mcdonald@gcp.hc-sc.gc.ca, john.campbell@gcp.hc-sc.gc.ca

        ### Billing Details

        **Annual Budget Amount (CAD):** $2,000
        **Budget Alert Email Recipients:** jane.doe@gcp.hc-sc.gc.ca, john.doe@gcp.hc-sc.gc.ca, steve.smith@gcp.hc-sc.gc.ca"
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
          // Metadata
          requestId: '<uuid>',

          // Project
          rootFolderId: '108494461414',
          folderName: 'ph-test-42',
          projectName: 'ph-test-42',
          projectId: 'ph-test-42',

          // Information Management and Security
          dataClassificationTitle: 'Unclassified',

          // Budget
          formattedBudgetAmount: '$2,000',
          budgetAlertEmailRecipients: [
            'jane.doe@gcp.hc-sc.gc.ca',
            'john.doe@gcp.hc-sc.gc.ca',
            'steve.smith@gcp.hc-sc.gc.ca',
          ],

          // Backstage Catalog Entity
          owners: [
            {
              email: 'jane.doe@gcp.hc-sc.gc.ca',
              name: 'jane.doe',
            },
            {
              email: 'john.doe@gcp.hc-sc.gc.ca',
              name: 'john.doe',
            },
          ],
          editors: [
            {
              email: 'samantha.jones@gcp.hc-sc.gc.ca',
              name: 'samantha.jones',
            },
            {
              email: 'alex.mcdonald@gcp.hc-sc.gc.ca',
              name: 'alex.mcdonald',
            },
            {
              email: 'john.campbell@gcp.hc-sc.gc.ca',
              name: 'john.campbell',
            },
          ],

          // The rest of ctx.input:
          department: 'ph',
          dataClassification: 'UCLL',
          vanityName: 'test-42',

          costCentre: 'ABC123456789',
          section32ManagerEmail: 'alice.grady@gcp.hc-sc.gc.ca',
          justification:
            'This project will be used for testing our custom action.',

          budgetAmount: 2_000,

          // An additional property that is not in the input schema is included in the output.
          additionalProperty: 'foo',
        },
      ]);
    });
  });
});

describe('parseEmailInput', () => {
  test('Given undefined it should return an empty array', () => {
    const actual = parseEmailInput();
    const expected: string[] = [];

    expect(actual).toEqual(expected);
  });

  test('Given an empty string it should return an empty array', () => {
    const actual = parseEmailInput('');
    const expected: string[] = [];

    expect(actual).toEqual(expected);
  });

  test('Given an email address it should an array the email address', () => {
    const actual = parseEmailInput('jane.doe@gcp.hc-sc.gc.ca');
    const expected: string[] = ['jane.doe@gcp.hc-sc.gc.ca'];

    expect(actual).toEqual(expected);
  });

  it('should ignore leading whitespace', () => {
    const actual = parseEmailInput('  jane.doe@gcp.hc-sc.gc.ca');
    const expected: string[] = ['jane.doe@gcp.hc-sc.gc.ca'];

    expect(actual).toEqual(expected);
  });

  it('should ignore leading commas', () => {
    const actual = parseEmailInput(',jane.doe@gcp.hc-sc.gc.ca');
    const expected: string[] = ['jane.doe@gcp.hc-sc.gc.ca'];

    expect(actual).toEqual(expected);
  });

  it('should ignore trailing whitespace', () => {
    const actual = parseEmailInput('jane.doe@gcp.hc-sc.gc.ca    ');
    const expected: string[] = ['jane.doe@gcp.hc-sc.gc.ca'];

    expect(actual).toEqual(expected);
  });

  it('should ignore trailing commas', () => {
    const actual = parseEmailInput('jane.doe@gcp.hc-sc.gc.ca, ');
    const expected: string[] = ['jane.doe@gcp.hc-sc.gc.ca'];

    expect(actual).toEqual(expected);
  });

  it('should handle multiple addresses', () => {
    const actual = parseEmailInput(
      '  , jane.doe@gcp.hc-sc.gc.ca ,  , john.doe@gcp.hc-sc.gc.ca ,   ',
    );
    const expected: string[] = [
      'jane.doe@gcp.hc-sc.gc.ca',
      'john.doe@gcp.hc-sc.gc.ca',
    ];

    expect(actual).toEqual(expected);
  });

  it('should return an array of unique entries', () => {
    const actual = parseEmailInput(
      '  , jane.doe@gcp.hc-sc.gc.ca ,  , jane.doe@gcp.hc-sc.gc.ca ,   ',
    );
    const expected: string[] = ['jane.doe@gcp.hc-sc.gc.ca'];

    expect(actual).toEqual(expected);
  });
});

describe('getConfig', () => {
  describe('templateDir', () => {
    it('should handle an absolute path', () => {
      const rootConfig = mockServices.rootConfig({
        data: {
          backend: {
            plugins: {
              provisioner: {
                repo: {
                  owner: '<repo-owner>',
                  name: '<repo-name>',
                },
                templateDir: '/app/templates',
              },
            },
          },
        },
      });
      const actual = getConfig(rootConfig).templateDir;
      const expected = '/app/templates';

      expect(actual).toBe(expected);
    });
  });
});
