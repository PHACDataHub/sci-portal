import { MockDirectory, mockServices } from '@backstage/backend-test-utils';
import { createProvisionTemplateAction } from '../actions/provisioner';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import { RootConfigService } from '@backstage/backend-plugin-api';
import { projectParameters } from '../templates/project-create.test';
import { ActionContext } from '@backstage/plugin-scaffolder-node';
import { JsonObject } from '@backstage/types';

const rootConfig = mockServices.rootConfig({
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

export const getContextActionHandler = async ({
  template: { namespace = 'default', name, title },
  config = rootConfig,
  parameters,
  user,
  mockDir,
}: {
  template: { namespace?: string; name: string; title?: string };
  parameters?: any;
  config?: RootConfigService;
  user?: ActionContext<JsonObject>['user'];
  mockDir: MockDirectory;
}): Promise<{
  ctx: ActionContext<JsonObject> & { getOutput: (name: string) => any };
}> => {
  const action = createProvisionTemplateAction(config);
  const ctx = {
    ...createMockActionContext({
      input: {
        parameters: {
          ...projectParameters,
          ...parameters,
        },
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
    }),

    // The user is not passed through as of v1.27.3 - https://github.com/backstage/backstage/blob/fe4b090b6f5c38b38fc282be3384efcce4423c7d/plugins/scaffolder-node-test-utils/src/actions/mockActionConext.ts#L32-L33.
    user,
  };

  await action.handler(ctx);

  return {
    ctx: {
      ...ctx,

      /**
       * Returns the value that ctx.output(name) was called with, or undefined.
       */
      getOutput(name) {
        const calls = (ctx.output as jest.Mock).mock.calls.filter(
          args => args[0] === name,
        );
        return calls[calls.length - 1]?.[1];
      },
    },
  };
};
