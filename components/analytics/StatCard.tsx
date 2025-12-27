import React from 'react';
import { View, Text, YStack, XStack, Card } from 'tamagui';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: LucideIcon;
  iconColor?: string;
  format?: 'number' | 'currency' | 'percent';
  prefix?: string;
  suffix?: string;
}

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = '#6366f1',
  format = 'number',
  prefix = '',
  suffix = '',
}: StatCardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'percent':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change === 0;

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const trendColor = isPositive ? '#10b981' : isNegative ? '#ef4444' : '#64748b';

  return (
    <Card
      flex={1}
      minWidth={150}
      padding="$4"
      backgroundColor="$backgroundHover"
      borderRadius="$4"
      pressStyle={{ scale: 0.98 }}
    >
      <YStack space="$3">
        <XStack justifyContent="space-between" alignItems="center">
          {Icon && (
            <View
              backgroundColor={iconColor}
              padding="$2"
              borderRadius="$2"
              opacity={0.15}
            >
              <Icon size={20} color={iconColor} />
            </View>
          )}
          {change !== undefined && (
            <XStack alignItems="center" space="$1">
              <TrendIcon size={14} color={trendColor} />
              <Text
                fontSize="$2"
                color={trendColor}
                fontWeight="500"
              >
                {isPositive && '+'}
                {change.toFixed(1)}%
              </Text>
            </XStack>
          )}
        </XStack>
        <YStack>
          <Text fontSize="$7" fontWeight="bold" color="$color">
            {prefix}
            {formatValue(value)}
            {suffix}
          </Text>
          <Text fontSize="$2" color="$colorHover">
            {title}
          </Text>
        </YStack>
      </YStack>
    </Card>
  );
}
