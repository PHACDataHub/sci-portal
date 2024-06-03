import { RootConfigService } from '@backstage/backend-plugin-api';
import { MockDirectory, mockServices } from '@backstage/backend-test-utils';
import { CatalogApi } from '@backstage/catalog-client';
import { Entity } from '@backstage/catalog-model';
import { ActionContext } from '@backstage/plugin-scaffolder-node';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import { JsonObject } from '@backstage/types';
import { createUser } from './createUser';
import { createProvisionTemplateAction } from '../actions/provisioner';
import { projectParameters } from '../templates/project-create.test';

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

/**
 * Provide an implementation for catalogApi.getEntitiesByRefs that returns Users.
 */
const getEntitiesByRefs = ({ entityRefs }: { entityRefs: string[] }) => {
  const items: Partial<Entity>[] = [];
  for (const entityRef of entityRefs) {
    if (entityRef.startsWith('user:')) {
      const name = entityRef.replace(/^user:default[/]/, '');
      items.push({
        spec: {
          profile: {
            email: `${name}@gcp.hc-sc.gc.ca`,
            altEmail: `${name}@phac-aspc.gc.ca`,
          },
        },
      });
    }
  }
  return Promise.resolve({ items });
};

export const getContextActionHandler = async ({
  template: { namespace = 'default', name, title },
  config = rootConfig,
  parameters,
  user = createUser({ email: 'default.test-user@gcp.hc-sc.gc.ca' }),
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
  // The catalogApi is not available from the mockService. We'll hand-code it like the Backstage repo.
  const catalogApi = { getEntitiesByRefs } as unknown as CatalogApi;

  const action = createProvisionTemplateAction({
    auth: mockServices.auth({ pluginId: 'catalog' }),
    catalogApi,
    config,
  });

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
