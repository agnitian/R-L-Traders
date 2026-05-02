import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#e11d48',     // rose-600
      light: '#fb7185',    // rose-400
      dark: '#9f1239',     // rose-800
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#a855f7',     // purple-500
      light: '#c084fc',
      dark: '#7e22ce',
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2937',  // gray-800
      secondary: '#6b7280',// gray-500
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h3: { fontWeight: 800 },
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingTop: 10,
          paddingBottom: 10,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 18,
        },
      },
    },
  },
});

export const GRADIENTS = {
  primary: 'linear-gradient(135deg, #a855f7 0%, #e11d48 100%)',   // purple → red
  primarySoft: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)', // rose → pink
  rolePill: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
  splash: 'linear-gradient(160deg, #ffffff 0%, #fff1f2 60%, #ffe4e6 100%)',
};

export default theme;
