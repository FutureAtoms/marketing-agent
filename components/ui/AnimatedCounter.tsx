import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Text, YStack, XStack, useTheme } from 'tamagui';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius } from '../../lib/design-tokens';

// Animated number that counts up
export function AnimatedCounter({
  value,
  duration = 1500,
  prefix = '',
  suffix = '',
  decimals = 0,
  fontSize = 32,
  color,
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  fontSize?: number;
  color?: string;
}) {
  const theme = useTheme();
  const defaultColor = theme.color?.val || '#1A1A1A';
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });

    // Update display value using requestAnimationFrame for smooth updates
    let startTime: number;
    const startValue = displayValue;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
      const currentValue = startValue + (value - startValue) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  const formattedValue = displayValue.toFixed(decimals);

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 15 }}
    >
      <Text fontSize={fontSize} fontWeight="700" color={color || defaultColor}>
        {prefix}
        {Number(formattedValue).toLocaleString()}
        {suffix}
      </Text>
    </MotiView>
  );
}

// Stat card with animated counter
export interface AnimatedStatCardProps {
  title: string;
  value: number;
  change?: number;
  prefix?: string;
  suffix?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

export function AnimatedStatCard({
  title,
  value,
  change,
  prefix = '',
  suffix = '',
  icon,
  iconColor,
}: AnimatedStatCardProps) {
  const theme = useTheme();
  const primaryColor = theme.primary?.val || '#0F6CBD';
  const textMutedColor = theme.textMuted?.val || '#6B7280';
  const textSecondaryColor = theme.textSecondary?.val || '#9CA3AF';
  const successColor = theme.success?.val || '#22C55E';
  const errorColor = theme.error?.val || '#EF4444';
  const cardBackground = theme.card?.val || '#FFFFFF';
  const shadowColor = theme.shadowColor?.val || '#000000';
  const resolvedIconColor = iconColor || primaryColor;
  const isPositive = change !== undefined && change >= 0;

  return (
    <View style={[styles.statCard, { backgroundColor: cardBackground, shadowColor }]}>
      <XStack justifyContent="space-between" alignItems="flex-start">
        <YStack flex={1}>
          <Text color={textMutedColor} fontSize="$2" fontWeight="500">
            {title}
          </Text>
          <AnimatedCounter
            value={value}
            prefix={prefix}
            suffix={suffix}
            fontSize={28}
            duration={1500}
          />
          {change !== undefined && (
            <XStack alignItems="center" gap="$1" marginTop="$1">
              <Ionicons
                name={isPositive ? 'trending-up' : 'trending-down'}
                size={14}
                color={isPositive ? successColor : errorColor}
              />
              <Text
                color={isPositive ? successColor : errorColor}
                fontSize="$2"
                fontWeight="600"
              >
                {isPositive ? '+' : ''}{change.toFixed(1)}%
              </Text>
              <Text color={textSecondaryColor} fontSize="$2">
                vs last period
              </Text>
            </XStack>
          )}
        </YStack>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${resolvedIconColor}15` }]}>
            <Ionicons name={icon} size={24} color={resolvedIconColor} />
          </View>
        )}
      </XStack>
    </View>
  );
}

// Comparison counter (before/after)
export function ComparisonCounter({
  label,
  before,
  after,
  format = (v: number) => v.toLocaleString(),
}: {
  label: string;
  before: number;
  after: number;
  format?: (value: number) => string;
}) {
  const theme = useTheme();
  const textMutedColor = theme.textMuted?.val || '#6B7280';
  const textSecondaryColor = theme.textSecondary?.val || '#9CA3AF';
  const textColor = theme.color?.val || '#1A1A1A';
  const textTertiaryColor = theme.borderColor?.val || '#D1D5DB';
  const successColor = theme.success?.val || '#22C55E';
  const successBgColor = '#DCFCE7'; // Light green background
  const errorColor = theme.error?.val || '#EF4444';
  const errorBgColor = '#FEE2E2'; // Light red background
  const cardBackground = theme.card?.val || '#FFFFFF';
  const shadowColor = theme.shadowColor?.val || '#000000';
  const change = ((after - before) / before) * 100;
  const isPositive = change >= 0;

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={[styles.comparisonCard, { backgroundColor: cardBackground, shadowColor }]}
    >
      <Text color={textMutedColor} fontSize="$2" marginBottom="$2">
        {label}
      </Text>
      <XStack alignItems="center" gap="$3">
        <YStack alignItems="center">
          <Text color={textSecondaryColor} fontSize="$1">Before</Text>
          <Text color={textMutedColor} fontSize="$4" fontWeight="600">
            {format(before)}
          </Text>
        </YStack>
        <MotiView
          from={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 300 }}
        >
          <Ionicons
            name="arrow-forward"
            size={20}
            color={textTertiaryColor}
          />
        </MotiView>
        <YStack alignItems="center">
          <Text color={textSecondaryColor} fontSize="$1">After</Text>
          <AnimatedCounter
            value={after}
            fontSize={18}
            color={textColor}
            duration={1000}
          />
        </YStack>
        <MotiView
          from={{ opacity: 0, translateX: -10 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', delay: 800 }}
          style={[
            styles.changeBadge,
            { backgroundColor: isPositive ? successBgColor : errorBgColor },
          ]}
        >
          <Ionicons
            name={isPositive ? 'arrow-up' : 'arrow-down'}
            size={12}
            color={isPositive ? successColor : errorColor}
          />
          <Text
            color={isPositive ? successColor : errorColor}
            fontSize="$1"
            fontWeight="600"
          >
            {Math.abs(change).toFixed(1)}%
          </Text>
        </MotiView>
      </XStack>
    </MotiView>
  );
}

// Circular progress with animated counter
export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  color,
  label,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}) {
  const theme = useTheme();
  const primaryColor = theme.primary?.val || '#0F6CBD';
  const textMutedColor = theme.colorSubtle?.val || '#6B7280';
  const resolvedColor = color || primaryColor;
  const percentage = Math.min(100, (value / max) * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const animatedOffset = useSharedValue(circumference);

  useEffect(() => {
    animatedOffset.value = withTiming(
      circumference - (percentage / 100) * circumference,
      { duration: 1500, easing: Easing.out(Easing.cubic) }
    );
  }, [percentage, circumference]);

  return (
    <MotiView
      from={{ scale: 0, rotate: '-90deg' }}
      animate={{ scale: 1, rotate: '0deg' }}
      transition={{ type: 'spring', damping: 12 }}
      style={[styles.circularContainer, { width: size, height: size }]}
    >
      <View style={styles.circularCenter}>
        <AnimatedCounter
          value={value}
          fontSize={size * 0.2}
          duration={1500}
        />
        {label && (
          <Text color={textMutedColor} fontSize={size * 0.08}>
            {label}
          </Text>
        )}
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  statCard: {
    // backgroundColor is set dynamically via inline styles for theme support
    borderRadius: borderRadius.xl,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comparisonCard: {
    // backgroundColor is set dynamically via inline styles for theme support
    borderRadius: borderRadius.lg,
    padding: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  circularContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
