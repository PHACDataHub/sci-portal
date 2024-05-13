import * as path from 'node:path';
import * as url from 'node:url';
import { UrlReader } from '@backstage/backend-common';
import { MockDirectory } from '@backstage/backend-test-utils';
import { ScmIntegrations } from '@backstage/integration';
import { createFetchTemplateAction } from '@backstage/plugin-scaffolder-backend';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';

export const fetchTemplateActionHandler = ({
  namespace = 'default',
  name,
  values,
  mockDir,
}: {
  namespace?: string,
  name: string;
  values: any;
  mockDir: MockDirectory;
}) => {
  // Create the context
  const templateFilePath = path.join(
    __dirname,
    '../../../../../../../templates/', name, 'template.yaml',
  );
  const baseUrl = url.pathToFileURL(templateFilePath).href;
  const ctx = {
    ...createMockActionContext({
      // The only required value is baseUrl and the workspacePath.
      templateInfo: {
        entityRef: `template:${namespace}/${name}`,
        baseUrl,
        entity: {
          metadata: {
            namespace,
            name,
          },
        },
      },
      workspacePath: mockDir.resolve('workspace/'),
    }),

    // The templates are saved to a temporary directory created with createTemporaryDirectory().
    // The default implementation of createTemporaryDirectory() will return workspace/, which collides with the rendered template output.
    // See https://github.com/backstage/backstage/blob/v1.26.5/plugins/scaffolder-node-test-utils/src/actions/mockActionConext.ts#L67.
    createTemporaryDirectory: () => Promise.resolve(mockDir.path),
  };

  // Call the action
  const action = createFetchTemplateAction({
    reader: Symbol('UrlReader') as unknown as UrlReader,
    integrations: Symbol('Integrations') as unknown as ScmIntegrations,
  });
  return action.handler({
    ...ctx,
    input: {
      url: './pull-request-changes',
      values,
    },
  });
};
