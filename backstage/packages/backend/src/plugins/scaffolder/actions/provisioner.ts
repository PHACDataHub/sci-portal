import * as path from 'path';
import nunjucks from 'nunjucks';
import { v4 as uuidv4 } from 'uuid';
import { Config } from '@backstage/config';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { InputError } from '@backstage/errors';

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

export const createProvisionTemplateAction = (config: Config) => {
  validateConfig(config);

  return createTemplateAction<{
    parameters: {
      department: 'hc' | 'ph';
      environment: 'x' | 't' | 'p';
      vanityName: string;
    };
    costCentre: string;
    section32ManagerEmail: string;
    justification: string;
    serviceOwners?: string;
    totalBudget: number;
    notifyList?: string;
  }>({
    id: 'data-science-portal:template:get-context',
    schema: {
      input: {
        required: [
          'parameters',
          'costCentre',
          'section32ManagerEmail',
          'justification',
        ],
        type: 'object',
        properties: {
          parameters: {
            type: 'object',
            properties: {
              department: {
                title: 'Department',
                description: 'The department ID',
                enum: ['hc', 'ph'],
              },
              environment: {
                title: 'Environment',
                description: 'The environment ID. Use "x" for Experimentation, "t" for "Noble-Experimentation, and "p" for production.',
                enum: ['x', 't', 'p'],
              },
              vanityName: {
                title: 'Vanity Name',
                description: 'The resource display name. The name must less than 27 characters. The name will be used to create a GCP Folder named `<department>-<vanity-name>` and Project named `<department><environment>-<vanity-name>` in [HC-DMIA > DMIA-PHAC > SciencePlatform](https://console.cloud.google.com/cloud-resource-manager?folder=108494461414)',
                type: 'string',
                minLength: 1,
                maxLength: 27,
              },
            },
          },
          costCentre: {
            type: 'string',
            title: 'costCentre',
            description: 'Cost Centre associated with the resource',
          },
          section32ManagerEmail: {
            type: 'string',
            title: 'section32ManagerEmail',
            description: 'Section 32 Manager Email Address',
          },
          justification: {
            type: 'string',
            title: 'justification',
            description: 'Request justification note',
          },
          serviceOwners: {
            type: 'string',
            title: 'serviceOwners',
          },
          totalBudget: {
            type: 'number',
            title: 'totalBudget',
          },
          notifyList: {
            type: 'string',
            title: 'notifyList',
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
      ctx.output('projectName', projectName);

      // Render the Pull Request description template
      nunjucks.configure(templateDir);
      const context = {
        templateName: ctx.templateInfo.entity.metadata.title,
        requestId,
        rootFolderId,
        folderName,
        projectName,
        costCentre: ctx.input.costCentre,
        justification: ctx.input.justification,
        section32ManagerEmail: ctx.input.section32ManagerEmail,
        serviceOwners: ctx.input.serviceOwners,
      };
      ctx.output(
        'pr_description',
        nunjucks.render(path.join(template, 'description.md.njk'), context),
      );

      // Populate the template values for the Pull Request changes
      if (ctx.input.notifyList) {
        const notifyListArray = ctx.input.notifyList
          .trim()
          .split(/,\s*/)
          .filter(str => str.length);

        ctx.output('notify_list', notifyListArray);
      }
      if (ctx.input.serviceOwners) {
        const serviceOwnersArray = ctx.input.serviceOwners
          .trim()
          .split(/,\s*/)
          .filter(str => str.length);

        ctx.output('service_owners', serviceOwnersArray);
      }
      ctx.output('template_values', {
        requestId,
        rootFolderId,
        folderName,
        projectName,
      });
    },
  });
};
