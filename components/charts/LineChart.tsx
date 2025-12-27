import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Text, YStack, useTheme } from 'tamagui';
import Svg, { Path, Circle, Line as SvgLine, G } from 'react-native-svg';

export interface LineChartData {
  x: string | number;
  y: number;
}

export interface LineChartProps {
  data: LineChartData[];
  title?: string;
  subtitle?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  formatY?: (value: number) => string;
  formatX?: (value: string | number) => string;
}

export function LineChart({
  data,
  title,
  subtitle,
  color = '#6366f1',
  height = 220,
  showGrid = true,
}: LineChartProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - 48, 600);
  const chartHeight = height - 50;
  const padding = { top: 20, right: 10, bottom: 5, left: 45 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const theme = useTheme();

  // Theme-aware colors for grid lines
  const gridColor = theme.borderColor?.val || '#e2e8f0';

  if (!data || data.length === 0) {
    return (
      <View style={{ height, justifyContent: 'center', alignItems: 'center' }}>
        <Text color="$colorHover">No data available</Text>
      </View>
    );
  }

  // Calculate min/max
  const values = data.map((d) => d.y);
  const minValue = Math.min(...values) * 0.9;
  const maxValue = Math.max(...values) * 1.1;
  const valueRange = maxValue - minValue;

  // Generate points
  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * plotWidth,
    y: padding.top + plotHeight - ((d.y - minValue) / valueRange) * plotHeight,
    label: String(d.x),
    value: d.y,
  }));

  // Generate path
  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    return `${acc} L ${p.x} ${p.y}`;
  }, '');

  // Y-axis labels
  const yLabelCount = 5;
  const yLabels = Array.from({ length: yLabelCount }, (_, i) => {
    const pct = i / (yLabelCount - 1);
    return {
      value: Math.round(minValue + pct * valueRange),
      y: padding.top + plotHeight * (1 - pct),
    };
  });

  // X-axis labels (sample)
  const xLabelCount = Math.min(5, data.length);
  const xLabels = data
    .filter((_, i) => i % Math.ceil(data.length / xLabelCount) === 0 || i === data.length - 1)
    .map((d, i, arr) => ({
      label: String(d.x),
      x: padding.left + (data.indexOf(d) / (data.length - 1)) * plotWidth,
    }));

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
      <View style={{ height: chartHeight, width: chartWidth }}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Grid lines */}
          {showGrid && (
            <G>
              {yLabels.map((label, i) => (
                <SvgLine
                  key={i}
                  x1={padding.left}
                  y1={label.y}
                  x2={chartWidth - padding.right}
                  y2={label.y}
                  stroke={gridColor}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
              ))}
            </G>
          )}

          {/* Line */}
          <Path d={pathD} stroke={color} strokeWidth={3} fill="none" />

          {/* Points */}
          {points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={4} fill={color} />
          ))}
        </Svg>

        {/* Y-axis labels */}
        {yLabels.map((label, i) => (
          <Text
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              top: label.y - 8,
              width: padding.left - 5,
              textAlign: 'right',
            }}
            color="$colorHover"
            fontSize={10}
          >
            {label.value.toLocaleString()}
          </Text>
        ))}
      </View>

      {/* X-axis labels */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: padding.left, marginTop: 4 }}>
        {xLabels.map((label, i) => (
          <Text key={i} color="$colorHover" fontSize={10}>
            {label.label}
          </Text>
        ))}
      </View>
    </YStack>
  );
}
