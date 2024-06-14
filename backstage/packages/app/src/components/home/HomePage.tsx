import React from 'react';
import {
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Grid,
  makeStyles,
} from '@material-ui/core';
import { HomePageSearchBar } from '@backstage/plugin-search';
import {
  Page,
  Content,
  ItemCardHeader,
  LinkButton,
  ItemCardGrid,
} from '@backstage/core-components';
import { SearchContextProvider } from '@backstage/plugin-search-react';
import Typography from '@material-ui/core/Typography';
import { shapes } from '@backstage/theme';

const useStyles = makeStyles(theme => ({
  searchBarInput: {
    maxWidth: '60vw',
    margin: 'auto',
    backgroundColor: theme.palette.background.paper,
    borderRadius: '50px',
    boxShadow: theme.shadows[1],
  },
  searchBarOutline: {
    borderStyle: 'none',
  },
  grid: {
    display: 'flex',
    width: '100%',
    padding: '8px',
  },
  card: {
    width: '25%',
  },
  header: {
    background: '#AF3C43',
    backgroundImage: shapes.wave,
  },
  pageTitle: {
    color: '#26374A',
    margin: theme.spacing(5, 0),
  },
  sectionHeading: {
    color: '#26374A',
    padding: '18px',
  },
}));

export const HomePage = () => {
  const classes = useStyles();

  return (
    <SearchContextProvider>
      <Page themeId="home">
        <Content>
          <Grid container justifyContent="center" spacing={6}>
            <Typography classes={{ root: classes.pageTitle }} variant="h2">
              Data Science Portal
            </Typography>
            <Grid container item xs={12} justifyContent="center">
              <HomePageSearchBar
                InputProps={{
                  classes: {
                    root: classes.searchBarInput,
                    notchedOutline: classes.searchBarOutline,
                  },
                }}
                placeholder="Search"
              />
            </Grid>
            <Grid container item xs={12}>
              <Typography
                classes={{ root: classes.sectionHeading }}
                variant="h5"
              >
                Recent Activity
              </Typography>
              <ItemCardGrid classes={{ root: classes.grid }}>
                <Card classes={{ root: classes.card }}>
                  <CardMedia>
                    <ItemCardHeader
                      title="Resource Provisioning"
                      classes={{ root: classes.header }}
                    />
                  </CardMedia>
                  <CardContent>
                    Request to provision any resource type you need. Once
                    requested, a Pull Request will be created for review.
                  </CardContent>
                  <CardActions>
                    <LinkButton
                      color="primary"
                      to="create/templates/default/resource-provisioner"
                    >
                      View
                    </LinkButton>
                  </CardActions>
                </Card>
                <Card classes={{ root: classes.card }}>
                  <CardMedia>
                    <ItemCardHeader
                      title="Cost Dashboard"
                      classes={{ root: classes.header }}
                    />
                  </CardMedia>
                  <CardContent>
                    Monitor costs and budgets by viewing your dashboard
                    overview.
                  </CardContent>
                  <CardActions>
                    <LinkButton color="primary" to="">
                      View
                    </LinkButton>
                  </CardActions>
                </Card>
              </ItemCardGrid>
            </Grid>
          </Grid>
        </Content>
      </Page>
    </SearchContextProvider>
  );
};
