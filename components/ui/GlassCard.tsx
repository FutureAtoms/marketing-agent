import React from 'react';
import { View, StyleSheet, Platform, Pressable, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { borderRadius } from '../../lib/design-tokens';
import { useUIStore } from '../../stores/uiStore';

// Microsoft-inspired primary colors
const PRIMARY_LIGHT = '#0F6CBD'; // Microsoft Blue (light mode)
const PRIMARY_LIGHT_400 = '#4BA0E8'; // Lighter variant
const PRIMARY_DARK = '#4BA0E8'; // Microsoft Blue (dark mode)
const PRIMARY_DARK_500 = '#0F6CBD'; // Darker variant

// Theme-aware glass effect colors
const glassColors = {
  light: {
    background: 'rgba(255, 255, 255, 0.85)',
    backgroundSubtle: 'rgba(255, 255, 255, 0.7)',
    border: 'rgba(255, 255, 255, 0.3)',
    borderSubtle: 'rgba(255, 255, 255, 0.2)',
    glowStart: `${PRIMARY_LIGHT}80`, // 50% opacity
    glowMiddle: `${PRIMARY_LIGHT_400}4D`, // 30% opacity
    glowEnd: `${PRIMARY_LIGHT}80`,
  },
  dark: {
    background: 'rgba(15, 23, 42, 0.85)', // gray.900 with transparency
    backgroundSubtle: 'rgba(30, 41, 59, 0.8)', // gray.800 with transparency
    border: 'rgba(71, 85, 105, 0.4)', // gray.600 with transparency
    borderSubtle: 'rgba(51, 65, 85, 0.3)', // gray.700 with transparency
    glowStart: `${PRIMARY_DARK}66`, // 40% opacity
    glowMiddle: `${PRIMARY_DARK_500}33`, // 20% opacity
    glowEnd: `${PRIMARY_DARK}66`,
  },
} as const;

export interface GlassCardProps {
  children: React.ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  onPress?: () => void;
  padding?: number;
  borderGlow?: boolean;
}

// Helper hook to get the effective theme (resolving 'system' to actual value)
function useEffectiveTheme(): 'light' | 'dark' {
  const systemColorScheme = useColorScheme();
  const { colorScheme } = useUIStore();

  if (colorScheme === 'system') {
    return systemColorScheme === 'dark' ? 'dark' : 'light';
  }
  return colorScheme;
}

export function GlassCard({
  children,
  intensity = 50,
  tint,
  onPress,
  padding = 20,
  borderGlow = false,
}: GlassCardProps) {
  const [pressed, setPressed] = React.useState(false);
  const effectiveTheme = useEffectiveTheme();

  // Auto-detect tint based on theme if not explicitly provided
  const resolvedTint = tint ?? (effectiveTheme === 'dark' ? 'dark' : 'light');
  const themeColors = glassColors[effectiveTheme];

  const handlePressIn = () => {
    if (!onPress) return;
    setPressed(true);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  };

  const handlePressOut = () => {
    setPressed(false);
  };

  const content = (
    <View
      style={[
        styles.container,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      {/* Border glow effect */}
      {borderGlow && (
        <LinearGradient
          colors={[
            themeColors.glowStart,
            themeColors.glowMiddle,
            themeColors.glowEnd,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glowBorder}
        />
      )}

      {/* Glass background */}
      {Platform.OS !== 'web' ? (
        <BlurView
          intensity={intensity}
          tint={resolvedTint}
          style={[
            styles.blur,
            {
              padding,
              borderColor: themeColors.borderSubtle,
            }
          ]}
        >
          <View style={styles.innerContent}>{children}</View>
        </BlurView>
      ) : (
        <View
          style={[
            styles.webGlass,
            {
              padding,
              backgroundColor: themeColors.background,
              borderColor: themeColors.border,
            },
          ]}
        >
          {children}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

// Premium glass header for important sections
export function GlassHeader({
  children,
  intensity = 80,
}: {
  children: React.ReactNode;
  intensity?: number;
}) {
  const effectiveTheme = useEffectiveTheme();
  const themeColors = glassColors[effectiveTheme];
  const resolvedTint = effectiveTheme === 'dark' ? 'dark' : 'light';

  return (
    <View style={styles.headerContainer}>
      {Platform.OS !== 'web' ? (
        <BlurView
          intensity={intensity}
          tint={resolvedTint}
          style={[
            styles.headerBlur,
            { borderBottomColor: themeColors.borderSubtle }
          ]}
        >
          {children}
        </BlurView>
      ) : (
        <View
          style={[
            styles.headerWeb,
            {
              backgroundColor: effectiveTheme === 'dark'
                ? 'rgba(15, 23, 42, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
              borderBottomColor: themeColors.borderSubtle,
            }
          ]}
        >
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  glowBorder: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: borderRadius.xl + 1,
    zIndex: -1,
  },
  blur: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    // borderColor is applied dynamically based on theme
  },
  innerContent: {
    zIndex: 1,
  },
  webGlass: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    // backgroundColor and borderColor are applied dynamically based on theme
  },
  headerContainer: {
    overflow: 'hidden',
  },
  headerBlur: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    // borderBottomColor is applied dynamically based on theme
  },
  headerWeb: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    // backgroundColor and borderBottomColor are applied dynamically based on theme
  },
});
