import { useState, useCallback } from 'react';
import { ScrollView as RNScrollView, RefreshControl, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  YStack,
  XStack,
  H2,
  H3,
  useTheme,
} from 'tamagui';
import {
  Users,
  Mail,
  Download,
  Share2,
  FileText,
  Sparkles,
} from 'lucide-react-native';

import { useAuthStore } from '../../../stores/authStore';
import { LineChart, BarChart, PieChart, AreaChart } from '../../../components/charts';
import { DateRangePicker, AIInsights } from '../../../components/analytics';
import {
  AnimatedButton,
  AnimatedCard,
  AnimatedStatCard,
  GlassCard,
  SkeletonCard,
  SkeletonChart,
  SkeletonList,
  useToast,
} from '../../../components/ui';
import {
  useOverviewStats,
  useTrafficData,
  useTrafficSources,
  useChannelPerformance,
  useTopPages,
  type DateRange,
} from '../../../hooks/useAnalytics';
import { useDashboardRealtime } from '../../../hooks/useRealtime';
import { exportToPDF, exportToCSV, createAnalyticsReport } from '../../../lib/export';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const { user } = useAuthStore();
  const { showToast } = useToast();

  // Real-time updates
  useDashboardRealtime();

  // Data hooks
  const { data: overviewStats, isLoading: statsLoading, refetch: refetchStats } = useOverviewStats(dateRange);
  const { data: trafficData, isLoading: trafficLoading, refetch: refetchTraffic } = useTrafficData(dateRange);
  const { data: trafficSources, refetch: refetchSources } = useTrafficSources(dateRange);
  const { data: channelData, refetch: refetchChannels } = useChannelPerformance(dateRange);
  const { data: topPages, refetch: refetchPages } = useTopPages(dateRange);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await Promise.all([
      refetchStats(),
      refetchTraffic(),
      refetchSources(),
      refetchChannels(),
      refetchPages(),
    ]);
    setRefreshing(false);
    showToast({
      type: 'success',
      title: 'Data refreshed',
      message: 'Dashboard updated with latest analytics',
      duration: 2000,
    });
  }, [refetchStats, refetchTraffic, refetchSources, refetchChannels, refetchPages, showToast]);

  const handleExportPDF = async () => {
    if (!overviewStats || !topPages) {
      showToast({
        type: 'warning',
        title: 'Please wait',
        message: 'Data is still loading',
      });
      return;
    }

    try {
      const reportData = createAnalyticsReport(
        {
          visitors: overviewStats.current.visitors,
          pageViews: overviewStats.current.pageViews,
          leads: overviewStats.current.leads,
          conversions: overviewStats.current.conversions,
          changes: overviewStats.changes,
        },
        topPages,
        dateRange === '7d' ? 'Last 7 Days' :
        dateRange === '30d' ? 'Last 30 Days' :
        dateRange === '90d' ? 'Last 90 Days' : 'Last 12 Months'
      );

      await exportToPDF(reportData, `analytics-report-${dateRange}`);
      showToast({
        type: 'success',
        title: 'Export complete',
        message: 'Your PDF report is ready',
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Export failed',
        message: 'Could not generate PDF report',
      });
    }
  };

  const handleExportCSV = async () => {
    if (!topPages) return;

    try {
      await exportToCSV(
        {
          headers: ['Page', 'Views', 'Conversions', 'Bounce Rate'],
          rows: topPages.map((p) => [p.page, p.views, p.conversions, `${p.bounceRate}%`]),
        },
        `top-pages-${dateRange}`
      );
      showToast({
        type: 'success',
        title: 'Export complete',
        message: 'CSV file downloaded',
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Export failed',
        message: 'Could not generate CSV file',
      });
    }
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  const isLoading = statsLoading || trafficLoading;

  // Get theme values for icon colors
  const theme = useTheme();

  return (
    <View flex={1} backgroundColor="$background">
      <RNScrollView
        contentContainerStyle={{
          padding: 16,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <YStack space="$6">
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap="$3">
            <YStack space="$1">
              <Text fontSize="$3" color="$colorHover">
                Welcome back,
              </Text>
              <H2 color="$color">{userName}</H2>
            </YStack>
            <XStack space="$2" alignItems="center">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <AnimatedButton
                variant="secondary"
                size="sm"
                onPress={handleExportPDF}
                icon={<Download size={16} color={theme.textMuted.val} />}
              >
                Export
              </AnimatedButton>
            </XStack>
          </XStack>

          {/* AI Insights with Glass Effect */}
          <GlassCard borderGlow>
            <XStack alignItems="center" gap="$2" marginBottom="$3">
              <Sparkles size={18} color={theme.primary.val} />
              <Text color="$color" fontWeight="600" fontSize="$4">AI Insights</Text>
            </XStack>
            <AIInsights
              analyticsData={
                overviewStats
                  ? {
                      pageViews: overviewStats.current.pageViews,
                      uniqueVisitors: overviewStats.current.visitors,
                      bounceRate: 35,
                      avgSessionDuration: 245,
                      topPages: topPages?.map((p) => p.page) || [],
                      conversionRate: overviewStats.conversionRate,
                      trafficSources: { organic: 45, direct: 25, social: 15, email: 10, paid: 5 },
                    }
                  : undefined
              }
            />
          </GlassCard>

          {/* Stats Grid with Staggered Animation */}
          {isLoading ? (
            <XStack flexWrap="wrap" gap="$4">
              {[0, 1, 2, 3].map((i) => (
                <View key={i} flex={1} minWidth={150}>
                  <SkeletonCard />
                </View>
              ))}
            </XStack>
          ) : overviewStats ? (
            <XStack flexWrap="wrap" gap="$4">
              <View flex={1} minWidth={150}>
                <AnimatedStatCard
                  title="Total Visitors"
                  value={overviewStats.current.visitors}
                  change={overviewStats.changes.visitors}
                  icon="eye"
                  iconColor={theme.primary.val}
                />
              </View>
              <View flex={1} minWidth={150}>
                <AnimatedStatCard
                  title="Leads Generated"
                  value={overviewStats.current.leads}
                  change={overviewStats.changes.leads}
                  icon="people"
                  iconColor={theme.accent.val}
                />
              </View>
              <View flex={1} minWidth={150}>
                <AnimatedStatCard
                  title="Conversion Rate"
                  value={overviewStats.conversionRate}
                  suffix="%"
                  icon="trending-up"
                  iconColor={theme.warning.val}
                />
              </View>
              <View flex={1} minWidth={150}>
                <AnimatedStatCard
                  title="Revenue"
                  value={overviewStats.current.revenue}
                  change={overviewStats.changes.revenue}
                  prefix="$"
                  icon="wallet"
                  iconColor={theme.error.val}
                />
              </View>
            </XStack>
          ) : null}

          {/* Traffic Chart */}
          <AnimatedCard>
            {trafficData && trafficData.length > 0 ? (
              <LineChart
                data={trafficData}
                title="Website Traffic"
                subtitle={`Visitors over ${dateRange === '7d' ? 'the last week' : dateRange === '30d' ? 'the last month' : 'time'}`}
                color={theme.primary.val}
                height={250}
              />
            ) : (
              <SkeletonChart />
            )}
          </AnimatedCard>

          {/* Channel Performance */}
          <AnimatedCard>
            {channelData && channelData.length > 0 ? (
              <AreaChart
                series={channelData}
                title="Channel Performance"
                subtitle="Engagement by marketing channel"
                height={250}
              />
            ) : (
              <SkeletonChart />
            )}
          </AnimatedCard>

          {/* Traffic Sources & Top Pages */}
          <XStack flexWrap="wrap" gap="$4">
            <View flex={1} minWidth={300}>
              <AnimatedCard>
                {trafficSources && trafficSources.length > 0 ? (
                  <PieChart
                    data={trafficSources}
                    title="Traffic Sources"
                    height={280}
                    innerRadius={50}
                  />
                ) : (
                  <YStack height={280} justifyContent="center" alignItems="center">
                    <Text color="$colorHover">Loading sources...</Text>
                  </YStack>
                )}
              </AnimatedCard>
            </View>

            {/* Top Pages */}
            <View flex={1} minWidth={300}>
              <AnimatedCard>
                <YStack space="$4">
                  <XStack justifyContent="space-between" alignItems="center">
                    <H3 color="$color">Top Pages</H3>
                    <AnimatedButton
                      variant="ghost"
                      size="sm"
                      onPress={handleExportCSV}
                      icon={<Share2 size={14} color={theme.textMuted.val} />}
                    >
                      Export
                    </AnimatedButton>
                  </XStack>
                  {topPages ? (
                    <YStack space="$3">
                      {topPages.map((page, index) => (
                        <XStack
                          key={page.page}
                          justifyContent="space-between"
                          alignItems="center"
                          paddingBottom="$3"
                          borderBottomWidth={index < topPages.length - 1 ? 1 : 0}
                          borderBottomColor="$borderColor"
                        >
                          <XStack space="$2" alignItems="center" flex={1}>
                            <View
                              style={{
                                width: 28,
                                height: 28,
                                backgroundColor: `${theme.primary.val}15`,
                                borderRadius: 8,
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}
                            >
                              <Text color="$primary" fontSize={12} fontWeight="700">
                                {index + 1}
                              </Text>
                            </View>
                            <Text color="$color" fontSize="$3" numberOfLines={1} flex={1}>
                              {page.page}
                            </Text>
                          </XStack>
                          <YStack alignItems="flex-end">
                            <Text color="$color" fontSize="$3" fontWeight="600">
                              {page.views.toLocaleString()}
                            </Text>
                            <Text color="$colorHover" fontSize="$2">
                              {page.conversions} conv.
                            </Text>
                          </YStack>
                        </XStack>
                      ))}
                    </YStack>
                  ) : (
                    <SkeletonList count={5} />
                  )}
                </YStack>
              </AnimatedCard>
            </View>
          </XStack>

          {/* Quick Actions */}
          <YStack space="$4">
            <H3 color="$color">Quick Actions</H3>
            <XStack space="$3" flexWrap="wrap">
              <View flex={1} minWidth={100}>
                <AnimatedButton
                  variant="gradient"
                  fullWidth
                  icon={<FileText size={18} color="#fff" />}
                >
                  New Post
                </AnimatedButton>
              </View>
              <View flex={1} minWidth={100}>
                <AnimatedButton
                  variant="secondary"
                  fullWidth
                  icon={<Mail size={18} color={theme.accent.val} />}
                >
                  Send Email
                </AnimatedButton>
              </View>
              <View flex={1} minWidth={100}>
                <AnimatedButton
                  variant="outline"
                  fullWidth
                  icon={<Users size={18} color={theme.primary.val} />}
                >
                  Add Contact
                </AnimatedButton>
              </View>
            </XStack>
          </YStack>
        </YStack>
      </RNScrollView>
    </View>
  );
}
