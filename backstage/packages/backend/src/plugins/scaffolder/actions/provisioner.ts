import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { writeFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { dump } from 'js-yaml';
import { Config } from '@backstage/config';
import { validateConfig, getConfig } from '../config';

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
    justificationNote: string;
    serviceOwners?: string;
    totalBudget: number;
    notifyList?: string;
  }>({
    id: 'phac:provisioner:create',
    schema: {
      input: {
        required: [
          'parameters',
          'costCentre',
          'section32ManagerEmail',
          'justificationNote',
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
          justificationNote: {
            type: 'string',
            title: 'justificationNote',
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
      const requestId = uuidv4();
      const provisionerConfig = getConfig(config);
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

      ctx.output('request_id', requestId);
      ctx.output('resource_type', 'GCP Project');

      ctx.output('repo_owner', provisionerConfig.repo.owner);
      ctx.output('repo_name', provisionerConfig.repo.name);

      const folderName = `${ctx.input.parameters.department}-${ctx.input.parameters.vanityName}`;
      ctx.output('folderName', folderName);

      const projectName = `${ctx.input.parameters.department}${ctx.input.parameters.environment}-${ctx.input.parameters.vanityName}`;
      ctx.output('projectName', projectName);

      const yamlString = dump(createProjectClaim(requestId, folderName, projectName));
      writeFileSync(`${ctx.workspacePath}/project.yaml`, yamlString);
    },
  });
};

export function createProjectClaim(
  requestId: string,
  folderName: string,
  projectName: string
) {
  return {
    apiVersion: 'data-science-portal.phac-aspc.gc.ca/v1alpha1',
    kind: 'Project',
    metadata: {
      name: `${projectName}-${requestId}`,
    },
    spec: {
      // compositionSelector: {
      //   matchLabels: {
      //     provider: 'google',
      //   },
      // },
      folder: folderName,
      name: projectName,
    },
  };
}
