import { MockDirectory, mockServices } from '@backstage/backend-test-utils';
import { createProvisionTemplateAction } from '../actions/provisioner';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';

export const getContextActionHandler = async ({
  template: { namespace = 'default', name, title },
  parameters,
  mockDir,
}: {
  template: { namespace?: string; name: string; title?: string };
  parameters: any;
  mockDir: MockDirectory;
}) => {
  const config = mockServices.rootConfig({
    data: {
      backend: {
        plugins: {
          provisioner: {
            repo: {
              owner: '<repo-owner>',
              name: '<repo-name>',
            },
            templateDir: './templates',
          },
        },
      },
    },
  });
  const action = createProvisionTemplateAction(config);

  const ctx = createMockActionContext({
    input: {
      parameters,
    },
    templateInfo: {
      entity: {
        metadata: {
          namespace,
          name,
          title,
        },
      },
      entityRef: `template:${namespace}/${name}`,
    },
    workspacePath: mockDir.resolve('workspace'),
  });
  await action.handler(ctx);

  return { ctx };
};
