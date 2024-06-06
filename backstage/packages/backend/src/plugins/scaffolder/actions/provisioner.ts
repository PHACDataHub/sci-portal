import * as path from 'path';

import { AuthService, resolvePackagePath } from '@backstage/backend-plugin-api';
import { CatalogApi } from '@backstage/catalog-client';
import { UserEntity } from '@backstage/catalog-model';
import { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { JsonObject } from '@backstage/types';
import * as nunjucks from 'nunjucks';
import { ulid } from 'ulidx';
import { v4 as uuidv4 } from 'uuid';

const rootFolderId = '108494461414';

interface ProvisionerConfig {
  repo: {
    owner: string;
    name: string;
  };
  templateDir: string;
}

export const getConfig = (config: Config): ProvisionerConfig => {
  const rawTemplateDir = config.getString(
    'backend.plugins.provisioner.templateDir',
  );
  const rootDir = resolvePackagePath('backend', '../../');
  const templateDir = path.isAbsolute(rawTemplateDir)
    ? rawTemplateDir
    : path.join(rootDir, rawTemplateDir);

  return {
    repo: {
      owner: config.getString('backend.plugins.provisioner.repo.owner'),
      name: config.getString('backend.plugins.provisioner.repo.name'),
    },
    templateDir,
  };
};

const validateConfig = (config: Config) => {
  getConfig(config);
};

/**
 * Returns a unique project ID based on the department and part of a ULID.
 */
const createProjectId = (department: TemplateParameters['department']) => {
  // All projects are treated as Experimental for now.
  const environment = 'x';

  // The unique ID is based on a ULID. It used the 10-character timestamp part, and one more.
  // This follows Keith's specification, use in acm-core, and the ulid tool defined in https://github.com/PHACDataHub/rust-tools/tree/main/tools/ulid#building-this-tool-from-a-dockerfile-to-be-used-in-a-container-part-of-multi-stage-build.
  const id = ulid().substring(0, 11).toLowerCase();

  return `${department}${environment}-${id}`;
};

/**
 * Returns an array of unique email addresses, ignoring whitespace and extra commas.
 */
export const parseEmailInput = (str?: string): string[] => {
  if (!str) {
    return [];
  }

  const set = new Set<string>();
  for (const substring of str.trim().split(/\s*,\s*/)) {
    if (!substring || set.has(substring)) {
      continue;
    }
    set.add(substring);
  }
  return Array.from(set);
};

/**
 * Returns the User's Google Cloud email address.
 */
const getGoogleCloudEmailsByRefs = async (
  catalogApi: CatalogApi,
  entityRefs: string[],
  token: string,
) => {
  const { items } = await catalogApi.getEntitiesByRefs(
    { entityRefs, fields: ['spec.profile.email'] },
    { token },
  );

  const result = [];
  for (const item of items) {
    if (!item) {
      continue;
    }

    const ref = `user:${item.metadata.namespace ?? 'default'}/${
      item.metadata.name
    }`;
    const email = (item as CustomUserEntity).spec.profile.email;

    result.push({ ref, email });
  }
  return result;
};

const prepend = <T>(x: T, xs: T[]) => {
  const result = Array.from(xs);
  result.unshift(x);
  return result;
};

const uniq = <T>(xs: T[]) => Array.from(new Set(xs));

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value);

const dataClassificationTitle = {
  UCLL: 'Unclassified',
  PBMM: 'Protected B',
};

interface TemplateParameters extends JsonObject {
  // Project
  branch: string;
  department: 'hc' | 'ph';
  dataClassification: 'UCLL' | 'PBMM';
  vanityName: string;
  editorRefs: string[];
  viewerRefs: string[];
  teamName: string;

  // Administration
  costCentre: string;
  costCentreName: string;
  section32ManagerEmail: string;
  justification: string;

  // Budget
  budgetAmount: number;
  budgetAlertEmailRecipients?: string;
}

interface CustomUserEntity extends UserEntity {
  spec: UserEntity['spec'] & {
    profile: UserEntity['spec']['profile'] & {
      altEmail?: string;
    };
  };
}

export const createProvisionTemplateAction = (options: {
  auth: AuthService;
  catalogApi: CatalogApi;
  config: Config;
}) => {
  const { auth, config, catalogApi } = options;
  validateConfig(config);

  return createTemplateAction<{ parameters: TemplateParameters }>({
    id: 'data-science-portal:template:get-context',
    schema: {
      input: {
        required: ['parameters'],
        type: 'object',
        properties: {
          parameters: {
            type: 'object',
            required: [
              // Project
              'branch',
              'department',
              'dataClassification',
              'vanityName',
              'teamName',

              // Administration
              'costCentre',
              'section32ManagerEmail',
              'justification',

              // Budget
              'budgetAmount',
            ],
            properties: {
              // Project
              branch: {
                title: 'Branch',
                description: 'The branch within your department.',
                type: 'string',
              },
              department: {
                title: 'Department',
                description: 'The department ID.',
                enum: ['hc', 'ph'],
              },
              dataClassification: {
                title: 'Data Classification',
                description:
                  'The level of security for the project information and assets.',
                enum: ['UCLL', 'PBMM'],
              },
              teamName: {
                title: 'Team Name',
                description: 'The team name associated with the project.',
                type: 'string',
              },
              vanityName: {
                title: 'Vanity Name',
                description:
                  'The resource display name. The name must less than 26 characters. The name will be used to create a GCP Project named `<department>-<vanity-name>` in [HC-DMIA > DMIA-PHAC > SciencePlatform](https://console.cloud.google.com/cloud-resource-manager?folder=108494461414)',
                type: 'string',
                minLength: 1,
                maxLength: 26,
              },
              editorRefs: {
                title: 'Editors',
                description:
                  'The users who should be able to edit this service.',
                type: 'array',
                items: {
                  type: 'string',
                },
              },
              viewerRefs: {
                title: 'Viewers',
                description:
                  'The users who should be able to view this service.',
                type: 'array',
                items: {
                  type: 'string',
                },
              },

              // Administration
              costCentre: {
                title: 'Cost Centre',
                description: 'The Cost Centre associated with the resource.',
                type: 'string',
              },
              costCentreName: {
                title: 'Cost Centre Name',
                description: 'The human-readable name for the Cost Centre.',
                type: 'string',
              },
              section32ManagerEmail: {
                title: 'section32ManagerEmail',
                description: `The Section 32 Manager's email address`,
                type: 'string',
              },
              justification: {
                title: 'Justification',
                description:
                  'Provide a brief explanation of what the project will be used for.',
                type: 'string',
              },

              // Budget
              budgetAmount: {
                title: 'Annual Budget Amount (CAD)',
                type: 'number',
              },
              budgetAlertEmailRecipients: {
                title: 'Budget Alert Email Recipients',
                description:
                  'The `@phac-aspc.gc.ca` email addresses of users who should be notified of budget alerts, separated by a comma.',
                type: 'string',
              },
            },
          },
        },
      },
    },
    async handler(ctx) {
      if (!ctx.user || !ctx.user.ref) {
        throw new InputError(`Invalid user: ${ctx.user}`);
      }
      if (!ctx?.templateInfo?.entity) {
        throw new InputError('Invalid templateInfo provided in the request');
      }
      if (
        !(ctx.input.parameters.dataClassification in dataClassificationTitle)
      ) {
        throw new InputError(
          `Invalid dataClassification provided in the request: ${JSON.stringify(
            ctx.input.parameters.dataClassification,
            null,
            2,
          )}`,
        );
      }

      const requestId = uuidv4();

      const { repo } = getConfig(config);
      ctx.output('repo_owner', repo.owner);
      ctx.output('repo_name', repo.name);
      ctx.output('branch', `request-${requestId}`);

      // We assume all projects are for Experimentation.
      const environment = 'x';

      const projectName = `${ctx.input.parameters.department}${environment}-${ctx.input.parameters.vanityName}`;
      const projectId = createProjectId(ctx.input.parameters.department);

      // Get the Catalog API token
      const { token } = (await auth?.getPluginRequestToken({
        onBehalfOf: await ctx.getInitiatorCredentials(),
        targetPluginId: 'catalog',
      })) ?? { token: ctx.secrets?.backstageToken };

      // Transform the auto-complete "editors" entity refs into email addresses.
      const editors = await getGoogleCloudEmailsByRefs(
        catalogApi,
        uniq(prepend(ctx.user.ref, ctx.input.parameters.editorRefs)),
        token,
      );

      // Transform the auto-complete "viewers" entity refs into email addresses.
      const viewers = await getGoogleCloudEmailsByRefs(
        catalogApi,
        uniq(ctx.input.parameters.viewerRefs),
        token,
      );

      let budgetAlertEmailRecipients = parseEmailInput(
        ctx.input.parameters.budgetAlertEmailRecipients,
      );
      const budgetAlertEmail =
        (ctx.user.entity as CustomUserEntity)?.spec.profile?.altEmail ||
        ctx.user?.entity?.spec.profile?.email;
      if (budgetAlertEmail) {
        budgetAlertEmailRecipients = prepend(
          budgetAlertEmail,
          budgetAlertEmailRecipients,
        );
      }
      budgetAlertEmailRecipients = uniq(budgetAlertEmailRecipients);

      // Set the template output directory
      ctx.output('kustomization_path', 'DMIA-PHAC/kustomization.yaml');
      ctx.output('kustomization_resource', `SciencePlatform/${projectId}/`);
      const sourceLocation = `DMIA-PHAC/SciencePlatform/${projectId}/`;

      // Populate the template values
      const templateValues = {
        ...ctx.input.parameters,

        // Metadata
        requestId,
        requestEmail:
          ctx?.user?.entity?.spec?.profile?.email ?? ctx?.user?.ref ?? '',

        // Project
        rootFolderId,
        projectName,
        projectId,
        projectLabels: {
          // Only hyphens (-), underscores (_), lowercase characters, and numbers are allowed. International characters are allowed.
          branch: ctx.input.parameters.branch.toLowerCase(),
          classification: ctx.input.parameters.dataClassification.toLowerCase(),
          'controlled-by': 'science-portal',
          'cost-centre': ctx.input.parameters.costCentre.toLowerCase(),
          'cost-centre-name': ctx.input.parameters.costCentreName.toLowerCase(),
          department: ctx.input.parameters.department.toLowerCase(),
          'pricing-structure': 'subscription',
          'team-name': ctx.input.parameters.teamName.toLowerCase(),
          'vanity-name': projectName.toLowerCase(),
        },

        // Information Management and Security
        dataClassificationTitle:
          dataClassificationTitle[ctx.input.parameters.dataClassification],

        // Budget
        formattedBudgetAmount: formatCurrency(
          ctx.input.parameters.budgetAmount,
        ),
        budgetAlertEmailRecipients,

        // Permissions
        editors,
        viewers,

        // Backstage
        catalogEntityOwner: `group:default/${projectId}-editors`,
        sourceLocation,
      };
      ctx.output('template_values', templateValues);

      // Set the Pull Request title
      const templateTitle =
        ctx.templateInfo.entity.metadata.title ||
        ctx.templateInfo.entity.metadata.name;
      const pullRequestTitlePrefix =
        ctx.input.parameters.pullRequestAction ===
        'Publish and Close Pull Request'
          ? '[Test] '
          : '';
      const pullRequestTitle = `${pullRequestTitlePrefix}Create ${templateTitle.replace(
        / Template$/i,
        '',
      )} from Template`;
      ctx.output('pr_title', pullRequestTitle);

      // Render the Pull Request description from a template
      const template = ctx.templateInfo.entity.metadata.name;
      ctx.output('template', template);

      const { templateDir } = getConfig(config);
      const env = nunjucks.configure(templateDir);
      env.addFilter('map', (array: any, attribute: string) => {
        // See https://jinja.palletsprojects.com/en/3.1.x/templates/#jinja-filters.map.
        return array.map((item: any) => item[attribute]);
      });
      const pullRequestDescription = env.render(
        path.join(template, 'pull-request-description.njk'),
        templateValues,
      );
      ctx.output('pr_description', pullRequestDescription);
      ctx.output('source_location', sourceLocation);
    },
  });
};
