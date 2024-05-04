import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { writeFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { dump } from 'js-yaml';
import { Config } from '@backstage/config';
import { validateConfig, getConfig } from '../config';

interface Resource {
  resourceType: string;
  resourceName: string;
  costCentre: string;
  section32ManagerEmail: string;
  justificationNote: string;
}

interface GCPProjectResource extends Resource {
  folderName: string;
  projectName: string;
  displayName: string;
}
export const provisionNewResourceAction = (config: Config) => {
  validateConfig(config);

  return createTemplateAction<{
    resourceType: string;
    resourceName: string;
    costCentre: string;
    section32ManagerEmail: string;
    justificationNote: string;
  }>({
    id: 'phac:provisioner:create',
    schema: {
      input: {
        required: [
          'resourceType',
          'resourceName',
          'costCentre',
          'section32ManagerEmail',
          'justificationNote',
        ],
        type: 'object',
        properties: {
          resourceType: {
            type: 'string',
            title: 'resourceType',
            description: 'The resourceType of the file',
          },
          resourceName: {
            type: 'string',
            title: 'resourceName',
            description: 'The resourceName of the file that will be created',
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
          folderName: {
            type: 'string',
            title: 'folderName',
            description: 'The name of the folder',
          },
          projectName: {
            type: 'string',
            title: 'projectName',
            description: 'The name of the project that will be created',
          },
          displayName: {
            type: 'string',
            title: 'displayName',
            description:
              'The human-readable display name of the project that will be created',
          },
        },
      },
    },

    async handler(ctx) {
      const requestId = generateRequestId();
      const provisionerConfig = getConfig(config);

      ctx.output('request_id', requestId);
      ctx.output('repo_owner', provisionerConfig.repo.owner);
      ctx.output('repo_name', provisionerConfig.repo.name);

      let resourceConfig;

      switch (ctx.input.resourceType) {
        case 'GCP Project': {
          const project = ctx.input as GCPProjectResource;
          resourceConfig = createProjectConfig(project, requestId);

          const yamlString = dump(resourceConfig);
          writeFileSync(`${ctx.workspacePath}/project.yaml`, yamlString);
          break;
        }
        default: {
          throw new Error('Unsupported resource type.');
        }
      }
    },
  });
};

/**
 * Creates a Project claim
 * @returns {Object}
 */
export function createProjectConfig(
  resource: GCPProjectResource,
  requestId: string,
) {
  return {
    apiVersion: 'data-science-portal.phac-aspc.gc.ca/v1alpha1',
    kind: 'Project',
    metadata: {
      name: `${resource.projectName}-${requestId}`,
    },
    spec: {
      // compositionSelector: {
      //   matchLabels: {
      //     provider: 'google',
      //   },
      // },
      folder: resource.folderName, // parentFolder
      name: resource.projectName,
    },
  };
}

/**
 * Generates a request ID using UUID.
 * @returns {string} The generated request ID.
 */
export function generateRequestId(): string {
  return uuidv4();
}
