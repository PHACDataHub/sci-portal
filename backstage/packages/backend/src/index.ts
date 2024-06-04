import { createBackend } from '@backstage/backend-defaults';
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import { policyExtensionPoint } from '@backstage/plugin-permission-node/alpha';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';

import { googleAuthWithCustomSignInResolver } from './plugins/auth/module';
import { CustomPermissionPolicy } from './plugins/permissions';
import { createProvisionTemplateAction } from './plugins/scaffolder/actions/provisioner';
import { createDebugWorkspaceAction } from './plugins/scaffolder/actions/debug-workspace';
import { createKustomizationAction } from './plugins/scaffolder/actions/kustomization-file';

const backend = createBackend();

backend.add(import('@backstage/plugin-app-backend/alpha'));
backend.add(import('@backstage/plugin-proxy-backend/alpha'));
backend.add(import('@backstage/plugin-techdocs-backend/alpha'));

// auth plugin
backend.add(import('@backstage/plugin-auth-backend'));
// See https://backstage.io/docs/backend-system/building-backends/migrating#the-auth-plugin
backend.add(googleAuthWithCustomSignInResolver);

// catalog plugin
backend.add(import('@backstage/plugin-catalog-backend/alpha'));
backend.add(import('@backstage/plugin-catalog-backend-module-github/alpha'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);

// permission plugin
backend.add(import('@backstage/plugin-permission-backend/alpha'));
backend.add(
  createBackendModule({
    pluginId: 'permission',
    moduleId: 'allow-all-policy',
    register(reg) {
      reg.registerInit({
        deps: { policy: policyExtensionPoint },
        async init({ policy }) {
          policy.setPolicy(new CustomPermissionPolicy());
        },
      });
    },
  }),
);

// search plugin
backend.add(import('@backstage/plugin-search-backend/alpha'));
backend.add(import('@backstage/plugin-search-backend-module-catalog/alpha'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs/alpha'));

// Add our custom Scaffolder action
backend.add(
  createBackendModule({
    pluginId: 'scaffolder',
    moduleId: 'data-science-portal',
    register(env) {
      env.registerInit({
        deps: {
          auth: coreServices.auth,
          catalogApi: catalogServiceRef,
          config: coreServices.rootConfig,
          scaffolder: scaffolderActionsExtensionPoint,
        },
        async init({ auth, catalogApi, config, scaffolder }) {
          scaffolder.addActions(
            createProvisionTemplateAction({ auth, config, catalogApi }),
          );
          scaffolder.addActions(createDebugWorkspaceAction());
          scaffolder.addActions(createKustomizationAction());
        },
      });
    },
  }),
);

backend.add(import('@backstage/plugin-scaffolder-backend/alpha'));
backend.add(import('@backstage/plugin-scaffolder-backend-module-github'));

backend.start();
