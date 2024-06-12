import React from 'react';
import { Page, Header } from '@backstage/core-components';
import { Grid, makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
  iFrame: {
    width: '90vw',
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
          title="FinOps Dashboard"
          width="100%"
          height="100%"
          src="https://lookerstudio.google.com/embed/reporting/d8371c60-4744-4eea-9c3a-894872ef9072/page/p_l3qef1s8rc"
          allowFullScreen
          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        />
      </Grid>
    </Page>
  );
};
