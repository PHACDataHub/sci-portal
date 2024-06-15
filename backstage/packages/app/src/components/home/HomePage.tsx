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
  Header,
  InfoCard,
} from '@backstage/core-components';
import { SearchContextProvider } from '@backstage/plugin-search-react';
import Typography from '@material-ui/core/Typography';
import { shapes } from '@backstage/theme';
import { HomePageStarredEntities, HomePageToolkit } from '@backstage/plugin-home';

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
  const headerProps = {
    title: 'Data Science Portal',
  };

  return (
    <SearchContextProvider>
      <Page themeId="home">
        <Header {...headerProps}></Header>
        <Content>
          <Grid container justifyContent="center" spacing={6}>
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
              <Grid item xs={12} md={6}>
                <InfoCard title="What is the Data Science Portal?">
                  <div style={{ height: 170 }}>Lorem ipsum ...</div>
                </InfoCard>
              </Grid>
            </Grid>
          </Grid>
        </Content>
      </Page>
    </SearchContextProvider>
  );
};
