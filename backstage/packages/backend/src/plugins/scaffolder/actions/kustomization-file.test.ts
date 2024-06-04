import { createMockDirectory } from '@backstage/backend-test-utils';
import { insertResource } from './kustomization-file';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';

describe('addResource', () => {
  const mockDir = createMockDirectory();

  afterEach(() => {
    mockDir.remove();
  });

  it('should create the Kustomization file if the file does not exist', async () => {
    // DMIA-PHAC/kustomization.yaml does not exist.
    mockDir.setContent({});

    const ctx = createMockActionContext({
      input: {
        path: 'DMIA-PHAC/kustomization.yaml',
        resource: 'SciencePlatform/phx-measles-surveillance',
      },
      workspacePath: mockDir.resolve(),
    });
    await insertResource(ctx);

    expect(mockDir.content()).toMatchInlineSnapshot(`
      {
        "DMIA-PHAC": {
          "kustomization.yaml": "---
      apiVersion: kustomize.config.k8s.io/v1beta1
      kind: Kustomization
      resources:
        - SciencePlatform/phx-measles-surveillance
      ",
        },
      }
    `);
  });

  it('should throw if the "resources" are an unexpected type', async () => {
    mockDir.setContent({
      'DMIA-PHAC': {
        'kustomization.yaml': `---
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources: 42
`,
      },
    });

    const ctx = createMockActionContext({
      input: {
        path: 'DMIA-PHAC/kustomization.yaml',
        resource: 'SciencePlatform/phx-measles-surveillance',
      },
      workspacePath: mockDir.resolve(),
    });

    await expect(() => insertResource(ctx)).rejects.toThrow(
      /The "resources" key is not a Sequence in ".*\/DMIA-PHAC\/kustomization.yaml"/,
    );
  });

  it('should add the resources key if it does not exist', async () => {
    mockDir.setContent({
      'DMIA-PHAC': {
        'kustomization.yaml': `---
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
`,
      },
    });

    const ctx = createMockActionContext({
      input: {
        path: 'DMIA-PHAC/kustomization.yaml',
        resource: 'SciencePlatform/phx-measles-surveillance',
      },
      workspacePath: mockDir.resolve(),
    });
    await insertResource(ctx);

    expect(mockDir.content()).toMatchInlineSnapshot(`
      {
        "DMIA-PHAC": {
          "kustomization.yaml": "---
      apiVersion: kustomize.config.k8s.io/v1beta1
      kind: Kustomization
      resources:
        - SciencePlatform/phx-measles-surveillance
      ",
        },
      }
    `);
  });

  it('should sort the resources alphabetically and preserve comments', async () => {
    mockDir.setContent({
      'DMIA-PHAC': {
        'kustomization.yaml': `---
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

# Template Instances
resources:
  - SciencePlatform/phx-tb-surveillance
  - SciencePlatform/phx-covid-surveillance
`,
      },
    });
    const ctx = createMockActionContext({
      input: {
        path: 'DMIA-PHAC/kustomization.yaml',
        resource: 'SciencePlatform/phx-measles-surveillance',
      },
      workspacePath: mockDir.resolve(),
    });

    await insertResource(ctx);

    expect(mockDir.content()).toMatchInlineSnapshot(`
      {
        "DMIA-PHAC": {
          "kustomization.yaml": "---
      apiVersion: kustomize.config.k8s.io/v1beta1
      kind: Kustomization

      # Template Instances
      resources:
        - SciencePlatform/phx-covid-surveillance
        - SciencePlatform/phx-measles-surveillance
        - SciencePlatform/phx-tb-surveillance
      ",
        },
      }
    `);
  });

  it('should not add a duplicate entry to support modifying existing projects', async () => {
    mockDir.setContent({
      'DMIA-PHAC': {
        'kustomization.yaml': `---
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- SciencePlatform/phx-covid-surveillance
- SciencePlatform/phx-measles-surveillance
- SciencePlatform/phx-tb-surveillance
`,
      },
    });
    const ctx = createMockActionContext({
      input: {
        path: 'DMIA-PHAC/kustomization.yaml',
        resource: 'SciencePlatform/phx-measles-surveillance',
      },
      workspacePath: mockDir.resolve(),
    });

    await insertResource(ctx);

    expect(mockDir.content()).toMatchInlineSnapshot(`
      {
        "DMIA-PHAC": {
          "kustomization.yaml": "---
      apiVersion: kustomize.config.k8s.io/v1beta1
      kind: Kustomization
      resources:
        - SciencePlatform/phx-covid-surveillance
        - SciencePlatform/phx-measles-surveillance
        - SciencePlatform/phx-tb-surveillance
      ",
        },
      }
    `);
  });
});
