import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useOrgStore } from '../stores/orgStore';
import {
  startOfDay,
  endOfDay,
  subDays,
  subMonths,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from 'date-fns';

export type DateRange = '7d' | '30d' | '90d' | '12m' | 'custom';
export type Granularity = 'day' | 'week' | 'month';

export interface DateRangeValue {
  start: Date;
  end: Date;
  granularity: Granularity;
}

export function getDateRange(range: DateRange, customStart?: Date, customEnd?: Date): DateRangeValue {
  const end = endOfDay(new Date());
  let start: Date;
  let granularity: Granularity;

  switch (range) {
    case '7d':
      start = startOfDay(subDays(new Date(), 7));
      granularity = 'day';
      break;
    case '30d':
      start = startOfDay(subDays(new Date(), 30));
      granularity = 'day';
      break;
    case '90d':
      start = startOfDay(subDays(new Date(), 90));
      granularity = 'week';
      break;
    case '12m':
      start = startOfDay(subMonths(new Date(), 12));
      granularity = 'month';
      break;
    case 'custom':
      start = customStart ? startOfDay(customStart) : startOfDay(subDays(new Date(), 30));
      const customEndDate = customEnd ? endOfDay(customEnd) : end;
      const daysDiff = Math.ceil((customEndDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      granularity = daysDiff > 90 ? 'month' : daysDiff > 14 ? 'week' : 'day';
      return { start, end: customEndDate, granularity };
    default:
      start = startOfDay(subDays(new Date(), 30));
      granularity = 'day';
  }

  return { start, end, granularity };
}

// Generate date buckets for aggregation
export function generateDateBuckets(
  start: Date,
  end: Date,
  granularity: Granularity
): Date[] {
  switch (granularity) {
    case 'day':
      return eachDayOfInterval({ start, end });
    case 'week':
      return eachWeekOfInterval({ start, end });
    case 'month':
      return eachMonthOfInterval({ start, end });
  }
}

// Format date for display based on granularity
export function formatDateLabel(date: Date, granularity: Granularity): string {
  switch (granularity) {
    case 'day':
      return format(date, 'MMM d');
    case 'week':
      return format(date, 'MMM d');
    case 'month':
      return format(date, 'MMM yyyy');
  }
}

// Overview stats hook
export function useOverviewStats(dateRange: DateRange = '30d') {
  const { currentOrg } = useOrgStore();
  const { start, end } = getDateRange(dateRange);

  return useQuery({
    queryKey: ['analytics', 'overview', currentOrg?.id || 'demo', dateRange],
    queryFn: async () => {
      // Allow demo data when no org is set (for development/testing)

      // In production, these would be real Supabase queries
      // For now, we'll generate realistic mock data
      const previousStart = subDays(start, end.getTime() - start.getTime());

      // Mock data based on date range
      const multiplier = dateRange === '7d' ? 1 : dateRange === '30d' ? 4 : dateRange === '90d' ? 12 : 52;

      const current = {
        visitors: Math.floor(3200 * multiplier + Math.random() * 500 * multiplier),
        pageViews: Math.floor(8500 * multiplier + Math.random() * 1000 * multiplier),
        leads: Math.floor(210 * multiplier + Math.random() * 50 * multiplier),
        conversions: Math.floor(45 * multiplier + Math.random() * 15 * multiplier),
        emailsSent: Math.floor(1200 * multiplier + Math.random() * 300 * multiplier),
        socialPosts: Math.floor(28 * multiplier + Math.random() * 10 * multiplier),
        revenue: Math.floor(12500 * multiplier + Math.random() * 3000 * multiplier),
      };

      const previous = {
        visitors: Math.floor(current.visitors * (0.85 + Math.random() * 0.2)),
        pageViews: Math.floor(current.pageViews * (0.85 + Math.random() * 0.2)),
        leads: Math.floor(current.leads * (0.85 + Math.random() * 0.2)),
        conversions: Math.floor(current.conversions * (0.85 + Math.random() * 0.2)),
        emailsSent: Math.floor(current.emailsSent * (0.9 + Math.random() * 0.15)),
        socialPosts: Math.floor(current.socialPosts * (0.9 + Math.random() * 0.15)),
        revenue: Math.floor(current.revenue * (0.85 + Math.random() * 0.2)),
      };

      const calculateChange = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev) * 100;
      };

      return {
        current,
        previous,
        changes: {
          visitors: calculateChange(current.visitors, previous.visitors),
          pageViews: calculateChange(current.pageViews, previous.pageViews),
          leads: calculateChange(current.leads, previous.leads),
          conversions: calculateChange(current.conversions, previous.conversions),
          emailsSent: calculateChange(current.emailsSent, previous.emailsSent),
          socialPosts: calculateChange(current.socialPosts, previous.socialPosts),
          revenue: calculateChange(current.revenue, previous.revenue),
        },
        conversionRate: (current.conversions / current.leads) * 100,
        avgOrderValue: current.revenue / current.conversions,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Traffic over time hook
export function useTrafficData(dateRange: DateRange = '30d') {
  const { currentOrg } = useOrgStore();
  const { start, end, granularity } = getDateRange(dateRange);

  return useQuery({
    queryKey: ['analytics', 'traffic', currentOrg?.id || 'demo', dateRange],
    queryFn: async () => {
      const buckets = generateDateBuckets(start, end, granularity);

      return buckets.map((date) => ({
        x: formatDateLabel(date, granularity),
        y: Math.floor(800 + Math.random() * 400),
        date,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Traffic sources hook
export function useTrafficSources(dateRange: DateRange = '30d') {
  const { currentOrg } = useOrgStore();

  return useQuery({
    queryKey: ['analytics', 'sources', currentOrg?.id || 'demo', dateRange],
    queryFn: async () => {
      return [
        { x: 'Organic Search', y: 4521, color: '#6366f1' },
        { x: 'Direct', y: 2847, color: '#10b981' },
        { x: 'Social', y: 1923, color: '#f59e0b' },
        { x: 'Email', y: 1456, color: '#ec4899' },
        { x: 'Referral', y: 892, color: '#3b82f6' },
        { x: 'Paid Ads', y: 678, color: '#8b5cf6' },
      ];
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Channel performance hook
export function useChannelPerformance(dateRange: DateRange = '30d') {
  const { currentOrg } = useOrgStore();
  const { start, end, granularity } = getDateRange(dateRange);

  return useQuery({
    queryKey: ['analytics', 'channels', currentOrg?.id || 'demo', dateRange],
    queryFn: async () => {
      const buckets = generateDateBuckets(start, end, granularity);

      return [
        {
          name: 'Email',
          color: '#6366f1',
          data: buckets.map((date) => ({
            x: formatDateLabel(date, granularity),
            y: Math.floor(200 + Math.random() * 150),
          })),
        },
        {
          name: 'Social',
          color: '#10b981',
          data: buckets.map((date) => ({
            x: formatDateLabel(date, granularity),
            y: Math.floor(150 + Math.random() * 100),
          })),
        },
        {
          name: 'Organic',
          color: '#f59e0b',
          data: buckets.map((date) => ({
            x: formatDateLabel(date, granularity),
            y: Math.floor(300 + Math.random() * 200),
          })),
        },
      ];
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Top pages hook
export function useTopPages(dateRange: DateRange = '30d', limit: number = 5) {
  const { currentOrg } = useOrgStore();

  return useQuery({
    queryKey: ['analytics', 'topPages', currentOrg?.id || 'demo', dateRange, limit],
    queryFn: async () => {
      return [
        { page: '/pricing', views: 4521, conversions: 234, bounceRate: 32.5 },
        { page: '/features', views: 3847, conversions: 189, bounceRate: 28.3 },
        { page: '/blog/ai-marketing', views: 2923, conversions: 145, bounceRate: 45.2 },
        { page: '/demo', views: 2456, conversions: 312, bounceRate: 18.7 },
        { page: '/about', views: 1892, conversions: 67, bounceRate: 52.1 },
      ].slice(0, limit);
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Email performance hook
export function useEmailPerformance(dateRange: DateRange = '30d') {
  const { currentOrg } = useOrgStore();

  return useQuery({
    queryKey: ['analytics', 'email', currentOrg?.id || 'demo', dateRange],
    queryFn: async () => {
      return {
        sent: 12847,
        delivered: 12534,
        opened: 5321,
        clicked: 1845,
        bounced: 213,
        unsubscribed: 45,
        openRate: 42.5,
        clickRate: 14.7,
        bounceRate: 1.7,
        unsubscribeRate: 0.4,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Social performance hook
export function useSocialPerformance(dateRange: DateRange = '30d') {
  const { currentOrg } = useOrgStore();

  return useQuery({
    queryKey: ['analytics', 'social', currentOrg?.id || 'demo', dateRange],
    queryFn: async () => {
      return {
        totalPosts: 84,
        totalEngagement: 15847,
        totalReach: 125000,
        followerGrowth: 1234,
        platforms: [
          { name: 'Twitter', posts: 32, engagement: 5421, reach: 45000, followers: 12500 },
          { name: 'LinkedIn', posts: 28, engagement: 7823, reach: 52000, followers: 8700 },
          { name: 'Facebook', posts: 12, engagement: 1845, reach: 18000, followers: 5200 },
          { name: 'Instagram', posts: 12, engagement: 758, reach: 10000, followers: 3100 },
        ],
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}
