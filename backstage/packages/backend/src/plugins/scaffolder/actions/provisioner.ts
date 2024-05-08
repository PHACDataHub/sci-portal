import * as path from 'path';
import nunjucks from 'nunjucks';
import { v4 as uuidv4 } from 'uuid';
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { Config } from '@backstage/config';
import { validateConfig, getConfig } from '../config';
import { InputError } from '@backstage/errors';

export const provisionNewResourceAction = (config: Config) => {
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
              department: { enum: ['hc', 'ph'] },
              environment: { enum: ['x', 't', 'p'] },
              vanityName: {
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
      ctx.output('request_id', requestId);

      const provisionerConfig = getConfig(config);
      ctx.output('repo_owner', provisionerConfig.repo.owner);
      ctx.output('repo_name', provisionerConfig.repo.name);

      const template = ctx.templateInfo.entity.metadata.name;
      ctx.output('template', template);

      const folderName = `${ctx.input.parameters.department}-${ctx.input.parameters.vanityName}`;
      ctx.output('folderName', folderName);

      const projectName = `${ctx.input.parameters.department}${ctx.input.parameters.environment}-${ctx.input.parameters.vanityName}`;
      ctx.output('projectName', projectName);

      // Render the Pull Request description template
      nunjucks.configure(path.join(__dirname, '../../../../../../templates'));
      const rootFolderId = '108494461414';
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
      ctx.output(
        'template_values', {
          requestId,
          rootFolderId,
          folderName,
          projectName,
        }
      )
    },
  });
};
