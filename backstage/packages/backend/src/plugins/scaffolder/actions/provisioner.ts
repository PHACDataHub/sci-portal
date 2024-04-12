import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { writeFileSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { dump } from 'js-yaml';
import { Workspace, WorkspaceBuilder } from './workspaceBuilder';

interface Resource {
  resourceType: string;
  resourceName: string;
  billingCode: string;
  justificationNote: string;
}

interface BucketResource extends Resource {
  retentionPeriod: string;
  customRetentionPeriod?: number;
}

interface WorkstationResource extends Resource {
  machineType: string;
}

export const provisionNewResourceAction = () => {
  return createTemplateAction<{
    resourceType: string;
    resourceName: string;
    billingCode: string;
    justificationNote: string;
    retentionPeriod?: string;
    customRetentionPeriod?: number;
    machineType?: string;
  }>({
    id: 'phac:provisioner:create',
    schema: {
      input: {
        required: [
          'resourceType',
          'resourceName',
          'billingCode',
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
          billingCode: {
            type: 'string',
            title: 'billingCode',
            description: 'Billing code associated with the resource',
          },
          justificationNote: {
            type: 'string',
            title: 'justificationNote',
            description: 'Request justification note',
          },
          retentionPeriod: {
            type: 'string',
            title: 'retentionPeriod',
            description: 'Retention Period for the storage bucket',
          },
          customRetentionPeriod: {
            type: 'number',
            title: 'customRetentionPeriod',
            description: 'Custom Retention Period for the storage bucket',
          },
          machineType: {
            type: 'string',
            title: 'machineType',
            description:
              'The Machine Type for the Epidemiologist R Analytics Environment',
          },
        },
      },
    },

    async handler(ctx) {
      const requestId = generateRequestId();
      ctx.output('request_id', requestId);

      let resourceConfig;

      switch (ctx.input.resourceType) {
        case 'Storage Bucket': {
          const bucket = ctx.input as BucketResource;
          resourceConfig = createStorageConfig(bucket, requestId);
          break;
        }
        case 'Epidemiologist R Analytics Environment': {
          const workstation = ctx.input as WorkstationResource;
          resourceConfig = createWorkspaceConfig(workstation);
          break;
        }
        default: {
          throw new Error('Unsupported resource type.');
        }
      }

      const yamlString = dump(resourceConfig);
      writeFileSync(`${ctx.workspacePath}/${requestId}.yaml`, yamlString);
    },
  });
};

/**
 * Creates storage configuration for a storage bucket resource.
 * @param {BucketResource} bucket - The bucket resource.
 * @param {string} requestId - The request ID.
 * @returns {Object} The storage configuration.
 */
export function createStorageConfig(bucket: BucketResource, requestId: string) {
  const retentionPeriodsInSeconds: { [key: string]: number } = {
    'Custom (Specify Below)': bucket.customRetentionPeriod! * 86400,
    '1 Month': 2592000,
    '3 Months': 5184000,
    '6 Months': 15552000,
    '1 Year': 31536000,
    Default: 86400,
  };

  const retentionPolicyInSeconds =
    retentionPeriodsInSeconds[bucket.retentionPeriod] ||
    retentionPeriodsInSeconds.Default;

  return {
    apiVersion: 'storage.cnrm.cloud.google.com/v1beta1',
    kind: 'StorageBucket',
    metadata: {
      annotations: {
        'cnrm.cloud.google.com/project-id': 'river-sonar-415120',
      },
      name: `${bucket.resourceName}-${requestId}`,
    },
    spec: {
      retentionPolicy: {
        isLocked: false,
        retentionPeriod: retentionPolicyInSeconds,
      },
      uniformBucketLevelAccess: true,
    },
  };
}

/**
 * Creates workspace configuration for an Epidemiologist R Analytics Environment resource.
 * @param {WorkstationResource} workstation - The workstation resource.
 * @param {string} requestId - The request ID.
 * @returns {Workspace} The workspace configuration.
 */
export function createWorkspaceConfig(
  workstation: WorkstationResource,
): Workspace {
  return new WorkspaceBuilder(workstation.resourceName)
    .setSourceAndModule(
      'Inline',
      `# workstation\nresource "google_workstations_workstation" "default" {
  provider               = google-beta
  workstation_id         = "${workstation.resourceName}-workstation"
  workstation_config_id  = "workstation-config"
  workstation_cluster_id = "phac-workstation-cluster"
  location               = "us-central1"
  labels = {
    "label" = "key"
  }
  env = {
    name = "foo"
  }
  annotations = {
    label-one = "value-one"
  }
}`,
    )
    .setConnectionSecretNamespaceAndName(
      'default',
      `terraform-workspace-${workstation.resourceName}`,
    )
    .setMetadataAnnotation(
      'crossplane.io/external-name',
      workstation.resourceName,
    )
    .build();
}

/**
 * Generates a request ID using UUID.
 * @returns {string} The generated request ID.
 */
export function generateRequestId(): string {
  return uuidv4();
}
