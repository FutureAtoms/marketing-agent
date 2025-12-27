import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from 'tamagui';
import { borderRadius, shadows } from '../../lib/design-tokens';

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius: radius = borderRadius.md,
  style,
}: SkeletonProps) {
  const theme = useTheme();
  const skeletonBackgroundColor = theme.gray5?.val || '#E0E0E0';
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: width as number,
          height,
          borderRadius: radius,
          backgroundColor: skeletonBackgroundColor,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

// Skeleton variants for common use cases
export function SkeletonText({
  lines = 3,
  lastLineWidth = '60%',
}: {
  lines?: number;
  lastLineWidth?: string;
}) {
  return (
    <View style={styles.textContainer}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? lastLineWidth : '100%'}
          height={14}
          style={i > 0 ? { marginTop: 8 } : undefined}
        />
      ))}
    </View>
  );
}

export function SkeletonAvatar({
  size = 48,
}: {
  size?: number;
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
    />
  );
}

export function SkeletonCard() {
  const theme = useTheme();
  const cardBackground = theme.card?.val || '#FFFFFF';
  const shadowColor = theme.shadowColor?.val || '#000000';

  return (
    <View
      style={[styles.card, { backgroundColor: cardBackground, shadowColor }]}
    >
      <View style={styles.cardHeader}>
        <SkeletonAvatar size={40} />
        <View style={styles.cardHeaderText}>
          <Skeleton width={120} height={14} />
          <Skeleton width={80} height={12} style={{ marginTop: 6 }} />
        </View>
      </View>
      <SkeletonText lines={2} />
      <Skeleton height={160} style={{ marginTop: 12 }} borderRadius={borderRadius.lg} />
    </View>
  );
}

export function SkeletonList({
  count = 5,
  itemHeight = 72,
}: {
  count?: number;
  itemHeight?: number;
}) {
  const theme = useTheme();
  const cardBackground = theme.card?.val || '#FFFFFF';

  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[styles.listItem, { backgroundColor: cardBackground }]}
        >
          <SkeletonAvatar size={48} />
          <View style={styles.listItemContent}>
            <Skeleton width="70%" height={16} />
            <Skeleton width="50%" height={12} style={{ marginTop: 6 }} />
          </View>
          <Skeleton width={60} height={24} borderRadius={borderRadius.md} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonChart() {
  const theme = useTheme();
  const chartBarBackgroundColor = theme.backgroundHover?.val || '#F5F5F5';
  const cardBackground = theme.card?.val || '#FFFFFF';

  return (
    <View
      style={[styles.chart, { backgroundColor: cardBackground }]}
    >
      <View style={styles.chartHeader}>
        <Skeleton width={150} height={20} />
        <Skeleton width={100} height={32} borderRadius={borderRadius.md} />
      </View>
      <View style={styles.chartBars}>
        {[0.6, 0.8, 0.5, 0.9, 0.7, 0.85, 0.65].map((h, i) => (
          <View
            key={i}
            style={[styles.chartBar, { height: `${h * 100}%` }]}
          >
            <View style={[styles.chartBarInner, { backgroundColor: chartBarBackgroundColor }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  textContainer: {
    flex: 1,
  },
  card: {
    // backgroundColor is set dynamically via inline styles for theme support
    borderRadius: borderRadius.xl,
    padding: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  list: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor is set dynamically via inline styles for theme support
    padding: 12,
    borderRadius: borderRadius.lg,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  chart: {
    // backgroundColor is set dynamically via inline styles for theme support
    borderRadius: borderRadius.xl,
    padding: 20,
    height: 280,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
  },
  chartBar: {
    width: 32,
    justifyContent: 'flex-end',
  },
  chartBarInner: {
    flex: 1,
    borderRadius: borderRadius.sm,
  },
});
