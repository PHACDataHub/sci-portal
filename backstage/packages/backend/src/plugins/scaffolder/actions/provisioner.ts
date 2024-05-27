import * as path from 'path';

import { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { JsonObject } from '@backstage/types';
import { resolvePackagePath } from '@backstage/backend-common';
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

interface User extends JsonObject {
  name: string;
  email: string;
}

const toUser = (ownerEmail: string): User => ({
  email: ownerEmail,
  name: ownerEmail.split('@')[0],
});

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
  department: 'hc' | 'ph';
  dataClassification: 'UCLL' | 'PBMM';
  vanityName: string;
  owners?: string;
  editors?: string;

  // Administration
  costCentre: string;
  costCentreName: string;
  section32ManagerEmail: string;
  justification: string;

  // Budget
  budgetAmount: number;
  budgetAlertEmailRecipients?: string;
}

export const createProvisionTemplateAction = (config: Config) => {
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
              'department',
              'dataClassification',
              'vanityName',

              // Administration
              'costCentre',
              'section32ManagerEmail',
              'justification',

              // Budget
              'budgetAmount',
            ],
            properties: {
              // Project
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
              vanityName: {
                title: 'Vanity Name',
                description:
                  'The resource display name. The name must less than 26 characters. The name will be used to create a GCP Project named `<department>-<vanity-name>` in [HC-DMIA > DMIA-PHAC > SciencePlatform](https://console.cloud.google.com/cloud-resource-manager?folder=108494461414)',
                type: 'string',
                minLength: 1,
                maxLength: 26,
              },
              owners: {
                title: 'Owners',
                description:
                  'The `@gcp.hc-sc.gc.ca` email addresses of users who should own this service, separated by comma.',
                type: 'string',
              },
              editors: {
                title: 'Editors',
                description:
                  'The `@gcp.hc-sc.gc.ca` email addresses of users who should be able to edit this service, separated by comma.',
                type: 'string',
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

        // Information Management and Security
        dataClassificationTitle:
          dataClassificationTitle[ctx.input.parameters.dataClassification],

        // Budget
        formattedBudgetAmount: formatCurrency(
          ctx.input.parameters.budgetAmount,
        ),
        budgetAlertEmailRecipients: parseEmailInput(
          ctx.input.parameters.budgetAlertEmailRecipients,
        ),

        // Permissions
        owners: parseEmailInput(ctx.input.parameters.owners).map(toUser),
        editors: parseEmailInput(ctx.input.parameters.editors).map(toUser),
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
    },
  });
};
