import React from 'react';
import { Pressable, Platform } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@tamagui/core';
import { borderRadius, timing } from '../../lib/design-tokens';

export interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: number;
  disabled?: boolean;
}

// Helper to create theme-aware shadows
const createThemedShadow = (
  shadowColor: string,
  offsetY: number,
  opacity: number,
  radius: number,
  elevation: number
) => {
  if (Platform.OS === 'web') {
    // Convert to CSS boxShadow for web
    const rgba = shadowColor.startsWith('#')
      ? `rgba(${parseInt(shadowColor.slice(1, 3), 16)}, ${parseInt(shadowColor.slice(3, 5), 16)}, ${parseInt(shadowColor.slice(5, 7), 16)}, ${opacity})`
      : shadowColor;
    return {
      boxShadow: `0px ${offsetY}px ${radius}px ${rgba}`,
    };
  }
  // Native shadow props for iOS/Android
  return {
    shadowColor,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
};

export function AnimatedCard({
  children,
  onPress,
  variant = 'elevated',
  padding = 16,
  disabled = false,
}: AnimatedCardProps) {
  const [pressed, setPressed] = React.useState(false);
  const theme = useTheme();

  const handlePressIn = () => {
    if (!onPress || disabled) return;
    setPressed(true);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  };

  const handlePressOut = () => {
    setPressed(false);
  };

  // Get theme-aware colors
  const cardBackground = theme.card?.val || '#FFFFFF';
  const cardFilledBackground = theme.cardFilled?.val || theme.backgroundHover?.val || '#F8FAFC';
  const borderColor = theme.borderColor?.val || '#E0E0E0';
  const shadowColor = theme.shadowColor?.val || '#000000';

  // Create theme-aware shadows
  const themedShadows = {
    sm: createThemedShadow(shadowColor, 1, 0.05, 2, 1),
    md: createThemedShadow(shadowColor, 4, 0.1, 6, 3),
    lg: createThemedShadow(shadowColor, 10, 0.15, 20, 5),
  };

  const variantStyles = {
    elevated: {
      backgroundColor: cardBackground,
      borderWidth: 0,
      borderColor: 'transparent',
      ...themedShadows.md,
    },
    outlined: {
      backgroundColor: cardBackground,
      borderWidth: 1,
      borderColor: borderColor,
    },
    filled: {
      backgroundColor: cardFilledBackground,
      borderWidth: 0,
      borderColor: 'transparent',
    },
  };

  const styles = variantStyles[variant];

  const content = (
    <MotiView
      animate={{
        opacity: disabled ? 0.6 : 1,
        scale: pressed ? 0.98 : 1,
      }}
      transition={{
        type: 'timing',
        duration: timing.normal,
      }}
      style={[
        {
          backgroundColor: styles.backgroundColor,
          borderRadius: borderRadius.xl,
          borderWidth: styles.borderWidth,
          borderColor: styles.borderColor,
          padding,
          overflow: 'hidden',
        },
        variant === 'elevated' && themedShadows.md,
      ]}
    >
      {children}
    </MotiView>
  );

  if (onPress && !disabled) {
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

// Staggered list of cards
export interface AnimatedCardListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
}

export function AnimatedCardList({
  children,
  staggerDelay = 100,
}: AnimatedCardListProps) {
  return (
    <>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ delay?: number }>, {
            delay: index * staggerDelay,
          });
        }
        return child;
      })}
    </>
  );
}
