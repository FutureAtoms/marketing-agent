import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Text, YStack, XStack, ScrollView, useTheme } from 'tamagui';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, endOfMonth, isSameDay, parseISO } from 'date-fns';

import { AnimatedCard, AnimatedButton } from '../ui';
import { borderRadius } from '../../lib/design-tokens';
import { useScheduledPosts } from '../../hooks/useSocial';
import type { SocialPost, SocialPlatform } from '../../types/social';

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

interface ContentCalendarProps {
  onSelectPost?: (post: SocialPost) => void;
  onCreatePost?: (date: Date) => void;
}

export function ContentCalendar({
  onSelectPost,
  onCreatePost,
}: ContentCalendarProps) {
  const theme = useTheme();
  const primaryColor = theme.primary?.val || '#0F6CBD';
  const textMutedColor = theme.textMuted?.val || '#6B6B6B';
  const textColor = theme.color?.val || '#1A1A1A';
  const borderColor = theme.borderColor?.val || '#E0E0E0';
  const backgroundColor = theme.background?.val || '#FFFFFF';
  const successColor = theme.success?.val || '#107C10';
  const errorColor = theme.error?.val || '#C42B1C';
  const successBgColor = theme.successBackground?.val || '#DFF6DD';
  const errorBgColor = theme.errorBackground?.val || '#FDE7E9';

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch posts for the current month
  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(currentMonth);
  const { data: posts, isLoading } = useScheduledPosts(startDate, endDate);

  // Group posts by date
  const postsByDate = useMemo(() => {
    const grouped: Record<string, SocialPost[]> = {};
    posts?.forEach((post) => {
      if (post.scheduled_for) {
        const dateKey = format(parseISO(post.scheduled_for), 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(post);
      }
    });
    return grouped;
  }, [posts]);

  // Get posts for selected date
  const selectedDatePosts = useMemo(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return postsByDate[dateKey] || [];
  }, [postsByDate, selectedDate]);

  // Create marked dates for calendar
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    // Mark dates with posts
    Object.entries(postsByDate).forEach(([dateKey, datePosts]) => {
      const dots = datePosts.slice(0, 3).map((post, i) => ({
        key: `${post.id}-${i}`,
        color: post.platforms[0] ? platformColors[post.platforms[0]] : primaryColor,
      }));

      marks[dateKey] = {
        dots,
        marked: true,
      };
    });

    // Mark selected date
    const selectedKey = format(selectedDate, 'yyyy-MM-dd');
    marks[selectedKey] = {
      ...marks[selectedKey],
      selected: true,
      selectedColor: primaryColor,
    };

    return marks;
  }, [postsByDate, selectedDate, primaryColor]);

  const handleDayPress = useCallback((day: DateData) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedDate(new Date(day.timestamp));
  }, []);

  const handleMonthChange = useCallback((month: DateData) => {
    setCurrentMonth(new Date(month.timestamp));
  }, []);

  return (
    <YStack flex={1} space="$4">
      {/* Calendar */}
      <AnimatedCard>
        <Calendar
          current={format(currentMonth, 'yyyy-MM-dd')}
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          markedDates={markedDates}
          markingType="multi-dot"
          enableSwipeMonths
          theme={{
            backgroundColor: 'transparent',
            calendarBackground: 'transparent',
            textSectionTitleColor: textMutedColor,
            selectedDayBackgroundColor: primaryColor,
            selectedDayTextColor: '#fff',
            todayTextColor: primaryColor,
            dayTextColor: textColor,
            textDisabledColor: borderColor,
            dotColor: primaryColor,
            selectedDotColor: '#fff',
            arrowColor: primaryColor,
            monthTextColor: textColor,
            textDayFontWeight: '500',
            textMonthFontWeight: '600',
            textDayHeaderFontWeight: '500',
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 12,
          }}
        />
      </AnimatedCard>

      {/* Selected Date Posts */}
      <YStack space="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <Text color="$color" fontWeight="600" fontSize="$4">
            {format(selectedDate, 'EEEE, MMMM d')}
          </Text>
          <AnimatedButton
            variant="primary"
            size="sm"
            onPress={() => onCreatePost?.(selectedDate)}
            icon={<Ionicons name="add" size={16} color="#fff" />}
          >
            New Post
          </AnimatedButton>
        </XStack>

        {selectedDatePosts.length > 0 ? (
          <YStack space="$2">
            {selectedDatePosts.map((post) => (
              <ScheduledPostCard
                key={post.id}
                post={post}
                onPress={() => onSelectPost?.(post)}
              />
            ))}
          </YStack>
        ) : (
          <View
            style={[styles.emptyState, { backgroundColor }]}
          >
            <Ionicons name="calendar-outline" size={48} color={borderColor} />
            <Text color="$colorHover" fontSize="$3" marginTop="$2">
              No posts scheduled
            </Text>
            <Text color="$colorHover" fontSize="$2">
              Tap + to create a post for this day
            </Text>
          </View>
        )}
      </YStack>
    </YStack>
  );
}

// Scheduled post card component
function ScheduledPostCard({
  post,
  onPress,
}: {
  post: SocialPost;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const successColor = theme.success?.val || '#107C10';
  const errorColor = theme.error?.val || '#C42B1C';
  const textMutedColor = theme.textMuted?.val || '#6B6B6B';
  const borderColor = theme.borderColor?.val || '#E0E0E0';
  const successBgColor = theme.successBackground?.val || '#DFF6DD';
  const errorBgColor = theme.errorBackground?.val || '#FDE7E9';

  const scheduledTime = post.scheduled_for
    ? format(parseISO(post.scheduled_for), 'h:mm a')
    : '';

  return (
    <Pressable onPress={onPress}>
      <AnimatedCard variant="outlined" padding={12}>
        <XStack space="$3">
          {/* Time */}
          <YStack alignItems="center" width={50}>
            <Text color="$color" fontWeight="600" fontSize="$3">
              {scheduledTime}
            </Text>
          </YStack>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          {/* Content */}
          <YStack flex={1} space="$2">
            {/* Platforms */}
            <XStack gap="$1">
              {post.platforms.map((platform) => (
                <View
                  key={platform}
                  style={[
                    styles.platformDot,
                    { backgroundColor: platformColors[platform] },
                  ]}
                >
                  <Ionicons
                    name={platformIcons[platform] as any}
                    size={10}
                    color="#fff"
                  />
                </View>
              ))}
            </XStack>

            {/* Preview */}
            <Text
              color="$color"
              fontSize="$2"
              numberOfLines={2}
            >
              {post.content}
            </Text>

            {/* Status badge */}
            <View
              style={[
                styles.statusBadge,
                post.status === 'published' && { backgroundColor: successBgColor },
                post.status === 'failed' && { backgroundColor: errorBgColor },
              ]}
            >
              <Text
                color={
                  post.status === 'published'
                    ? successColor
                    : post.status === 'failed'
                    ? errorColor
                    : textMutedColor
                }
                fontSize={10}
                fontWeight="600"
                textTransform="uppercase"
              >
                {post.status}
              </Text>
            </View>
          </YStack>

          {/* Media indicator */}
          {post.media_urls.length > 0 && (
            <View style={styles.mediaIndicator}>
              <Ionicons name="images" size={16} color={textMutedColor} />
              <Text color="$colorHover" fontSize="$1">
                {post.media_urls.length}
              </Text>
            </View>
          )}
        </XStack>
      </AnimatedCard>
    </Pressable>
  );
}

// Week view component
export function WeekView({
  posts,
  onSelectDate,
}: {
  posts: SocialPost[];
  onSelectDate?: (date: Date) => void;
}) {
  const theme = useTheme();
  const primaryColor = theme.primary?.val || '#0F6CBD';
  const textMutedColor = theme.textMuted?.val || '#6B6B6B';
  const textColor = theme.color?.val || '#1A1A1A';

  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - today.getDay() + i);
    return date;
  });

  return (
    <XStack justifyContent="space-around" paddingVertical="$3">
      {weekDays.map((date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayPosts = posts.filter(
          (p) => p.scheduled_for && format(parseISO(p.scheduled_for), 'yyyy-MM-dd') === dateKey
        );
        const isToday = isSameDay(date, today);

        return (
          <Pressable
            key={dateKey}
            onPress={() => onSelectDate?.(date)}
          >
            <View
              style={[styles.weekDay, isToday && { backgroundColor: primaryColor }]}
            >
              <Text
                color={isToday ? '#fff' : textMutedColor}
                fontSize={10}
                fontWeight="500"
              >
                {format(date, 'EEE').toUpperCase()}
              </Text>
              <Text
                color={isToday ? '#fff' : textColor}
                fontSize={16}
                fontWeight="600"
              >
                {format(date, 'd')}
              </Text>
              {dayPosts.length > 0 && (
                <View style={[styles.postDot, { backgroundColor: primaryColor }, isToday && styles.postDotToday]} />
              )}
            </View>
          </Pressable>
        );
      })}
    </XStack>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderRadius: borderRadius.lg,
  },
  divider: {
    width: 2,
    borderRadius: 1,
    marginVertical: 4,
  },
  platformDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: '#F5F5F5',
  },
  mediaIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  weekDay: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 60,
    borderRadius: borderRadius.lg,
  },
  postDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  postDotToday: {
    backgroundColor: '#fff',
  },
});
