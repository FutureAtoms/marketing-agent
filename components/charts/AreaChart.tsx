import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Text, YStack, XStack, useTheme } from 'tamagui';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

export interface AreaChartData {
  x: string | number;
  y: number;
}

export interface AreaChartSeries {
  data: AreaChartData[];
  color: string;
  name: string;
}

export interface AreaChartProps {
  series: AreaChartSeries[];
  title?: string;
  subtitle?: string;
  height?: number;
  stacked?: boolean;
  formatY?: (value: number) => string;
  formatX?: (value: string | number) => string;
}

export function AreaChart({
  series,
  title,
  subtitle,
  height = 220,
}: AreaChartProps) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - 48, 600);
  const chartHeight = height - 60;
  const padding = { top: 20, right: 10, bottom: 30, left: 40 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const theme = useTheme();

  // Theme-aware colors for grid lines
  const gridColor = theme.borderColor?.val || '#e2e8f0';

  if (!series || series.length === 0 || series.every((s) => s.data.length === 0)) {
    return (
      <View style={{ height, justifyContent: 'center', alignItems: 'center' }}>
        <Text color="$colorHover">No data available</Text>
      </View>
    );
  }

  // Find max value across all series
  const allValues = series.flatMap((s) => s.data.map((d) => d.y));
  const maxValue = Math.max(...allValues) * 1.1;
  const minValue = 0;

  // Generate paths for each series
  const generatePath = (data: AreaChartData[], fill: boolean = false): string => {
    if (data.length === 0) return '';

    const points = data.map((d, i) => ({
      x: padding.left + (i / (data.length - 1)) * plotWidth,
      y: padding.top + plotHeight - ((d.y - minValue) / (maxValue - minValue)) * plotHeight,
    }));

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }

    if (fill) {
      path += ` L ${points[points.length - 1].x} ${padding.top + plotHeight}`;
      path += ` L ${points[0].x} ${padding.top + plotHeight}`;
      path += ' Z';
    }

    return path;
  };

  // Y-axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    value: Math.round(minValue + pct * (maxValue - minValue)),
    y: padding.top + plotHeight * (1 - pct),
  }));

  // X-axis labels (sample from first series)
  const sampleData = series[0].data;
  const xLabelCount = Math.min(5, sampleData.length);
  const xLabels = sampleData
    .filter((_, i) => i % Math.ceil(sampleData.length / xLabelCount) === 0)
    .map((d, i, arr) => ({
      label: String(d.x),
      x: padding.left + (i / (arr.length - 1)) * plotWidth,
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

      {/* Legend */}
      {series.length > 1 && (
        <XStack gap="$3" marginBottom="$2" flexWrap="wrap">
          {series.map((s) => (
            <XStack key={s.name} alignItems="center" gap="$1">
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  backgroundColor: s.color,
                }}
              />
              <Text color="$colorHover" fontSize="$2">
                {s.name}
              </Text>
            </XStack>
          ))}
        </XStack>
      )}

      <View style={{ height: chartHeight, width: chartWidth }}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            {series.map((s, i) => (
              <LinearGradient key={i} id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                <Stop offset="100%" stopColor={s.color} stopOpacity={0.05} />
              </LinearGradient>
            ))}
          </Defs>

          {/* Grid lines */}
          {yLabels.map((label, i) => (
            <Path
              key={i}
              d={`M ${padding.left} ${label.y} L ${chartWidth - padding.right} ${label.y}`}
              stroke={gridColor}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          ))}

          {/* Area fills */}
          {series.map((s, i) => (
            <Path
              key={`fill-${i}`}
              d={generatePath(s.data, true)}
              fill={`url(#gradient-${i})`}
            />
          ))}

          {/* Lines */}
          {series.map((s, i) => (
            <Path
              key={`line-${i}`}
              d={generatePath(s.data)}
              stroke={s.color}
              strokeWidth={2}
              fill="none"
            />
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

        {/* X-axis labels */}
        {xLabels.map((label, i) => (
          <Text
            key={i}
            style={{
              position: 'absolute',
              left: label.x - 20,
              bottom: 5,
              width: 40,
              textAlign: 'center',
            }}
            color="$colorHover"
            fontSize={10}
          >
            {label.label}
          </Text>
        ))}
      </View>
    </YStack>
  );
}
