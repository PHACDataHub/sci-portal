import React from 'react';
import { Page, Header } from '@backstage/core-components';
import { Grid, makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
  iFrame: {
    width: '85vw',
    height: '90vh',
  },
});

export const CostDashboardPage = () => {
  const classes = useStyles();

  return (
    <Page themeId="costDashboard">
      <Header title="Cost Dashboard" />

      <Grid classes={{ root: classes.iFrame }}>
        <iframe
          width="100%"
          height="100%"
          src="https://lookerstudio.google.com/embed/reporting/912a9bd1-7a2b-485a-a95f-6f88fb892d4a/page/p_jrb8c72wsc"
          allowFullScreen
          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        ></iframe>
      </Grid>
    </Page>
  );
};
