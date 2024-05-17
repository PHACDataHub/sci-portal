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

jest.mock('ulidx', () => ({
  ulid: jest.fn(() => '01AN4Z07BY79KA1307SR9X4MV3'),
}));
jest.mock('uuid', () => ({
  v4: jest.fn(() => '6bedd76d-4259-44dd-81d1-1052cfd3fed3'),
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
          templateDir: './templates',
        },
      },
    },
  },
});

const createContext = ({
  template: { namespace = 'default', name, title },
  parameters,
  workspacePath,
}: {
  template: { namespace?: string; name: string; title?: string };
  parameters?: any;
  workspacePath: string;
}) =>
  createMockActionContext({
    input: {
      parameters: {
        department: 'ph' as const,
        dataClassification: 'UCLL' as const,
        vanityName: 'test-42',
        owners: 'jane.doe@gcp.hc-sc.gc.ca, john.doe@gcp.hc-sc.gc.ca',
        editors:
          'samantha.jones@gcp.hc-sc.gc.ca, alex.mcdonald@gcp.hc-sc.gc.ca, john.campbell@gcp.hc-sc.gc.ca',
        costCentre: 'ABC123456789',
        costCentreName: 'TPS Reports',
        section32ManagerEmail: 'alice.grady@gcp.hc-sc.gc.ca',
        justification:
          'This project will be used for testing our custom action.',
        budgetAmount: 2_000,
        budgetAlertEmailRecipients:
          'jane.doe@gcp.hc-sc.gc.ca, john.doe@gcp.hc-sc.gc.ca, steve.smith@gcp.hc-sc.gc.ca',

        ...parameters,
      },
    },
    templateInfo: {
      entity: {
        metadata: {
          namespace,
          name,
          title,
        },
      },
      entityRef: `template:${namespace}/${name}`,
    },
    workspacePath,
  });

describe('provisioner', () => {
  describe('data-science-portal:template:get-context', () => {
    const workspacePath = createMockDirectory().resolve('workspace');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should set the template name in the output', async () => {
      const action = createProvisionTemplateAction(config);
      const ctx = createContext({
        template: { name: 'project-create' },
        workspacePath,
      });
      await action.handler(ctx);

      const name = 'template';
      const call = (ctx.output as jest.Mock).mock.calls.find(
        args => args[0] === name,
      );
      expect(call).toEqual([name, 'project-create']);
    });

    it('should set the GitOps repo owner in the output', async () => {
      const action = createProvisionTemplateAction(config);
      const ctx = createContext({
        template: { name: 'project-create' },
        workspacePath,
      });
      await action.handler(ctx);

      const name = 'repo_owner';
      const call = (ctx.output as jest.Mock).mock.calls.find(
        args => args[0] === name,
      );
      expect(call).toEqual([name, '<repo-owner>']);
    });

    it('should set the GitOps repo name in the output', async () => {
      const action = createProvisionTemplateAction(config);
      const ctx = createContext({
        template: { name: 'project-create' },
        workspacePath,
      });
      await action.handler(ctx);

      const name = 'repo_name';
      const call = (ctx.output as jest.Mock).mock.calls.find(
        args => args[0] === name,
      );
      expect(call).toEqual([name, '<repo-name>']);
    });

    it('should set the GitOps branch name in the output', async () => {
      const action = createProvisionTemplateAction(config);
      const ctx = createContext({
        template: { name: 'project-create' },
        workspacePath,
      });
      await action.handler(ctx);

      const name = 'branch';
      const call = (ctx.output as jest.Mock).mock.calls.find(
        args => args[0] === name,
      );
      expect(call).toEqual([
        name,
        'request-6bedd76d-4259-44dd-81d1-1052cfd3fed3',
      ]);
    });

    it('should set the pull request title', async () => {
      const action = createProvisionTemplateAction(config);
      const ctx = createContext({
        template: { name: 'project-create', title: 'Project Template' },
        workspacePath,
      });
      await action.handler(ctx);

      const name = 'pr_title';
      const call = (ctx.output as jest.Mock).mock.calls.find(
        args => args[0] === name,
      );
      expect(call).toEqual([name, 'Create Project from Template']);
    });

    it('should add the "[Test] "` prefix to the pull request title when we want to Publish and Close the Pull Request', async () => {
      const action = createProvisionTemplateAction(config);
      const ctx = createContext({
        template: { name: 'project-create', title: 'Project Template' },
        parameters: {
          pullRequestAction: 'Publish and Close Pull Request',
        },
        workspacePath,
      });
      await action.handler(ctx);

      const name = 'pr_title';
      const call = (ctx.output as jest.Mock).mock.calls.find(
        args => args[0] === name,
      );
      expect(call).toEqual([name, '[Test] Create Project from Template']);
    });

    it('should set the pull request description in the output', async () => {
      const action = createProvisionTemplateAction(config);
      const ctx = createContext({
        template: { name: 'project-create' },
        workspacePath,
      });
      await action.handler(ctx);

      const name = 'pr_description';
      const call = (ctx.output as jest.Mock).mock.calls.find(
        args => args[0] === name,
      );
      expect(call[1]).toBeTruthy();
      expect(typeof call[1]).toBe('string');
    });

    it('should set the pull request content template values in the output', async () => {
      const action = createProvisionTemplateAction(config);
      const ctx = createContext({
        template: { name: 'project-create' },
        parameters: { additionalProperty: 'foo' },
        workspacePath,
      });
      await action.handler(ctx);

      const name = 'template_values';
      const call = (ctx.output as jest.Mock).mock.calls.find(
        args => args[0] === name,
      );
      expect(call).toEqual([
        name,
        {
          // Metadata
          requestId: '6bedd76d-4259-44dd-81d1-1052cfd3fed3',

          // Project
          rootFolderId: '108494461414',
          projectName: 'phx-test-42',
          projectId: 'phx-01an4z07by7',

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
          costCentreName: 'TPS Reports',
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
