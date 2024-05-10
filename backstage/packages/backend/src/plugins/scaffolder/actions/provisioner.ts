import * as path from 'path';
import nunjucks from 'nunjucks';
import { v4 as uuidv4 } from 'uuid';
import { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { JsonObject } from '@backstage/types';

const templateDir = path.join(__dirname, '../../../../../../templates');
const rootFolderId = '108494461414';

interface ProvisionerConfig {
  repo: {
    owner: string;
    name: string;
  };
}

const getConfig = (config: Config): ProvisionerConfig => {
  return {
    repo: {
      owner: config.getString('backend.plugins.provisioner.repo.owner'),
      name: config.getString('backend.plugins.provisioner.repo.name'),
    },
  };
};

const validateConfig = (config: Config) => {
  getConfig(config);
};

export const parseEmailInput = (str?: string): string[] => {
  if (str) {
    return str
      .trim()
      .split(/\s*,\s*/)
      .filter(str => str.length);
  }
  return [];
};

interface TemplateParameters extends JsonObject {
  // Project
  department: 'hc' | 'ph';
  environment: 'x' | 't' | 'p';
  vanityName: string;
  owners?: string;

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
              'environment',
              'vanityName',
              'owners',

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
              environment: {
                title: 'Environment',
                description:
                  'The environment ID. Use "x" for Experimentation, "t" for "Noble-Experimentation, and "p" for production.',
                enum: ['x', 't', 'p'],
              },
              vanityName: {
                title: 'Vanity Name',
                description:
                  'The resource display name. The name must less than 26 characters. The name will be used to create a GCP Folder named `<department>-<vanity-name>` and a Project named `<department><environment>-<vanity-name>` in [HC-DMIA > DMIA-PHAC > SciencePlatform](https://console.cloud.google.com/cloud-resource-manager?folder=108494461414)',
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

      const requestId = uuidv4();

      const provisionerConfig = getConfig(config);
      ctx.output('repo_owner', provisionerConfig.repo.owner);
      ctx.output('repo_name', provisionerConfig.repo.name);
      ctx.output('branch', `request-${requestId}`);

      const template = ctx.templateInfo.entity.metadata.name;
      ctx.output('template', template);

      const folderName = `${ctx.input.parameters.department}-${ctx.input.parameters.vanityName}`;
      ctx.output('folderName', folderName);

      const projectName = `${ctx.input.parameters.department}${ctx.input.parameters.environment}-${ctx.input.parameters.vanityName}`;
      const projectId = projectName;

      // Render the Pull Request description template
      nunjucks.configure(templateDir);
      const templateContext = {
        ...ctx.input.parameters,

        // Metadata
        templateTitle: ctx.templateInfo.entity.metadata.title,
        requestId,

        // Project and Budget
        rootFolderId,
        folderName,
        projectName,
        projectId,
        budgetAlertEmailRecipients: parseEmailInput(
          ctx.input.parameters.budgetAlertEmailRecipients,
        ),

        // Backstage Catalog Entity
        owners: parseEmailInput(ctx.input.parameters.owners),
      };

      const pullRequestDescription = nunjucks.render(
        path.join(template, 'description.md.njk'),
        templateContext,
      );
      ctx.output('pr_description', pullRequestDescription);

      // Populate the template values for the Pull Request changes
      ctx.output('template_values', templateContext);
    },
  });
};
