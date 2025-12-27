// Design Tokens - Microsoft-inspired matte color scheme for the marketing app
import { Platform } from 'react-native';

// Theme type for light/dark mode
export type ThemeMode = 'light' | 'dark';

// Microsoft-inspired matte colors
export const colors = {
  light: {
    primary: '#0F6CBD',      // Microsoft Blue
    accent: '#107C10',       // Microsoft Green
    background: '#FFFFFF',
    surface: '#FAFAFA',
    card: '#FFFFFF',
    text: {
      primary: '#1A1A1A',
      secondary: '#424242',
      muted: '#6B6B6B',
    },
    border: '#E0E0E0',
    success: '#107C10',
    warning: '#C19C00',
    error: '#C42B1C',
    info: '#0F6CBD',
  },
  dark: {
    primary: '#4BA0E8',      // Lighter blue for dark mode
    accent: '#4CAF50',       // Lighter green for dark mode
    background: '#141414',
    surface: '#1A1A1A',
    card: '#1F1F1F',
    text: {
      primary: '#FFFFFF',
      secondary: '#C7C7C7',
      muted: '#9E9E9E',
    },
    border: '#3D3D3D',
    success: '#4CAF50',
    warning: '#FFCA28',
    error: '#EF5350',
    info: '#4BA0E8',
  },
} as const;

// Color palette scales for both themes
export const colorScales = {
  light: {
    primary: {
      50: '#E8F4FC',
      100: '#C5E3F6',
      200: '#9FD0F0',
      300: '#78BDEA',
      400: '#4BA0E8',
      500: '#0F6CBD',
      600: '#0C5A9E',
      700: '#094880',
      800: '#063661',
      900: '#032443',
    },
    accent: {
      50: '#E8F5E9',
      100: '#C8E6C9',
      200: '#A5D6A7',
      300: '#81C784',
      400: '#66BB6A',
      500: '#107C10',
      600: '#0E6B0E',
      700: '#0B5A0B',
      800: '#084908',
      900: '#053805',
    },
    gray: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
  },
  dark: {
    primary: {
      50: '#1A2A3A',
      100: '#1F3448',
      200: '#254056',
      300: '#2B4C64',
      400: '#3A6A8A',
      500: '#4BA0E8',
      600: '#6DB3EC',
      700: '#8FC6F0',
      800: '#B1D9F4',
      900: '#D3ECF8',
    },
    accent: {
      50: '#1A2E1A',
      100: '#1F3A1F',
      200: '#254525',
      300: '#2B512B',
      400: '#3D7A3D',
      500: '#4CAF50',
      600: '#6FBF73',
      700: '#92CF95',
      800: '#B5DFB8',
      900: '#D8EFDA',
    },
    gray: {
      50: '#141414',
      100: '#1A1A1A',
      200: '#1F1F1F',
      300: '#2A2A2A',
      400: '#3D3D3D',
      500: '#5C5C5C',
      600: '#7A7A7A',
      700: '#9E9E9E',
      800: '#C7C7C7',
      900: '#FFFFFF',
    },
  },
} as const;

// Gradients for both themes
export const gradients = {
  light: {
    primary: ['#0F6CBD', '#0C5A9E', '#094880'],
    accent: ['#107C10', '#0E6B0E', '#0B5A0B'],
    warm: ['#C19C00', '#A38400', '#856C00'],
    surface: ['#FFFFFF', '#FAFAFA'],
    glass: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)'],
  },
  dark: {
    primary: ['#4BA0E8', '#3A6A8A', '#2B4C64'],
    accent: ['#4CAF50', '#3D7A3D', '#2B512B'],
    warm: ['#FFCA28', '#FFB300', '#FFA000'],
    surface: ['#1F1F1F', '#1A1A1A'],
    glass: ['rgba(31,31,31,0.9)', 'rgba(26,26,26,0.7)'],
  },
} as const;

// Web-compatible shadows using boxShadow for web, native shadow* for iOS/Android
const createShadow = (
  color: string,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number
) => {
  if (Platform.OS === 'web') {
    // Convert to CSS boxShadow for web
    const rgba = color.startsWith('#')
      ? `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${opacity})`
      : color;
    return {
      boxShadow: `0px ${offsetY}px ${radius}px ${rgba}`,
    };
  }
  // Native shadow props for iOS/Android
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
};

// Subtle matte shadows for both themes
export const shadows = {
  light: {
    sm: createShadow('#000', 1, 0.03, 2, 1),
    md: createShadow('#000', 2, 0.06, 4, 2),
    lg: createShadow('#000', 4, 0.08, 8, 4),
    xl: createShadow('#0F6CBD', 8, 0.12, 16, 6),
    glow: createShadow('#0F6CBD', 0, 0.15, 12, 4),
  },
  dark: {
    sm: createShadow('#000', 1, 0.2, 2, 1),
    md: createShadow('#000', 2, 0.25, 4, 2),
    lg: createShadow('#000', 4, 0.3, 8, 4),
    xl: createShadow('#4BA0E8', 8, 0.2, 16, 6),
    glow: createShadow('#4BA0E8', 0, 0.25, 12, 4),
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

export const typography = {
  heading: {
    h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
    h4: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  },
  body: {
    lg: { fontSize: 18, fontWeight: '400' as const, lineHeight: 28 },
    md: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    sm: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
    xs: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  },
  label: {
    lg: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
    md: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
    sm: { fontSize: 10, fontWeight: '500' as const, lineHeight: 14 },
  },
} as const;

// Animation timing - professional, subtle animations
export const timing = {
  fast: 120,
  normal: 200,
  slow: 350,
  spring: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },
  // Professional spring - smooth without bounce
  professional: {
    damping: 25,
    stiffness: 400,
    mass: 0.7,
  },
} as const;

// Theme-specific value getters
export const getThemeColors = (theme: ThemeMode) => colors[theme];

export const getThemeColorScales = (theme: ThemeMode) => colorScales[theme];

export const getThemeGradients = (theme: ThemeMode) => gradients[theme];

export const getThemeShadows = (theme: ThemeMode) => shadows[theme];

// Convenience function to get all theme values
export const getTheme = (theme: ThemeMode) => ({
  colors: colors[theme],
  colorScales: colorScales[theme],
  gradients: gradients[theme],
  shadows: shadows[theme],
  spacing,
  borderRadius,
  typography,
  timing,
});

// Default theme export for backwards compatibility
export const defaultTheme = getTheme('light');
