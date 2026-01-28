// frontend/src/styles/theme.ts
import { createTheme } from '@mui/material/styles';
import '@mui/x-data-grid/themeAugmentation';

// -----------------------------------------------------------------------------
// Typography — local, direct, no cross-file references
// -----------------------------------------------------------------------------
const numericSettings = {
  fontFeatureSettings: '"tnum"',
  fontVariantNumeric: 'tabular-nums lining-nums',
} as const;

const normalText = {
  lineHeight: 1.5,
  ...numericSettings,
} as const;

// -----------------------------------------------------------------------------
// Color tokens — local, direct, no cross-file references
// Color palette is fixed and must be used directly inline (e.g. do not reference 'primary.main' when applying color '#1f3a5f')
// -----------------------------------------------------------------------------
const COLORS = {
  primary: {
    main: '#1f3a5f',
    light: '#4c6d8c',
    dark: '#0e2238',
  },

  text: {
    primary: '#111111',
    secondary: '#6b7280',
    disabled: '#9ca3af',
    contrast: '#f5f1e8',

    income: '#059669',
    expense: '#dc2626',

    amber: '#92400e',
    steel: '#1f3a5f',
  },

  semantic: {
    success: '#198754',
    warning: '#f2c94c',
    error: '#dc2626',
    neutral: '#e6edf5',
    info: '#1f3a5f',
  },

  background: {
    default: '#ffffff',
    disabled: '#e5e7eb'
  },

  border: {
    light: '#e2e8f0',
    main: '#64748b',
    dark: '#0f172a',
  },

  button: {
    action: '#1f3a5f',
    warning: '#ef4444',
    disabled: '#e5e7eb',
  },

  chip: {
    amber: '#fef3c7',
    steel: '#c4e2ff',
    ocean: '#e4effd',
    brick: '#fee9e9',
  },

  charts: {
    categorical: [
      '#960533',
      '#059669',
      '#f59e0b',
      '#8b5cf6',
      '#3b82f6',
    ],
  },
} as const;

// -----------------------------------------------------------------------------
// Theme
// -----------------------------------------------------------------------------
export const theme = createTheme({
  palette: {
    mode: 'light',

    primary: {
      main: COLORS.primary.main,
    },

    success: { main: COLORS.semantic.success },
    error: { main: COLORS.semantic.error },
    warning: { main: COLORS.semantic.warning },
    info: { main: COLORS.semantic.info },

    background: {
      default: COLORS.background.default,
      paper: COLORS.background.default,
    },

    text: {
      primary: COLORS.text.primary,
      secondary: COLORS.text.secondary,
      disabled: COLORS.text.disabled,
    },

    divider: COLORS.border.light,
  },

  // -----------------------------
  // Typography — fully inlined
  // -----------------------------
  typography: {
    fontFamily:
      'Inter, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',

    h1: {
      fontSize: '1.75rem',
      fontWeight: 700,
      lineHeight: 1.2,
      ...numericSettings,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
      ...numericSettings,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      ...numericSettings,
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 600,
      ...normalText,
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
      ...normalText,
    },
    h6: {
      fontSize: '0.9rem',
      fontWeight: 600,
      ...normalText,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      ...normalText,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      ...normalText,
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      ...normalText,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      ...normalText,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    },
  },
});