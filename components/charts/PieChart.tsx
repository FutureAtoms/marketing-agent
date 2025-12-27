import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Text, YStack, XStack, useTheme } from 'tamagui';
import Svg, { Path, G } from 'react-native-svg';

export interface PieChartData {
  x: string;
  y: number;
  color?: string;
}

export interface PieChartProps {
  data: PieChartData[];
  title?: string;
  subtitle?: string;
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  innerRadius?: number;
  colors?: string[];
}

const defaultColors = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#3b82f6',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
];

// Helper to create SVG arc path
function describeArc(
  x: number,
  y: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const startInner = polarToCartesian(x, y, innerRadius, endAngle);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  if (innerRadius === 0) {
    return [
      'M', startOuter.x, startOuter.y,
      'A', outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
      'L', x, y,
      'Z',
    ].join(' ');
  }

  return [
    'M', startOuter.x, startOuter.y,
    'A', outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
    'L', endInner.x, endInner.y,
    'A', innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
    'Z',
  ].join(' ');
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

export function PieChart({
  data,
  title,
  subtitle,
  height = 250,
  showLegend = true,
  innerRadius = 0,
  colors = defaultColors,
}: PieChartProps) {
  const { width } = useWindowDimensions();
  const chartSize = Math.min(width - 48, height - 40, 200);
  const outerRadius = chartSize / 2 - 10;
  const centerX = chartSize / 2;
  const centerY = chartSize / 2;

  if (!data || data.length === 0) {
    return (
      <View style={{ height, justifyContent: 'center', alignItems: 'center' }}>
        <Text color="$colorHover">No data available</Text>
      </View>
    );
  }

  const total = data.reduce((sum, item) => sum + item.y, 0);
  let currentAngle = 0;

  const slices = data.map((item, index) => {
    const sliceAngle = (item.y / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;

    return {
      ...item,
      color: item.color || colors[index % colors.length],
      startAngle,
      endAngle,
      percentage: ((item.y / total) * 100).toFixed(1),
    };
  });

  return (
    <YStack>
      {(title || subtitle) && (
        <YStack marginBottom="$2">
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
      <XStack justifyContent="center" alignItems="center" flexWrap="wrap" gap="$4">
        <Svg width={chartSize} height={chartSize}>
          <G>
            {slices.map((slice, index) => (
              <Path
                key={index}
                d={describeArc(
                  centerX,
                  centerY,
                  outerRadius,
                  innerRadius,
                  slice.startAngle,
                  slice.endAngle - 0.5 // Small gap between slices
                )}
                fill={slice.color}
              />
            ))}
          </G>
        </Svg>
        {showLegend && (
          <YStack space="$2">
            {slices.map((slice, index) => (
              <XStack key={index} alignItems="center" space="$2">
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    backgroundColor: slice.color,
                  }}
                />
                <Text color="$colorHover" fontSize="$2">
                  {slice.x} ({slice.percentage}%)
                </Text>
              </XStack>
            ))}
          </YStack>
        )}
      </XStack>
    </YStack>
  );
}
