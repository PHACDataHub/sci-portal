import React from 'react';
import { Grid } from '@material-ui/core';
import { Page, Content, Header } from '@backstage/core-components';
// eslint-disable-next-line import/no-named-as-default
import { ResourcesComponent } from '@internal/backstage-plugin-resources';

export const ResourcesPage = () => {
  return (
    <Page themeId="resources">
      <Header title="Resources" />

      <Content>
        <Grid item xs={12} md={12}>
          <ResourcesComponent />
        </Grid>
      </Content>
    </Page>
  );
};
