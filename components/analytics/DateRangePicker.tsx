import React from 'react';
import { View, XStack, Button, Text, useTheme } from 'tamagui';
import { Calendar } from 'lucide-react-native';
import type { DateRange } from '../../hooks/useAnalytics';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const ranges: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '12m', label: '12 Months' },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const theme = useTheme();

  return (
    <XStack
      backgroundColor="$backgroundHover"
      borderRadius="$3"
      padding="$1"
      alignItems="center"
      gap="$1"
    >
      <View padding="$2">
        <Calendar size={16} color={theme.textMuted.val} />
      </View>
      {ranges.map((range) => (
        <Button
          key={range.value}
          size="$2"
          backgroundColor={value === range.value ? '$background' : 'transparent'}
          borderRadius="$2"
          paddingHorizontal="$3"
          onPress={() => onChange(range.value)}
          pressStyle={{ opacity: 0.7 }}
        >
          <Text
            color={value === range.value ? '$color' : '$colorHover'}
            fontSize="$2"
            fontWeight={value === range.value ? '600' : '400'}
          >
            {range.label}
          </Text>
        </Button>
      ))}
    </XStack>
  );
}
