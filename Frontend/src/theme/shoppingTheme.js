import { createTheme } from '@mui/material/styles';

const shoppingTheme = createTheme({
  palette: {
    primary: {
      main: '#e68c55', // Vibrant orange from the screenshot button
      contrastText: '#fff',
    },
    secondary: {
      main: '#aebdb5', // Sage green from the hero banner
      contrastText: '#333',
    },
    background: {
      default: '#f6f5ef', // off-white paper color
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '50px', // rounded buttons like "Shop Now"
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: `
        body {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E");
          background-repeat: repeat;
        }
      `,
    },
  },
});

export default shoppingTheme;
