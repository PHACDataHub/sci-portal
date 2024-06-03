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
          src="https://lookerstudio.google.com/embed/reporting/80ca1952-ecbf-4823-a470-cd1768b4c667/page/p_l3qef1s8rc"
          allowFullScreen
          sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          ></iframe>
      </Grid>
    </Page>
  );
};
