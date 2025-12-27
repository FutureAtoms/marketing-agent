import React, { useState } from 'react';
import { View, Text, YStack, XStack, Card, Button, Spinner, useTheme } from 'tamagui';
import { Sparkles, RefreshCw, ChevronRight, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react-native';
import { AI } from '../../lib/ai';

interface Insight {
  type: 'success' | 'warning' | 'suggestion';
  title: string;
  description: string;
  action?: string;
}

interface AIInsightsProps {
  analyticsData?: {
    pageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    avgSessionDuration: number;
    topPages: string[];
    conversionRate: number;
    trafficSources: Record<string, number>;
  };
}

// Mock insights for demo (in production, these would come from Claude)
const mockInsights: Insight[] = [
  {
    type: 'success',
    title: 'Email performance is up 23%',
    description: 'Your email open rates have increased significantly compared to last month. Tuesday sends perform best.',
    action: 'Schedule more Tuesday campaigns',
  },
  {
    type: 'warning',
    title: 'Landing page bounce rate is high',
    description: 'The pricing page has a 68% bounce rate. Consider A/B testing the headline and CTA.',
    action: 'Start A/B test',
  },
  {
    type: 'suggestion',
    title: 'Opportunity: LinkedIn engagement',
    description: 'Your LinkedIn posts get 3x more engagement than Twitter. Consider increasing LinkedIn content.',
    action: 'View social analytics',
  },
];

export function AIInsights({ analyticsData }: AIInsightsProps) {
  const theme = useTheme();
  const [insights, setInsights] = useState<Insight[]>(mockInsights);
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const refreshInsights = async () => {
    if (!analyticsData) return;

    setIsLoading(true);
    try {
      const result = await AI.generateMarketingInsights(analyticsData);

      // Convert AI response to insights format
      const newInsights: Insight[] = result.insights.slice(0, 3).map((insight, idx) => ({
        type: idx === 0 ? 'success' : idx === 1 ? 'warning' : 'suggestion',
        title: insight.split('.')[0] || insight,
        description: insight,
      }));

      if (newInsights.length > 0) {
        setInsights(newInsights);
      }
    } catch (error) {
      console.error('Failed to generate insights:', error);
      // Keep existing insights on error
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return TrendingUp;
      case 'warning':
        return AlertCircle;
      case 'suggestion':
        return Lightbulb;
    }
  };

  const getColor = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return theme.success.val;
      case 'warning':
        return theme.warning.val;
      case 'suggestion':
        return theme.primary.val;
    }
  };

  const displayedInsights = expanded ? insights : insights.slice(0, 2);

  return (
    <Card backgroundColor="$backgroundHover" borderRadius="$4" overflow="hidden">
      {/* Header */}
      <XStack
        padding="$4"
        justifyContent="space-between"
        alignItems="center"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <XStack space="$2" alignItems="center">
          <View backgroundColor="$primary" padding="$2" borderRadius="$2" opacity={0.15}>
            <Sparkles size={18} color={theme.primary.val} />
          </View>
          <YStack>
            <Text color="$color" fontWeight="600" fontSize="$4">
              AI Insights
            </Text>
            <Text color="$colorHover" fontSize="$2">
              Powered by Claude
            </Text>
          </YStack>
        </XStack>
        <Button
          size="$3"
          backgroundColor="$background"
          borderRadius="$2"
          onPress={refreshInsights}
          disabled={isLoading}
        >
          {isLoading ? (
            <Spinner size="small" color="$colorHover" />
          ) : (
            <RefreshCw size={16} color={theme.textMuted.val} />
          )}
        </Button>
      </XStack>

      {/* Insights List */}
      <YStack padding="$4" space="$3">
        {displayedInsights.map((insight, index) => {
          const Icon = getIcon(insight.type);
          const color = getColor(insight.type);

          return (
            <XStack
              key={index}
              space="$3"
              padding="$3"
              backgroundColor="$background"
              borderRadius="$3"
              alignItems="flex-start"
            >
              <View
                backgroundColor={color}
                padding="$2"
                borderRadius="$2"
                opacity={0.15}
                marginTop="$1"
              >
                <Icon size={16} color={color} />
              </View>
              <YStack flex={1} space="$1">
                <Text color="$color" fontWeight="600" fontSize="$3">
                  {insight.title}
                </Text>
                <Text color="$colorHover" fontSize="$2">
                  {insight.description}
                </Text>
                {insight.action && (
                  <Button
                    size="$2"
                    chromeless
                    alignSelf="flex-start"
                    marginTop="$1"
                    paddingHorizontal={0}
                  >
                    <Text color="$primary" fontSize="$2" fontWeight="500">
                      {insight.action}
                    </Text>
                    <ChevronRight size={14} color={theme.primary.val} />
                  </Button>
                )}
              </YStack>
            </XStack>
          );
        })}

        {insights.length > 2 && (
          <Button
            size="$3"
            chromeless
            onPress={() => setExpanded(!expanded)}
          >
            <Text color="$colorHover" fontSize="$2">
              {expanded ? 'Show less' : `Show ${insights.length - 2} more insights`}
            </Text>
          </Button>
        )}
      </YStack>
    </Card>
  );
}
