import {
  createBaseThemeOptions,
  createUnifiedTheme,
  genPageTheme,
  palettes,
  shapes,
} from '@backstage/theme';

export const GovTheme = createUnifiedTheme({
  ...createBaseThemeOptions({
    palette: {
      ...palettes.light,
      primary: {
        main: '#555555',
      },
      secondary: {
        main: '#E0E0E0',
      },
      tertiary: {
        main: '#26374A',
      },
      accent: {
        main: '#AF3C43',
      },
      error: {
        main: '#AF3C43',
      },
      warning: {
        main: '#EF6C00',
      },
      success: {
        main: '#2E7D32',
      },
    },
  }),
  defaultPageTheme: 'home',
  fontFamily:
    '"Noto Sans", "Helvetica Neue", Helvetica, Roboto, Arial, sans-serif',
  /* below drives the header colors */
  pageTheme: {
    home: genPageTheme({
      colors: ['#26374A', '#26374A'],
      shape: shapes.wave,
    }),
  },
});
