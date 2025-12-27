import React, { useState, useCallback } from 'react';
import { View, Pressable, StyleSheet, LayoutChangeEvent, Platform } from 'react-native';
import { MotiView } from 'moti';
import { Text, XStack, useTheme } from 'tamagui';
import * as Haptics from 'expo-haptics';
import { borderRadius, timing } from '../../lib/design-tokens';

export interface TabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

export interface AnimatedTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  variant?: 'pill' | 'underline' | 'boxed';
}

export function AnimatedTabs({
  tabs,
  activeTab,
  onTabChange,
  variant = 'pill',
}: AnimatedTabsProps) {
  const theme = useTheme();
  const primaryColor = theme.primary?.val || '#0F6CBD';
  const textMutedColor = theme.textMuted?.val || '#6B6B6B';
  const borderColor = theme.borderColor?.val || '#E0E0E0';
  const backgroundSubtleColor = theme.backgroundHover?.val || '#F5F5F5';
  const cardBackground = theme.card?.val || '#FFFFFF';
  const errorColor = theme.error?.val || '#DC2626';

  const [tabLayouts, setTabLayouts] = useState<Record<string, { x: number; width: number }>>({});

  const handleTabLayout = useCallback((key: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts((prev) => ({ ...prev, [key]: { x, width } }));
  }, []);

  const handleTabPress = useCallback((key: string) => {
    if (key !== activeTab) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onTabChange(key);
    }
  }, [activeTab, onTabChange]);

  const activeLayout = tabLayouts[activeTab];

  if (variant === 'underline') {
    return (
      <View style={[styles.underlineContainer, { borderBottomColor: borderColor }]}>
        <XStack>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => handleTabPress(tab.key)}
              onLayout={(e) => handleTabLayout(tab.key, e)}
              style={styles.underlineTab}
            >
              <XStack alignItems="center" gap="$2">
                {tab.icon}
                <Text
                  color={activeTab === tab.key ? primaryColor : textMutedColor}
                  fontWeight={activeTab === tab.key ? '600' : '400'}
                  fontSize="$3"
                >
                  {tab.label}
                </Text>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <View style={[styles.badge, { backgroundColor: errorColor }]}>
                    <Text color="#fff" fontSize={10} fontWeight="700">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </Text>
                  </View>
                )}
              </XStack>
            </Pressable>
          ))}
        </XStack>
        {activeLayout && (
          <MotiView
            animate={{
              translateX: activeLayout.x,
              width: activeLayout.width,
            }}
            transition={{
              type: 'spring',
              damping: timing.spring.damping,
              stiffness: timing.spring.stiffness,
            }}
            style={[styles.underlineIndicator, { backgroundColor: primaryColor }]}
          />
        )}
      </View>
    );
  }

  if (variant === 'boxed') {
    return (
      <View style={styles.boxedContainer}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => handleTabPress(tab.key)}
            style={styles.boxedTab}
          >
            <MotiView
              animate={{
                backgroundColor:
                  activeTab === tab.key ? primaryColor : 'transparent',
              }}
              transition={{ type: 'timing', duration: timing.fast }}
              style={styles.boxedTabInner}
            >
              <XStack alignItems="center" gap="$2">
                {tab.icon}
                <Text
                  color={activeTab === tab.key ? '#fff' : textMutedColor}
                  fontWeight="600"
                  fontSize="$3"
                >
                  {tab.label}
                </Text>
              </XStack>
            </MotiView>
          </Pressable>
        ))}
      </View>
    );
  }

  // Pill variant (default)
  return (
    <View style={[styles.pillContainer, { backgroundColor: backgroundSubtleColor }]}>
      {activeLayout && (
        <MotiView
          animate={{
            translateX: activeLayout.x,
            width: activeLayout.width,
          }}
          transition={{
            type: 'spring',
            damping: timing.spring.damping,
            stiffness: timing.spring.stiffness,
          }}
          style={[styles.pillIndicator, { backgroundColor: primaryColor }]}
        />
      )}
      {tabs.map((tab) => (
        <Pressable
          key={tab.key}
          onPress={() => handleTabPress(tab.key)}
          onLayout={(e) => handleTabLayout(tab.key, e)}
          style={styles.pillTab}
        >
          <XStack alignItems="center" gap="$2">
            {tab.icon}
            <Text
              color={activeTab === tab.key ? '#fff' : textMutedColor}
              fontWeight="600"
              fontSize="$3"
            >
              {tab.label}
            </Text>
            {tab.badge !== undefined && tab.badge > 0 && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: errorColor },
                  activeTab === tab.key && styles.badgeActive,
                ]}
              >
                <Text
                  color={activeTab === tab.key ? primaryColor : '#fff'}
                  fontSize={10}
                  fontWeight="700"
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </Text>
              </View>
            )}
          </XStack>
        </Pressable>
      ))}
    </View>
  );
}

// Animated progress indicator
export function AnimatedProgress({
  value,
  max = 100,
  color,
  height = 8,
  animated = true,
}: {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  animated?: boolean;
}) {
  const theme = useTheme();
  const primaryColor = theme.primary?.val || '#0F6CBD';
  const backgroundSubtleColor = theme.backgroundSubtle?.val || '#F5F5F5';
  const progressColor = color || primaryColor;
  const percentage = Math.min(100, (value / max) * 100);

  return (
    <View style={[styles.progressContainer, { height, backgroundColor: backgroundSubtleColor }]}>
      <MotiView
        animate={{
          width: `${percentage}%` as any,
        }}
        transition={animated ? { type: 'spring', damping: 15 } : { type: 'timing', duration: 0 }}
        style={[styles.progressBar, { backgroundColor: progressColor }]}
      />
    </View>
  );
}

// Animated badge
export function AnimatedBadge({
  count,
  variant = 'primary',
  size = 'md',
}: {
  count: number;
  variant?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}) {
  const theme = useTheme();
  const primaryColor = theme.primary?.val || '#0F6CBD';
  const successColor = theme.success?.val || '#10B981';
  const warningColor = theme.warning?.val || '#F59E0B';
  const errorColor = theme.error?.val || '#DC2626';

  const colorMap = {
    primary: primaryColor,
    success: successColor,
    warning: warningColor,
    error: errorColor,
  };

  const sizeMap = {
    sm: { minWidth: 16, height: 16, fontSize: 10, padding: 2 },
    md: { minWidth: 20, height: 20, fontSize: 11, padding: 4 },
    lg: { minWidth: 24, height: 24, fontSize: 12, padding: 6 },
  };

  const style = sizeMap[size];

  if (count === 0) return null;

  return (
    <View
      style={[
        styles.animatedBadge,
        {
          backgroundColor: colorMap[variant],
          minWidth: style.minWidth,
          height: style.height,
          paddingHorizontal: style.padding,
        },
      ]}
    >
      <Text color="#fff" fontSize={style.fontSize} fontWeight="700">
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Pill variant
  pillContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.full,
    padding: 4,
    position: 'relative',
  },
  pillIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: borderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pillTab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    zIndex: 1,
  },

  // Underline variant
  underlineContainer: {
    borderBottomWidth: 1,
    position: 'relative',
  },
  underlineTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  underlineIndicator: {
    position: 'absolute',
    bottom: -1,
    height: 2,
    borderRadius: 1,
  },

  // Boxed variant
  boxedContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  boxedTab: {
    flex: 1,
  },
  boxedTabInner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },

  // Badge
  badge: {
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeActive: {
    backgroundColor: '#fff',
  },

  // Progress
  progressContainer: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: borderRadius.full,
  },

  // Animated badge
  animatedBadge: {
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
