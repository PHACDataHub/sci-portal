import * as path from 'node:path';
import * as url from 'node:url';
import { MockDirectory } from '@backstage/backend-test-utils';
import * as testUtils from '@backstage/plugin-scaffolder-node-test-utils';

export const createMockActionContext = ({
  mockDir,
}: {
  mockDir: MockDirectory;
}) => {
  const customActionFilePath = path.join(
    __dirname,
    '../../../../../../../templates/resource-provisioner.yaml',
  );
  const baseUrl = url.pathToFileURL(customActionFilePath).href;

  return {
    ...testUtils.createMockActionContext({
      // The only required value is baseUrl and the workspacePath.
      templateInfo: {
        entityRef: '',
        baseUrl,
        entity: {
          metadata: {
            namespace: '',
            name: '',
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
};
