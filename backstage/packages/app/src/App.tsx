import React from 'react';
import { Route } from 'react-router-dom';
import { apiDocsPlugin, ApiExplorerPage } from '@backstage/plugin-api-docs';
import {
  CatalogEntityPage,
  CatalogIndexPage,
  catalogPlugin,
  CatalogTable,
  CatalogTableColumnsFunc,
  CatalogTableRow,
} from '@backstage/plugin-catalog';
import {
  CatalogImportPage,
  catalogImportPlugin,
} from '@backstage/plugin-catalog-import';
import { ScaffolderPage, scaffolderPlugin } from '@backstage/plugin-scaffolder';
import { orgPlugin } from '@backstage/plugin-org';
import { SearchPage } from '@backstage/plugin-search';
import {
  DefaultTechDocsHome,
  TechDocsIndexPage,
  techdocsPlugin,
  TechDocsReaderPage,
} from '@backstage/plugin-techdocs';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import { UserSettingsPage } from '@backstage/plugin-user-settings';
import {
  AlertDisplay,
  OAuthRequestDialog,
  SignInPage,
} from '@backstage/core-components';
import { createApp } from '@backstage/app-defaults';
import { AppRouter, FlatRoutes } from '@backstage/core-app-api';
import { CatalogGraphPage } from '@backstage/plugin-catalog-graph';
import { RequirePermission } from '@backstage/plugin-permission-react';
import { catalogEntityCreatePermission } from '@backstage/plugin-catalog-common/alpha';
import { UnifiedThemeProvider } from '@backstage/theme';
import { HomepageCompositionRoot } from '@backstage/plugin-home';
import { googleAuthApiRef } from '@backstage/core-plugin-api';
import { EntityListContextProps } from '@backstage/plugin-catalog-react';
import LightIcon from '@material-ui/icons/WbSunny';
import { apis } from './apis';
import { entityPage } from './components/catalog/EntityPage';
import { searchPage } from './components/search/SearchPage';
import { Root } from './components/Root';
import { HomePage } from './components/home/HomePage';
import { CostDashboardPage } from './components/costDashboard/CostDashboardPage';
import { GovTheme } from './theme/govTheme';
import { BudgetLimit, BudgetUsage } from './components/budget';
import { DataLoaderProvider } from './loaders/DataLoader';

/**
 * Returns true when the `Cost` and `% Budget` columns should be rendered.
 */
const entityKindHasBudget = (
  entityListContext: EntityListContextProps,
): boolean => {
  const kind = entityListContext.filters.kind?.value;
  return kind === 'component' || kind === 'resource';
};

const columnsFunc: CatalogTableColumnsFunc = entityListContext => {
  if (entityKindHasBudget(entityListContext)) {
    return [
      ...CatalogTable.defaultColumnsFunc(entityListContext),
      {
        title: '% Budget',
        field: 'entity.metadata.budget',
        tooltip:
          'The percentage of the budget that has been spent, updated once per day.',
        render: (data: CatalogTableRow) => {
          return <BudgetUsage projectId={data.entity.metadata.name} />;
        },
      },
      {
        title: 'Cost (CAD)',
        field: 'entity.metadata.cost',
        tooltip: 'The cost that has been spent, updated once per day.',
        render: (data: CatalogTableRow) => (
          <BudgetLimit projectId={data.entity.metadata.name} />
        ),
      },
    ];
  }

  return CatalogTable.defaultColumnsFunc(entityListContext);
};

const app = createApp({
  components: {
    SignInPage: props => (
      <SignInPage
        {...props}
        providers={[
          {
            id: 'google-auth-provider',
            title: 'Google',
            message: 'Sign in using Google',
            apiRef: googleAuthApiRef,
          },
        ]}
      />
    ),
  },
  themes: [
    {
      id: 'gov-theme',
      title: 'Government of Canada Theme',
      variant: 'light',
      icon: <LightIcon />,
      Provider: ({ children }) => (
        <UnifiedThemeProvider theme={GovTheme} children={children} />
      ),
    },
  ],
  apis,
  bindRoutes({ bind }) {
    bind(catalogPlugin.externalRoutes, {
      createComponent: scaffolderPlugin.routes.root,
      viewTechDoc: techdocsPlugin.routes.docRoot,
      createFromTemplate: scaffolderPlugin.routes.selectedTemplate,
    });
    bind(apiDocsPlugin.externalRoutes, {
      registerApi: catalogImportPlugin.routes.importPage,
    });
    bind(scaffolderPlugin.externalRoutes, {
      registerComponent: catalogImportPlugin.routes.importPage,
      viewTechDoc: techdocsPlugin.routes.docRoot,
    });
    bind(orgPlugin.externalRoutes, {
      catalogIndex: catalogPlugin.routes.catalogIndex,
    });
  },
});

const routes = (
  <FlatRoutes>
    <Route path="/" element={<HomepageCompositionRoot />}>
      <HomePage />
    </Route>
    <Route
      path="/catalog"
      element={
        <DataLoaderProvider>
          <CatalogIndexPage columns={columnsFunc} />
        </DataLoaderProvider>
      }
    />
    <Route
      path="/catalog/:namespace/:kind/:name"
      element={<CatalogEntityPage />}
    >
      {entityPage}
    </Route>
    <Route path="/docs" element={<TechDocsIndexPage />}>
      <DefaultTechDocsHome />
    </Route>

    <Route
      path="/docs/:namespace/:kind/:name/*"
      element={<TechDocsReaderPage />}
    >
      <TechDocsAddons>
        <ReportIssue />
      </TechDocsAddons>
    </Route>
    <Route
      path="/create"
      element={
        <ScaffolderPage
          groups={[
            {
              title: 'RAD Lab Modules',
              filter: entity =>
                entity?.metadata?.tags?.includes('rad-lab') ?? false,
            },
          ]}
        />
      }
    />
    <Route path="/api-docs" element={<ApiExplorerPage />} />
    <Route
      path="/catalog-import"
      element={
        <RequirePermission permission={catalogEntityCreatePermission}>
          <CatalogImportPage />
        </RequirePermission>
      }
    />
    <Route path="/search" element={<SearchPage />}>
      {searchPage}
    </Route>
    <Route path="/settings" element={<UserSettingsPage />} />
    <Route path="/catalog-graph" element={<CatalogGraphPage />} />
    <Route path="/cost-dashboard" element={<CostDashboardPage />} />
  </FlatRoutes>
);

export default app.createRoot(
  <>
    <AlertDisplay />
    <OAuthRequestDialog />
    <AppRouter>
      <Root>{routes}</Root>
    </AppRouter>
  </>,
);
