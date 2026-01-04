import { createTamagui } from 'tamagui';
import { config } from '@tamagui/config/v3';

const tamaguiConfig = createTamagui({
  ...config,
  themes: {
    ...config.themes,
    light: {
      ...config.themes.light,
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
      background: '#FFFFFF',
      backgroundHover: '#F5F5F5',
      backgroundPress: '#EEEEEE',
      color: '#1A1A2E',
      colorHover: '#16213E',
      borderColor: '#E0E0E0',
    },
    dark: {
      ...config.themes.dark,
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
      background: '#1A1A2E',
      backgroundHover: '#16213E',
      backgroundPress: '#0F0F1A',
      color: '#FFFFFF',
      colorHover: '#F5F5F5',
      borderColor: '#2D2D44',
    },
  },
  tokens: {
    ...config.tokens,
    color: {
      ...config.tokens.color,
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
      traveler: '#4ECDC4',
      guide: '#FF6B6B',
    },
  },
});

export type AppConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
