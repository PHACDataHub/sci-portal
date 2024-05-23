import {
  PageWithHeader,
  Content,
  ContentHeader,
  SupportButton,
  OverflowTooltip,
} from '@backstage/core-components';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import {
  CatalogTable,
  CatalogTableColumnsFunc,
} from '@backstage/plugin-catalog';
import {
  EntityListProvider,
  CatalogFilterLayout,
  EntityKindPicker,
  EntityLifecyclePicker,
  EntityNamespacePicker,
  EntityOwnerPicker,
  EntityProcessingStatusPicker,
  EntityTagPicker,
  EntityTypePicker,
  UserListPicker,
} from '@backstage/plugin-catalog-react';
import React from 'react';

const customCatalogColumnsFunc: CatalogTableColumnsFunc = entityListContext => {
  return [
    ...CatalogTable.defaultColumnsFunc(entityListContext),
    {
      title: '% Budget',
      field: 'entity.metadata.budget',
      render: ({}) => (
        <OverflowTooltip text={'Test'} placement="bottom-start" />
      ),
    },
    {
      title: 'Cost',
      field: 'entity.metadata.cost',
      render: ({}) => (
        <OverflowTooltip text={'Test'} placement="bottom-start" />
      ),
    },
  ];
};

export const CustomCatalogPage = () => {
  const orgName =
    useApi(configApiRef).getOptionalString('organization.name') ?? 'Backstage';

  return (
    <PageWithHeader title={orgName} themeId="home">
      <Content>
        <ContentHeader title="">
          <SupportButton>All your software catalog entities</SupportButton>
        </ContentHeader>
        <EntityListProvider pagination>
          <CatalogFilterLayout>
            <CatalogFilterLayout.Filters>
              <EntityKindPicker />
              <EntityTypePicker />
              <UserListPicker />
              <EntityOwnerPicker />
              <EntityLifecyclePicker />
              <EntityTagPicker />
              <EntityProcessingStatusPicker />
              <EntityNamespacePicker />
            </CatalogFilterLayout.Filters>
            <CatalogFilterLayout.Content>
              <CatalogTable columns={customCatalogColumnsFunc} />
            </CatalogFilterLayout.Content>
          </CatalogFilterLayout>
        </EntityListProvider>
      </Content>
    </PageWithHeader>
  );
};
