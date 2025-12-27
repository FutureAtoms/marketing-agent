import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, YStack, XStack, useTheme } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';

import { AnimatedCard, AnimatedCounter, AnimatedProgress, Skeleton } from '../ui';
import { borderRadius } from '../../lib/design-tokens';
import { usePlatformAnalytics, useSocialAccounts } from '../../hooks/useSocial';
import type { SocialPlatform, SocialAccount } from '../../types/social';

const platformIcons: Record<SocialPlatform, string> = {
  twitter: 'logo-twitter',
  linkedin: 'logo-linkedin',
  facebook: 'logo-facebook',
  instagram: 'logo-instagram',
  tiktok: 'logo-tiktok',
  youtube: 'logo-youtube',
};

const platformColors: Record<SocialPlatform, string> = {
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  facebook: '#1877F2',
  instagram: '#E4405F',
  tiktok: '#000000',
  youtube: '#FF0000',
};

const platformNames: Record<SocialPlatform, string> = {
  twitter: 'Twitter / X',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

interface PlatformCardProps {
  account: SocialAccount;
  onPress?: () => void;
}

export function PlatformCard({ account, onPress }: PlatformCardProps) {
  const theme = useTheme();
  const successColor = theme.success?.val || '#107C10';
  const textMutedColor = theme.textMuted?.val || '#6B6B6B';

  const color = platformColors[account.platform];
  const { data: analytics, isLoading } = usePlatformAnalytics(account.platform, 30);

  return (
    <Pressable onPress={onPress}>
      <AnimatedCard>
        <XStack alignItems="center" space="$3">
          {/* Platform Icon */}
          <View style={[styles.platformIcon, { backgroundColor: `${color}15` }]}>
            <Ionicons
              name={platformIcons[account.platform] as any}
              size={24}
              color={color}
            />
          </View>

          {/* Account Info */}
          <YStack flex={1}>
            <Text color="$color" fontWeight="600" fontSize="$3">
              {account.platform_name || account.platform_username}
            </Text>
            <Text color="$colorHover" fontSize="$2">
              @{account.platform_username}
            </Text>
          </YStack>

          {/* Status indicator */}
          <View
            style={[
              styles.statusDot,
              { backgroundColor: account.is_active ? successColor : textMutedColor },
            ]}
          />
        </XStack>

        {/* Stats Row */}
        <XStack marginTop="$4" justifyContent="space-around">
          <StatItem
            label="Followers"
            value={account.follower_count}
            loading={false}
          />
          <View style={styles.statDivider} />
          <StatItem
            label="Posts"
            value={analytics?.totalPosts || 0}
            loading={isLoading}
          />
          <View style={styles.statDivider} />
          <StatItem
            label="Engagement"
            value={analytics?.avgEngagementRate || 0}
            suffix="%"
            loading={isLoading}
          />
        </XStack>
      </AnimatedCard>
    </Pressable>
  );
}

function StatItem({
  label,
  value,
  suffix = '',
  loading,
}: {
  label: string;
  value: number;
  suffix?: string;
  loading: boolean;
}) {
  return (
    <YStack alignItems="center" flex={1}>
      {loading ? (
        <Skeleton width={40} height={20} />
      ) : (
        <Text color="$color" fontWeight="700" fontSize="$4">
          {typeof value === 'number' && value >= 1000
            ? `${(value / 1000).toFixed(1)}K`
            : value.toLocaleString()}
          {suffix}
        </Text>
      )}
      <Text color="$colorHover" fontSize="$1" marginTop="$1">
        {label}
      </Text>
    </YStack>
  );
}

// Overview of all platforms
export function PlatformOverview() {
  const theme = useTheme();
  const textMutedColor = theme.textMuted?.val || '#6B6B6B';
  const backgroundColor = theme.background?.val || '#FFFFFF';

  const { data: accounts, isLoading } = useSocialAccounts();

  if (isLoading) {
    return (
      <YStack space="$3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={120} borderRadius={borderRadius.xl} />
        ))}
      </YStack>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <AnimatedCard>
        <YStack alignItems="center" padding="$6" space="$3">
          <View style={[styles.emptyIcon, { backgroundColor }]}>
            <Ionicons name="share-social-outline" size={40} color={textMutedColor} />
          </View>
          <Text color="$color" fontWeight="600" fontSize="$4">
            No Connected Accounts
          </Text>
          <Text color="$colorHover" fontSize="$2" textAlign="center">
            Connect your social media accounts to start managing your content
          </Text>
        </YStack>
      </AnimatedCard>
    );
  }

  return (
    <YStack space="$3">
      {accounts.map((account) => (
        <PlatformCard key={account.id} account={account} />
      ))}
    </YStack>
  );
}

// Engagement comparison chart
export function EngagementComparison() {
  const { data: accounts } = useSocialAccounts();

  // Get analytics for each platform
  const platforms = accounts?.map((a) => a.platform) || [];
  const uniquePlatforms = [...new Set(platforms)] as SocialPlatform[];

  return (
    <AnimatedCard>
      <Text color="$color" fontWeight="600" fontSize="$4" marginBottom="$4">
        Engagement by Platform
      </Text>
      <YStack space="$3">
        {uniquePlatforms.map((platform) => (
          <PlatformEngagementBar
            key={platform}
            platform={platform}
          />
        ))}
      </YStack>
    </AnimatedCard>
  );
}

function PlatformEngagementBar({
  platform,
}: {
  platform: SocialPlatform;
}) {
  const { data: analytics, isLoading } = usePlatformAnalytics(platform, 30);
  const color = platformColors[platform];
  const engagementRate = analytics?.avgEngagementRate || 0;

  return (
    <XStack alignItems="center" space="$3">
      <Ionicons
        name={platformIcons[platform] as any}
        size={20}
        color={color}
      />
      <View style={{ flex: 1 }}>
        <XStack justifyContent="space-between" marginBottom="$1">
          <Text color="$color" fontSize="$2" fontWeight="500">
            {platformNames[platform]}
          </Text>
          {isLoading ? (
            <Skeleton width={40} height={14} />
          ) : (
            <Text color="$colorHover" fontSize="$2">
              {engagementRate.toFixed(1)}%
            </Text>
          )}
        </XStack>
        <AnimatedProgress
          value={engagementRate}
          max={10}
          color={color}
          height={6}
        />
      </View>
    </XStack>
  );
}

// Top performing posts widget
export function TopPostsWidget({ platform }: { platform?: SocialPlatform }) {
  const theme = useTheme();
  const primaryColor = theme.primary?.val || '#0F6CBD';
  const successColor = theme.success?.val || '#107C10';
  const errorColor = theme.error?.val || '#C42B1C';
  const warningColor = theme.warning?.val || '#C19C00';

  const { data: analytics } = usePlatformAnalytics(platform || 'twitter', 30);

  return (
    <AnimatedCard>
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
        <Text color="$color" fontWeight="600" fontSize="$4">
          Top Posts
        </Text>
        <Text color="$colorHover" fontSize="$2">
          Last 30 days
        </Text>
      </XStack>

      {analytics?.topPost ? (
        <YStack space="$3">
          <XStack space="$3" alignItems="flex-start">
            <View
              style={[
                styles.rankBadge,
                { backgroundColor: warningColor },
              ]}
            >
              <Ionicons name="trophy" size={14} color="#fff" />
            </View>
            <YStack flex={1}>
              <Text color="$color" fontSize="$2" numberOfLines={2}>
                Top performing post
              </Text>
              <XStack marginTop="$2" space="$3">
                <XStack alignItems="center" gap="$1">
                  <Ionicons name="heart" size={14} color={errorColor} />
                  <Text color="$colorHover" fontSize="$2">
                    {analytics.topPost.likes}
                  </Text>
                </XStack>
                <XStack alignItems="center" gap="$1">
                  <Ionicons name="chatbubble" size={14} color={primaryColor} />
                  <Text color="$colorHover" fontSize="$2">
                    {analytics.topPost.comments}
                  </Text>
                </XStack>
                <XStack alignItems="center" gap="$1">
                  <Ionicons name="share-social" size={14} color={successColor} />
                  <Text color="$colorHover" fontSize="$2">
                    {analytics.topPost.shares}
                  </Text>
                </XStack>
              </XStack>
            </YStack>
          </XStack>
        </YStack>
      ) : (
        <YStack alignItems="center" padding="$4">
          <Text color="$colorHover" fontSize="$2">
            No published posts yet
          </Text>
        </YStack>
      )}
    </AnimatedCard>
  );
}

const styles = StyleSheet.create({
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
