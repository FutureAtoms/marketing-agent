import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Text, YStack, XStack, useTheme } from 'tamagui';

export interface BarChartData {
  x: string;
  y: number;
  fill?: string;
}

export interface BarChartProps {
  data: BarChartData[];
  title?: string;
  subtitle?: string;
  color?: string;
  height?: number;
  horizontal?: boolean;
  showLabels?: boolean;
  formatY?: (value: number) => string;
}

export function BarChart({
  data,
  title,
  subtitle,
  color = '#6366f1',
  height = 220,
  horizontal = false,
  showLabels = true,
  formatY = (v) => v.toLocaleString(),
}: BarChartProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - 48, 600);
  const theme = useTheme();

  // Theme-aware colors for backgrounds
  const barBackgroundColor = theme.backgroundHover?.val || '#f1f5f9';

  if (!data || data.length === 0) {
    return (
      <View style={{ height, justifyContent: 'center', alignItems: 'center' }}>
        <Text color="$colorHover">No data available</Text>
      </View>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.y));

  if (horizontal) {
    return (
      <YStack>
        {(title || subtitle) && (
          <YStack marginBottom="$3">
            {title && (
              <Text color="$color" fontWeight="600" fontSize="$4">
                {title}
              </Text>
            )}
            {subtitle && (
              <Text color="$colorHover" fontSize="$2">
                {subtitle}
              </Text>
            )}
          </YStack>
        )}
        <YStack space="$2">
          {data.map((item, index) => (
            <XStack key={index} alignItems="center" space="$2">
              <Text color="$colorHover" fontSize="$2" width={80} numberOfLines={1}>
                {item.x}
              </Text>
              <View style={{ flex: 1, height: 24, backgroundColor: barBackgroundColor, borderRadius: 4 }}>
                <View
                  style={{
                    width: `${(item.y / maxValue) * 100}%`,
                    height: '100%',
                    backgroundColor: item.fill || color,
                    borderRadius: 4,
                  }}
                />
              </View>
              {showLabels && (
                <Text color="$color" fontSize="$2" fontWeight="500" width={60} textAlign="right">
                  {formatY(item.y)}
                </Text>
              )}
            </XStack>
          ))}
        </YStack>
      </YStack>
    );
  }

  // Vertical bar chart
  const barWidth = Math.max((chartWidth - data.length * 8) / data.length, 20);

  return (
    <YStack>
      {(title || subtitle) && (
        <YStack marginBottom="$3">
          {title && (
            <Text color="$color" fontWeight="600" fontSize="$4">
              {title}
            </Text>
          )}
          {subtitle && (
            <Text color="$colorHover" fontSize="$2">
              {subtitle}
            </Text>
          )}
        </YStack>
      )}
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' }}>
        {data.map((item, index) => {
          const barHeight = (item.y / maxValue) * (height - 40);
          return (
            <YStack key={index} alignItems="center" space="$1">
              {showLabels && (
                <Text color="$color" fontSize="$1" fontWeight="500">
                  {formatY(item.y)}
                </Text>
              )}
              <View
                style={{
                  width: barWidth,
                  height: barHeight,
                  backgroundColor: item.fill || color,
                  borderRadius: 4,
                }}
              />
              <Text color="$colorHover" fontSize="$1" numberOfLines={1} textAlign="center">
                {item.x}
              </Text>
            </YStack>
          );
        })}
      </View>
    </YStack>
  );
}
