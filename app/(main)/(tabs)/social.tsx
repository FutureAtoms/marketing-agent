import { useState, useCallback } from 'react';
import { ScrollView as RNScrollView, RefreshControl, Platform, Modal } from 'react-native';
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
import { Ionicons } from '@expo/vector-icons';

import {
  AnimatedButton,
  AnimatedCard,
  AnimatedTabs,
  GlassCard,
  Skeleton,
  useToast,
} from '../../../components/ui';
import {
  PostComposer,
  ContentCalendar,
  PlatformOverview,
  EngagementComparison,
  TopPostsWidget,
} from '../../../components/social';
import { useSocialPosts, useSocialAccounts } from '../../../hooks/useSocial';
import type { SocialPost, SocialPlatform } from '../../../types/social';

type TabKey = 'compose' | 'calendar' | 'analytics';

export default function SocialScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('compose');
  const [showComposer, setShowComposer] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);

  const { data: accounts, isLoading: accountsLoading, refetch: refetchAccounts } = useSocialAccounts();
  const { data: recentPosts, isLoading: postsLoading, refetch: refetchPosts } = useSocialPosts({ limit: 5 });
  const { data: scheduledPosts, refetch: refetchScheduled } = useSocialPosts({ status: 'scheduled', limit: 10 });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await Promise.all([refetchAccounts(), refetchPosts(), refetchScheduled()]);
    setRefreshing(false);
    showToast({
      type: 'success',
      title: 'Refreshed',
      duration: 1500,
    });
  }, [refetchAccounts, refetchPosts, refetchScheduled, showToast]);

  const handleSelectPost = useCallback((post: SocialPost) => {
    setSelectedPost(post);
    setShowComposer(true);
  }, []);

  const handleCreatePost = useCallback((date?: Date) => {
    setSelectedPost(null);
    setShowComposer(true);
  }, []);

  const tabs = [
    { key: 'compose', label: 'Compose', icon: <Ionicons name="create-outline" size={18} color={activeTab === 'compose' ? '#fff' : theme.textMuted.val} /> },
    { key: 'calendar', label: 'Calendar', icon: <Ionicons name="calendar-outline" size={18} color={activeTab === 'calendar' ? '#fff' : theme.textMuted.val} /> },
    { key: 'analytics', label: 'Analytics', icon: <Ionicons name="analytics-outline" size={18} color={activeTab === 'analytics' ? '#fff' : theme.textMuted.val} /> },
  ];

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
          <XStack justifyContent="space-between" alignItems="flex-start">
            <YStack space="$1">
              <H2 color="$color">Social Media</H2>
              <Text color="$colorHover" fontSize="$3">
                Create and schedule across platforms
              </Text>
            </YStack>
            <AnimatedButton
              variant="gradient"
              size="sm"
              onPress={() => handleCreatePost()}
              icon={<Ionicons name="add" size={18} color="#fff" />}
            >
              New Post
            </AnimatedButton>
          </XStack>

          {/* Tab Navigation */}
          <AnimatedTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(key) => setActiveTab(key as TabKey)}
            variant="pill"
          />

          {/* Tab Content */}
          {activeTab === 'compose' && (
            <YStack space="$4">
              {/* Quick Stats */}
              <XStack space="$3">
                <View flex={1}>
                  <GlassCard padding={16}>
                    <XStack alignItems="center" space="$2">
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${theme.primary.val}15`, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="calendar" size={20} color={theme.primary.val} />
                      </View>
                      <YStack>
                        <Text color="$color" fontWeight="700" fontSize="$5">
                          {scheduledPosts?.length || 0}
                        </Text>
                        <Text color="$colorHover" fontSize="$2">Scheduled</Text>
                      </YStack>
                    </XStack>
                  </GlassCard>
                </View>
                <View flex={1}>
                  <GlassCard padding={16}>
                    <XStack alignItems="center" space="$2">
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${theme.accent.val}15`, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="checkmark-circle" size={20} color={theme.accent.val} />
                      </View>
                      <YStack>
                        <Text color="$color" fontWeight="700" fontSize="$5">
                          {accounts?.length || 0}
                        </Text>
                        <Text color="$colorHover" fontSize="$2">Connected</Text>
                      </YStack>
                    </XStack>
                  </GlassCard>
                </View>
              </XStack>

              {/* Connected Platforms */}
              <YStack space="$3">
                <XStack justifyContent="space-between" alignItems="center">
                  <H3 color="$color">Connected Accounts</H3>
                  <AnimatedButton variant="ghost" size="sm">
                    <Ionicons name="add-circle-outline" size={18} color={theme.primary.val} />
                    Connect
                  </AnimatedButton>
                </XStack>
                <PlatformOverview />
              </YStack>

              {/* Recent Posts */}
              <YStack space="$3">
                <XStack justifyContent="space-between" alignItems="center">
                  <H3 color="$color">Recent Posts</H3>
                  <AnimatedButton variant="ghost" size="sm">
                    View All
                  </AnimatedButton>
                </XStack>

                {postsLoading ? (
                  <YStack space="$2">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} height={80} />
                    ))}
                  </YStack>
                ) : recentPosts && recentPosts.length > 0 ? (
                  <YStack space="$2">
                    {recentPosts.map((post) => (
                      <AnimatedCard
                        key={post.id}
                        variant="outlined"
                        padding={12}
                        onPress={() => handleSelectPost(post)}
                      >
                        <XStack space="$3">
                          <YStack flex={1}>
                            <Text color="$color" numberOfLines={2} fontSize="$3">
                              {post.content}
                            </Text>
                            <XStack marginTop="$2" space="$2" alignItems="center">
                              {post.platforms.map((platform) => (
                                <Ionicons
                                  key={platform}
                                  name={`logo-${platform}` as any}
                                  size={14}
                                  color={theme.textMuted.val}
                                />
                              ))}
                              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.borderColor.val }} />
                              <Text color="$colorHover" fontSize="$1">
                                {post.status}
                              </Text>
                            </XStack>
                          </YStack>
                          {post.media_urls.length > 0 && (
                            <View style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: theme.backgroundHover.val, alignItems: 'center', justifyContent: 'center' }}>
                              <Ionicons name="image" size={20} color={theme.textMuted.val} />
                            </View>
                          )}
                        </XStack>
                      </AnimatedCard>
                    ))}
                  </YStack>
                ) : (
                  <AnimatedCard>
                    <YStack alignItems="center" padding="$6" space="$2">
                      <Ionicons name="document-text-outline" size={40} color={theme.borderColor.val} />
                      <Text color="$textMuted">No posts yet</Text>
                      <AnimatedButton
                        variant="primary"
                        size="sm"
                        onPress={() => handleCreatePost()}
                      >
                        Create Your First Post
                      </AnimatedButton>
                    </YStack>
                  </AnimatedCard>
                )}
              </YStack>
            </YStack>
          )}

          {activeTab === 'calendar' && (
            <ContentCalendar
              onSelectPost={handleSelectPost}
              onCreatePost={handleCreatePost}
            />
          )}

          {activeTab === 'analytics' && (
            <YStack space="$4">
              <EngagementComparison />

              <TopPostsWidget />

              <AnimatedCard>
                <YStack space="$3">
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text color="$color" fontWeight="600" fontSize="$4">
                      Best Posting Times
                    </Text>
                    <Ionicons name="time-outline" size={20} color={theme.textMuted.val} />
                  </XStack>
                  <YStack space="$2">
                    {[
                      { day: 'Tuesday', times: ['9:00 AM', '12:00 PM'] },
                      { day: 'Wednesday', times: ['10:00 AM', '2:00 PM'] },
                      { day: 'Thursday', times: ['9:00 AM', '5:00 PM'] },
                    ].map((item) => (
                      <XStack key={item.day} justifyContent="space-between" alignItems="center" paddingVertical="$2">
                        <Text color="$color" fontSize="$3" fontWeight="500">
                          {item.day}
                        </Text>
                        <XStack space="$2">
                          {item.times.map((time) => (
                            <View key={time} style={{ backgroundColor: `${theme.primary.val}15`, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                              <Text color="$primary" fontSize={11} fontWeight="600">
                                {time}
                              </Text>
                            </View>
                          ))}
                        </XStack>
                      </XStack>
                    ))}
                  </YStack>
                </YStack>
              </AnimatedCard>
            </YStack>
          )}
        </YStack>
      </RNScrollView>

      {/* Post Composer Modal */}
      <Modal
        visible={showComposer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowComposer(false)}
      >
        <View flex={1} backgroundColor="$background" paddingTop={insets.top}>
          <XStack justifyContent="space-between" alignItems="center" padding="$4" borderBottomWidth={1} borderBottomColor="$borderColor">
            <AnimatedButton variant="ghost" size="sm" onPress={() => setShowComposer(false)}>
              Cancel
            </AnimatedButton>
            <Text color="$color" fontWeight="600" fontSize="$4">
              {selectedPost ? 'Edit Post' : 'New Post'}
            </Text>
            <View width={60} />
          </XStack>
          <PostComposer
            onClose={() => setShowComposer(false)}
            onPostCreated={() => {
              refetchPosts();
              refetchScheduled();
            }}
          />
        </View>
      </Modal>
    </View>
  );
}
