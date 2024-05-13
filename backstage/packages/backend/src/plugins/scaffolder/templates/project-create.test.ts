import { UrlReader } from '@backstage/backend-common';
import { createMockDirectory } from '@backstage/backend-test-utils';
import { ScmIntegrations } from '@backstage/integration';
import { createFetchTemplateAction } from '@backstage/plugin-scaffolder-backend';
import { createMockActionContext } from './__testUtils__/createMockActionContext';

describe('project-create: fetch:template', () => {
  const mockDir = createMockDirectory();

  afterEach(() => {
    mockDir.remove();
  });

  it('should render the expected changes for the Pull Request', async () => {
    const action = createFetchTemplateAction({
      reader: Symbol('UrlReader') as unknown as UrlReader,
      integrations: Symbol('Integrations') as unknown as ScmIntegrations,
    });

    await action.handler({
      ...createMockActionContext({ mockDir }),
      input: {
        url: './project-create/changes',
        values: {
          requestId: '<uuid>',
          rootFolderId: '<root-folder-id>',
          projectName: '<project-name>',
          projectId: '<project-id>',
        },
      },
    });

    expect(mockDir.content({ path: 'workspace' })).toMatchInlineSnapshot(`
      {
        "project.yaml": "---
      apiVersion: data-science-portal.phac-aspc.gc.ca/v1alpha1
      kind: ProjectClaim
      metadata:
        name: <project-name>-<uuid>
      spec:
        rootFolderId: '<root-folder-id>'
        projectName: <project-name>
        projectId: <project-id>
      ",
      }
    `);
  });
});
