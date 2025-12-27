import { createTamagui, createTokens } from '@tamagui/core';
import { config } from '@tamagui/config/v3';
import { createAnimations } from '@tamagui/animations-moti';

const tokens = createTokens({
  ...config.tokens,
  color: {
    ...config.tokens.color,
    // Microsoft-inspired brand colors
    primary: '#0F6CBD',
    primaryLight: '#4BA0E8',
    primaryDark: '#0A4C8C',
    accent: '#107C10',
    accentLight: '#4CAF50',
    // Status colors
    success: '#107C10',
    warning: '#C19C00',
    error: '#C42B1C',
    info: '#0F6CBD',
    // Neutrals
    background: '#FFFFFF',
    backgroundDark: '#141414',
    surface: '#FAFAFA',
    surfaceDark: '#1A1A1A',
    text: '#1A1A1A',
    textDark: '#FFFFFF',
    textMuted: '#6B6B6B',
    textMutedDark: '#9E9E9E',
    border: '#E0E0E0',
    borderDark: '#3D3D3D',
  },
});

// Animation configurations
const animations = createAnimations({
  fast: {
    type: 'spring',
    damping: 20,
    mass: 1,
    stiffness: 250,
  },
  medium: {
    type: 'spring',
    damping: 15,
    mass: 1,
    stiffness: 150,
  },
  slow: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 100,
  },
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.8,
    stiffness: 180,
  },
  lazy: {
    type: 'spring',
    damping: 25,
    mass: 1.5,
    stiffness: 80,
  },
  quick: {
    type: 'spring',
    damping: 20,
    mass: 0.7,
    stiffness: 300,
  },
});

const tamaguiConfig = createTamagui({
  ...config,
  tokens,
  animations,
  themes: {
    light: {
      background: '#FFFFFF',
      backgroundHover: '#FAFAFA',
      backgroundPress: '#F5F5F5',
      color: '#1A1A1A',
      colorHover: '#1A1A1A',
      colorPress: '#424242',
      borderColor: '#E0E0E0',
      outlineColor: '#0F6CBD',
      primary: '#0F6CBD',
      secondary: '#424242',
      accent: '#107C10',
      success: '#107C10',
      warning: '#C19C00',
      error: '#C42B1C',
      info: '#0F6CBD',
      card: '#FFFFFF',
      cardHover: '#FAFAFA',
      cardFilled: '#F8FAFC',
      textSecondary: '#424242',
      textMuted: '#6B6B6B',
      shadowColor: '#000000',
    },
    dark: {
      background: '#141414',
      backgroundHover: '#1A1A1A',
      backgroundPress: '#202020',
      color: '#FFFFFF',
      colorHover: '#FFFFFF',
      colorPress: '#C7C7C7',
      borderColor: '#3D3D3D',
      outlineColor: '#4BA0E8',
      primary: '#4BA0E8',
      secondary: '#C7C7C7',
      accent: '#4CAF50',
      success: '#4CAF50',
      warning: '#FFCA28',
      error: '#EF5350',
      info: '#4BA0E8',
      card: '#1F1F1F',
      cardHover: '#252525',
      cardFilled: '#252525',
      textSecondary: '#C7C7C7',
      textMuted: '#9E9E9E',
      shadowColor: '#000000',
    },
  },
});

export type AppConfig = typeof tamaguiConfig;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
