import {
  createMockDirectory,
  mockServices,
} from '@backstage/backend-test-utils';
import { getConfig, parseEmailInput } from './provisioner';
import { getContextActionHandler } from '../__testUtils__/getContextActionHandler';

jest.mock('ulidx', () => ({
  ulid: jest.fn(() => '01AN4Z07BY79KA1307SR9X4MV3'),
}));
jest.mock('uuid', () => ({
  v4: jest.fn(() => '6bedd76d-4259-44dd-81d1-1052cfd3fed3'),
}));

describe('provisioner', () => {
  describe('data-science-portal:template:get-context', () => {
    const mockDir = createMockDirectory();

    beforeEach(() => {
      mockDir.remove();
    });

    it('should set the template name in the output', async () => {
      const { ctx } = await getContextActionHandler({
        template: { name: 'project-create' },
        mockDir,
      });

      expect(ctx.getOutput('template')).toBe('project-create');
    });

    it('should set the GitOps repo owner in the output', async () => {
      const { ctx } = await getContextActionHandler({
        template: { name: 'project-create' },
        config: mockServices.rootConfig({
          data: {
            backend: {
              plugins: {
                provisioner: {
                  repo: {
                    owner: '<test-repo-owner>',
                    name: '<test-repo-name>',
                  },
                  templateDir: './templates',
                },
              },
            },
          },
        }),
        mockDir,
      });

      expect(ctx.getOutput('repo_owner')).toBe('<test-repo-owner>');
    });

    it('should set the GitOps repo name in the output', async () => {
      const { ctx } = await getContextActionHandler({
        template: { name: 'project-create' },
        config: mockServices.rootConfig({
          data: {
            backend: {
              plugins: {
                provisioner: {
                  repo: {
                    owner: '<test-repo-owner>',
                    name: '<test-repo-name>',
                  },
                  templateDir: './templates',
                },
              },
            },
          },
        }),
        mockDir,
      });

      expect(ctx.getOutput('repo_name')).toBe('<test-repo-name>');
    });

    it('should set the GitOps branch name in the output', async () => {
      const { ctx } = await getContextActionHandler({
        template: { name: 'project-create' },
        mockDir,
      });

      expect(ctx.getOutput('branch')).toBe(
        'request-6bedd76d-4259-44dd-81d1-1052cfd3fed3',
      );
    });

    it('should set the pull request title', async () => {
      const { ctx } = await getContextActionHandler({
        template: { name: 'project-create', title: 'Project Template' },
        mockDir,
      });

      expect(ctx.getOutput('pr_title')).toBe('Create Project from Template');
    });

    it('should add the "[Test] "` prefix to the pull request title when we want to Publish and Close the Pull Request', async () => {
      const { ctx } = await getContextActionHandler({
        template: { name: 'project-create', title: 'Project Template' },
        parameters: {
          pullRequestAction: 'Publish and Close Pull Request',
        },
        mockDir,
      });

      expect(ctx.getOutput('pr_title')).toBe(
        '[Test] Create Project from Template',
      );
    });

    it('should set the pull request description in the output', async () => {
      const { ctx } = await getContextActionHandler({
        template: { name: 'project-create' },
        mockDir,
      });

      expect(ctx.getOutput('pr_description')).toBeTruthy();
      expect(typeof ctx.getOutput('pr_description')).toBe('string');
    });

    it('should set the template values in the output', async () => {
      const { ctx } = await getContextActionHandler({
        template: { name: 'project-create' },
        parameters: {
          department: 'hc',
          vanityName: 'test-case',
          dataClassification: 'PBMM',
          costCentre: 'JBU987654321',
          costCentreName: 'ACME',
          section32ManagerEmail: 'michael.williamson@phac-aspc.gc.ca',
          justification:
            'We need a test GCP Project to unit test the get-context action.',
          budgetAmount: 12345,
          budgetAlertEmailRecipients:
            'samantha.jones@phac-aspc.gc.ca, alex.mcdonald@phac-aspc.gc.ca',
          owners:
            '   ,,, , jeanne.smith@phac-aspc.gc.ca,karen.schumacher@phac-aspc.gc.ca,,',
          editors:
            ' samantha.jones@gcp.hc-sc.gc.ca, john.campbell@gcp.hc-sc.gc.ca',

          additionalProperty: 'OK',
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

      // Check the values are set. We check how they're used in the
      expect(ctx.getOutput('template_values')).toEqual({
        // User Input
        department: 'hc',
        vanityName: 'test-case',
        dataClassification: 'PBMM',
        costCentre: 'JBU987654321',
        costCentreName: 'ACME',
        section32ManagerEmail: 'michael.williamson@phac-aspc.gc.ca',
        justification:
          'We need a test GCP Project to unit test the get-context action.',
        budgetAmount: 12_345,

        // Metadata
        requestId: '6bedd76d-4259-44dd-81d1-1052cfd3fed3',
        requestEmail: 'jane.doe@gcp.hc-sc.gc.ca',

        // Project
        rootFolderId: '108494461414',
        projectName: 'hcx-test-case',
        projectId: 'hcx-01an4z07by7',
        dataClassificationTitle: 'Protected B',

        // Budget
        formattedBudgetAmount: '$12,345',
        budgetAlertEmailRecipients: [
          'samantha.jones@phac-aspc.gc.ca',
          'alex.mcdonald@phac-aspc.gc.ca',
        ],

        // Permissions
        owners: [
          { name: 'jeanne.smith', email: 'jeanne.smith@phac-aspc.gc.ca' },
          {
            name: 'karen.schumacher',
            email: 'karen.schumacher@phac-aspc.gc.ca',
          },
        ],
        editors: [
          { name: 'samantha.jones', email: 'samantha.jones@gcp.hc-sc.gc.ca' },
          { name: 'john.campbell', email: 'john.campbell@gcp.hc-sc.gc.ca' },
        ],

        // Additional properties that are not in the input schema are included in the output.
        additionalProperty: 'OK',
      });
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
