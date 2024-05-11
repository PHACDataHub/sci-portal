import * as path from 'path';
import nunjucks from 'nunjucks';
import { v4 as uuidv4 } from 'uuid';
import { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { JsonObject } from '@backstage/types';

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
  const templateDir = path.isAbsolute(rawTemplateDir)
    ? rawTemplateDir
    : path.join(__dirname, rawTemplateDir);

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
              'owners',
              'editors',

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
                  'The resource display name. The name must less than 26 characters. The name will be used to create a GCP Folder named `<department>-<vanity-name>` and a Project named `<department>-<vanity-name>` in [HC-DMIA > DMIA-PHAC > SciencePlatform](https://console.cloud.google.com/cloud-resource-manager?folder=108494461414)',
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
                title: 'costCentre',
                description: 'The Cost Centre associated with the resource.',
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
      if (!(ctx.input.parameters.dataClassification in dataClassificationTitle)) {
        throw new InputError(
          `Invalid dataClassification provided in the request: ${JSON.stringify(
            ctx.input.parameters.dataClassification,
            null,
            2,
          )}`,
        );
      }

      const requestId = uuidv4();

      const { repo, templateDir } = getConfig(config);
      ctx.output('repo_owner', repo.owner);
      ctx.output('repo_name', repo.name);
      ctx.output('branch', `request-${requestId}`);

      const template = ctx.templateInfo.entity.metadata.name;
      ctx.output('template', template);

      const folderName = `${ctx.input.parameters.department}-${ctx.input.parameters.vanityName}`;
      ctx.output('folderName', folderName);

      const projectName = `${ctx.input.parameters.department}-${ctx.input.parameters.vanityName}`;
      const projectId = projectName;

      // Render the Pull Request description template
      const env = nunjucks.configure(templateDir);

      // Add the map() filter from jinja into Nunjucks.
      // https://jinja.palletsprojects.com/en/3.1.x/templates/#jinja-filters.map
      env.addFilter('map', (array: any, attribute: string) => {
        return array.map((item: any) => item[attribute]);
      });

      const templateContext = {
        ...ctx.input.parameters,

        // Metadata
        requestId,

        // Project
        rootFolderId,
        folderName,
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

        // Backstage Catalog Entity
        owners: parseEmailInput(ctx.input.parameters.owners).map(toUser),
        editors: parseEmailInput(ctx.input.parameters.editors).map(toUser),
      };

      const templateTitle =
        ctx.templateInfo.entity.metadata.title ||
        ctx.templateInfo.entity.metadata.name;
      const pullRequestTitle = `Create ${templateTitle.replace(
        / Template$/i,
        '',
      )} from Template`;
      const pullRequestDescription = env.render(
        path.join(template, 'description.md.njk'),
        templateContext,
      );
      ctx.output('pr_title', pullRequestTitle);
      ctx.output('pr_description', pullRequestDescription);

      // Populate the template values for the Pull Request changes
      ctx.output('template_values', templateContext);
    },
  });
};
