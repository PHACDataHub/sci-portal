import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { resourcesPlugin, ResourcesPage } from '../src/plugin';

createDevApp()
  .registerPlugin(resourcesPlugin)
  .addPage({
    element: <ResourcesPage />,
    title: 'Resources Page',
    path: '/resources',
  })
  .render();
