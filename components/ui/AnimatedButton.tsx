import React, { useCallback, useMemo } from 'react';
import { Pressable, Platform } from 'react-native';
import { MotiView } from 'moti';
import { Text, XStack, Spinner, useTheme } from 'tamagui';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { shadows, borderRadius, timing } from '../../lib/design-tokens';

export interface AnimatedButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  haptic?: boolean;
}

const sizeStyles = {
  sm: { paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
  md: { paddingHorizontal: 20, paddingVertical: 12, fontSize: 15 },
  lg: { paddingHorizontal: 28, paddingVertical: 16, fontSize: 17 },
};

// Helper function to adjust color brightness for gradient generation
function adjustColorBrightness(hex: string, percent: number): string {
  // Remove # if present
  const color = hex.replace('#', '');

  // Parse hex to RGB
  const num = parseInt(color, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + Math.round(255 * percent / 100)));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + Math.round(255 * percent / 100)));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + Math.round(255 * percent / 100)));

  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function AnimatedButton({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  haptic = true,
}: AnimatedButtonProps) {
  const [pressed, setPressed] = React.useState(false);
  const theme = useTheme();

  // Determine if dark mode based on background color
  const isDarkMode = useMemo(() => {
    const bg = theme.background?.val || '#FFFFFF';
    // Simple heuristic: if background is dark (low brightness), it's dark mode
    const hex = bg.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  }, [theme.background?.val]);

  // Get theme-aware colors
  const themeColors = useMemo(() => ({
    primary: theme.primary?.val || '#0F6CBD',
    background: theme.background?.val || '#FFFFFF',
    color: theme.color?.val || '#1A1A1A',
    secondary: theme.secondary?.val || '#424242',
    backgroundHover: theme.backgroundHover?.val || '#FAFAFA',
    borderColor: theme.borderColor?.val || '#E0E0E0',
  }), [theme]);

  // Get the appropriate shadow set based on theme
  const themeShadows = isDarkMode ? shadows.dark : shadows.light;

  // Create variant styles using theme colors
  const variantStyles = useMemo(() => ({
    primary: {
      backgroundColor: themeColors.primary,
      textColor: themeColors.background,
      borderColor: 'transparent',
    },
    secondary: {
      backgroundColor: themeColors.backgroundHover,
      textColor: themeColors.color,
      borderColor: 'transparent',
    },
    outline: {
      backgroundColor: 'transparent',
      textColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      textColor: themeColors.primary,
      borderColor: 'transparent',
    },
    gradient: {
      backgroundColor: 'transparent',
      textColor: themeColors.background,
      borderColor: 'transparent',
    },
  }), [themeColors]);

  // Create gradient colors based on theme primary color
  const gradientColors = useMemo(() => {
    const primaryColor = themeColors.primary;
    // Generate gradient shades based on the primary color
    return [primaryColor, adjustColorBrightness(primaryColor, -15), adjustColorBrightness(primaryColor, -30)] as [string, string, string];
  }, [themeColors.primary]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    if (haptic && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress?.();
  }, [disabled, loading, haptic, onPress]);

  const handlePressIn = useCallback(() => {
    setPressed(true);
    if (haptic && Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, [haptic]);

  const handlePressOut = useCallback(() => {
    setPressed(false);
  }, []);

  const styles = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const content = (
    <XStack
      alignItems="center"
      justifyContent="center"
      gap="$2"
      paddingHorizontal={sizeStyle.paddingHorizontal}
      paddingVertical={sizeStyle.paddingVertical}
    >
      {loading ? (
        <Spinner size="small" color={styles.textColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            color={styles.textColor}
            fontSize={sizeStyle.fontSize}
            fontWeight="600"
          >
            {children}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </XStack>
  );

  const buttonContent = variant === 'gradient' ? (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: borderRadius.lg }}
    >
      {content}
    </LinearGradient>
  ) : (
    content
  );

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={fullWidth ? { width: '100%' } : undefined}
    >
      <MotiView
        animate={{
          scale: pressed ? 0.98 : 1,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        }}
        transition={{
          type: 'timing',
          duration: 100,
        }}
        style={[
          {
            backgroundColor: variant !== 'gradient' ? styles.backgroundColor : 'transparent',
            borderRadius: borderRadius.lg,
            borderWidth: variant === 'outline' ? 2 : 0,
            borderColor: styles.borderColor,
            overflow: 'hidden',
          },
          variant === 'primary' && !disabled && themeShadows.md,
        ]}
      >
        {buttonContent}
      </MotiView>
    </Pressable>
  );
}
