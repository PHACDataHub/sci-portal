export interface WorkspaceSpec {
  forProvider: {
    source: string;
    module: string;
  };
  writeConnectionSecretToRef: {
    namespace: string;
    name: string;
  };
}

export interface Workspace {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    annotations: {
      [key: string]: string;
    };
  };
  spec: WorkspaceSpec;
}

export class WorkspaceBuilder {
  private workspace: Workspace;

  constructor(name: string) {
    this.workspace = {
      apiVersion: 'tf.upbound.io/v1beta1',
      kind: 'Workspace',
      metadata: {
        name: name,
        annotations: {},
      },
      spec: {
        forProvider: {
          source: '',
          module: '',
        },
        writeConnectionSecretToRef: {
          namespace: '',
          name: '',
        },
      },
    };
  }

  setSourceAndModule(source: string, module: string): WorkspaceBuilder {
    this.workspace.spec.forProvider.source = source;
    this.workspace.spec.forProvider.module = module;
    return this;
  }

  setConnectionSecretNamespaceAndName(
    namespace: string,
    name: string,
  ): WorkspaceBuilder {
    this.workspace.spec.writeConnectionSecretToRef.namespace = namespace;
    this.workspace.spec.writeConnectionSecretToRef.name = name;
    return this;
  }

  setMetadataAnnotation(key: string, value: string): WorkspaceBuilder {
    this.workspace.metadata.annotations[key] = value;
    return this;
  }

  build(): Workspace {
    return this.workspace;
  }
}
