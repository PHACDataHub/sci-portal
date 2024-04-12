import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';

export const resourcesPlugin = createPlugin({
  id: 'resources',
  routes: {
    root: rootRouteRef,
  },
});

export const ResourcesPage = resourcesPlugin.provide(
  createRoutableExtension({
    name: 'ResourcesPage',
    component: () =>
      import('./components/ResourcesComponent').then(m => m.ResourcesComponent),
    mountPoint: rootRouteRef,
  }),
);
