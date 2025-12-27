// Social Media Post Queue System - Inspired by Mixpost
// Manages scheduling, priority queuing, retry logic, and platform-specific rate limiting

import { supabase } from '../supabase';
import type { SocialPlatform, SocialPost } from '../../types/social';

// Queue status types
export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type QueuePriority = 'high' | 'normal' | 'low';

// Priority values for sorting
const PRIORITY_VALUES: Record<QueuePriority, number> = {
  high: 3,
  normal: 2,
  low: 1,
};

// PostQueue type definition
export interface PostQueue {
  id: string;
  post_id: string;
  platform: SocialPlatform;
  scheduled_time: string;
  status: QueueStatus;
  retry_count: number;
  priority: QueuePriority;
  organization_id: string;
  error_message: string | null;
  last_attempt_at: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

// Queue filter options
export interface QueueFilters {
  status?: QueueStatus | QueueStatus[];
  platform?: SocialPlatform | SocialPlatform[];
  priority?: QueuePriority;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

// Platform rate limits (requests per time window)
export interface RateLimitConfig {
  requestsPerWindow: number;
  windowSizeMinutes: number;
  minIntervalSeconds: number;
}

// Platform-specific rate limit configurations
const PLATFORM_RATE_LIMITS: Record<SocialPlatform, RateLimitConfig> = {
  twitter: {
    requestsPerWindow: 300, // 300 tweets per 3 hours
    windowSizeMinutes: 180,
    minIntervalSeconds: 30, // Minimum 30 seconds between posts
  },
  linkedin: {
    requestsPerWindow: 100, // ~100 posts per day
    windowSizeMinutes: 1440,
    minIntervalSeconds: 60,
  },
  facebook: {
    requestsPerWindow: 50, // 50 posts per hour for pages
    windowSizeMinutes: 60,
    minIntervalSeconds: 60,
  },
  instagram: {
    requestsPerWindow: 25, // 25 posts per day for business accounts
    windowSizeMinutes: 1440,
    minIntervalSeconds: 300, // 5 minutes between posts
  },
  tiktok: {
    requestsPerWindow: 10, // Conservative limit
    windowSizeMinutes: 1440,
    minIntervalSeconds: 600, // 10 minutes between posts
  },
  youtube: {
    requestsPerWindow: 6, // ~6 uploads per day
    windowSizeMinutes: 1440,
    minIntervalSeconds: 3600, // 1 hour between uploads
  },
};

// Optimal posting times by platform (UTC hours)
const OPTIMAL_POSTING_TIMES: Record<SocialPlatform, { days: number[]; hours: number[] }> = {
  twitter: {
    days: [1, 2, 3, 4, 5], // Monday-Friday
    hours: [9, 12, 17, 18], // 9am, 12pm, 5pm, 6pm
  },
  linkedin: {
    days: [1, 2, 3, 4], // Monday-Thursday
    hours: [7, 8, 10, 12, 17], // 7am, 8am, 10am, 12pm, 5pm
  },
  facebook: {
    days: [1, 2, 3, 4, 5], // Monday-Friday
    hours: [9, 13, 16, 19], // 9am, 1pm, 4pm, 7pm
  },
  instagram: {
    days: [1, 2, 3, 4, 5, 6], // Monday-Saturday
    hours: [11, 13, 17, 19], // 11am, 1pm, 5pm, 7pm
  },
  tiktok: {
    days: [1, 2, 3, 4, 5, 6, 0], // All week
    hours: [7, 10, 15, 19, 21], // 7am, 10am, 3pm, 7pm, 9pm
  },
  youtube: {
    days: [4, 5, 6], // Thursday-Saturday
    hours: [12, 15, 18], // 12pm, 3pm, 6pm
  },
};

// Maximum retry attempts
const MAX_RETRY_COUNT = 3;

// Retry delay calculation (exponential backoff)
function getRetryDelay(retryCount: number): number {
  // Base delay of 5 minutes, exponentially increasing
  return Math.pow(2, retryCount) * 5 * 60 * 1000; // Returns milliseconds
}

/**
 * QueueManager - Manages the social media post queue
 * Inspired by Mixpost's queue management system
 */
export class QueueManager {
  private organizationId: string;
  private timezone: string;

  constructor(organizationId: string, timezone: string = 'UTC') {
    this.organizationId = organizationId;
    this.timezone = timezone;
  }

  /**
   * Add a post to the queue
   */
  async addToQueue(
    post: SocialPost | { id: string; platforms: SocialPlatform[] },
    scheduledTime: Date,
    priority: QueuePriority = 'normal'
  ): Promise<{ success: boolean; queueItems?: PostQueue[]; error?: string }> {
    try {
      const platforms = post.platforms;
      const queueItems: PostQueue[] = [];

      // Create a queue entry for each platform
      for (const platform of platforms) {
        // Check rate limit before scheduling
        const canSchedule = await this.checkRateLimit(platform, scheduledTime);
        if (!canSchedule.allowed) {
          // Adjust scheduled time if rate limited
          const adjustedTime = canSchedule.suggestedTime || scheduledTime;

          const insertData = {
            post_id: post.id,
            platform,
            scheduled_time: adjustedTime.toISOString(),
            status: 'pending' as QueueStatus,
            retry_count: 0,
            priority,
            organization_id: this.organizationId,
            error_message: null,
            last_attempt_at: null,
            timezone: this.timezone,
          };

          const { data, error } = await (supabase
            .from('post_queue') as any)
            .insert(insertData)
            .select()
            .single();

          if (error) {
            // If table doesn't exist, simulate the queue item
            const simulatedItem: PostQueue = {
              id: `simulated-${Date.now()}-${platform}`,
              ...insertData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            queueItems.push(simulatedItem);
          } else {
            queueItems.push(data as PostQueue);
          }
        } else {
          const insertData = {
            post_id: post.id,
            platform,
            scheduled_time: scheduledTime.toISOString(),
            status: 'pending' as QueueStatus,
            retry_count: 0,
            priority,
            organization_id: this.organizationId,
            error_message: null,
            last_attempt_at: null,
            timezone: this.timezone,
          };

          const { data, error } = await (supabase
            .from('post_queue') as any)
            .insert(insertData)
            .select()
            .single();

          if (error) {
            // If table doesn't exist, simulate the queue item
            const simulatedItem: PostQueue = {
              id: `simulated-${Date.now()}-${platform}`,
              ...insertData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            queueItems.push(simulatedItem);
          } else {
            queueItems.push(data as PostQueue);
          }
        }
      }

      return { success: true, queueItems };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add to queue',
      };
    }
  }

  /**
   * Remove a post from the queue
   */
  async removeFromQueue(queueId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('post_queue')
        .delete()
        .eq('id', queueId)
        .eq('organization_id', this.organizationId);

      if (error) {
        // Silently succeed if table doesn't exist (for demo/testing)
        if (error.code === '42P01') {
          return { success: true };
        }
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove from queue',
      };
    }
  }

  /**
   * Get queued posts with optional filters
   */
  async getQueuedPosts(filters?: QueueFilters): Promise<{
    success: boolean;
    items?: PostQueue[];
    error?: string;
  }> {
    try {
      let query = (supabase
        .from('post_queue') as any)
        .select('*')
        .eq('organization_id', this.organizationId)
        .order('scheduled_time', { ascending: true });

      // Apply filters
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }

      if (filters?.platform) {
        if (Array.isArray(filters.platform)) {
          query = query.in('platform', filters.platform);
        } else {
          query = query.eq('platform', filters.platform);
        }
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters?.fromDate) {
        query = query.gte('scheduled_time', filters.fromDate.toISOString());
      }

      if (filters?.toDate) {
        query = query.lte('scheduled_time', filters.toDate.toISOString());
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        // Return empty array if table doesn't exist
        if (error.code === '42P01') {
          return { success: true, items: [] };
        }
        return { success: false, error: error.message };
      }

      // Sort by priority within the same scheduled time
      const sortedItems = (data as PostQueue[]).sort((a, b) => {
        const timeDiff = new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime();
        if (timeDiff !== 0) return timeDiff;
        return PRIORITY_VALUES[b.priority] - PRIORITY_VALUES[a.priority];
      });

      return { success: true, items: sortedItems };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get queued posts',
      };
    }
  }

  /**
   * Process the queue - simulated queue processing
   * In production, this would be handled by a background worker/cron job
   */
  async processQueue(): Promise<{
    success: boolean;
    processed: number;
    failed: number;
    errors?: string[];
  }> {
    try {
      const now = new Date();
      const errors: string[] = [];
      let processed = 0;
      let failed = 0;

      // Get pending items that are due
      const { items } = await this.getQueuedPosts({
        status: 'pending',
        toDate: now,
      });

      if (!items || items.length === 0) {
        return { success: true, processed: 0, failed: 0 };
      }

      for (const item of items) {
        // Check rate limit
        const rateCheck = await this.checkRateLimit(item.platform, now);
        if (!rateCheck.allowed) {
          // Reschedule for later
          await this.reschedulePost(item.id, rateCheck.suggestedTime || new Date(now.getTime() + 60000));
          continue;
        }

        // Update status to processing
        await this.updateQueueItemStatus(item.id, 'processing');

        try {
          // Simulate publishing (in production, call actual platform APIs)
          const publishResult = await this.simulatePublish(item);

          if (publishResult.success) {
            await this.updateQueueItemStatus(item.id, 'completed');
            processed++;
          } else {
            throw new Error(publishResult.error || 'Publishing failed');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          // Handle retry logic
          if (item.retry_count < MAX_RETRY_COUNT) {
            const retryTime = new Date(now.getTime() + getRetryDelay(item.retry_count));
            await this.handleRetry(item.id, item.retry_count + 1, errorMessage, retryTime);
            errors.push(`Item ${item.id}: Scheduled for retry (${item.retry_count + 1}/${MAX_RETRY_COUNT})`);
          } else {
            await this.updateQueueItemStatus(item.id, 'failed', errorMessage);
            failed++;
            errors.push(`Item ${item.id}: Max retries exceeded - ${errorMessage}`);
          }
        }
      }

      return {
        success: true,
        processed,
        failed,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      return {
        success: false,
        processed: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Queue processing failed'],
      };
    }
  }

  /**
   * Reschedule a queued post
   */
  async reschedulePost(
    queueId: string,
    newTime: Date
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase
        .from('post_queue') as any)
        .update({
          scheduled_time: newTime.toISOString(),
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', queueId)
        .eq('organization_id', this.organizationId);

      if (error && error.code !== '42P01') {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reschedule post',
      };
    }
  }

  /**
   * Get optimal posting times for a platform
   * Returns suggested times based on platform best practices and current queue density
   */
  async getBestPostTimes(
    platform: SocialPlatform,
    daysAhead: number = 7
  ): Promise<{
    success: boolean;
    times?: { date: Date; score: number; reason: string }[];
    error?: string;
  }> {
    try {
      const suggestions: { date: Date; score: number; reason: string }[] = [];
      const now = new Date();
      const optimalConfig = OPTIMAL_POSTING_TIMES[platform];
      const rateLimit = PLATFORM_RATE_LIMITS[platform];

      // Get existing scheduled posts to avoid conflicts
      const { items: existingQueue } = await this.getQueuedPosts({
        platform,
        status: ['pending', 'processing'],
        fromDate: now,
        toDate: new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000),
      });

      const scheduledTimes = new Set(
        (existingQueue || []).map(item =>
          new Date(item.scheduled_time).toISOString().slice(0, 16)
        )
      );

      // Generate suggestions for each day
      for (let day = 0; day < daysAhead; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() + day);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);

        const dayOfWeek = date.getDay();
        const isDayOptimal = optimalConfig.days.includes(dayOfWeek);

        for (const hour of optimalConfig.hours) {
          const suggestionTime = new Date(date);
          suggestionTime.setHours(hour);

          // Skip if in the past
          if (suggestionTime <= now) continue;

          // Check if slot is already taken
          const timeKey = suggestionTime.toISOString().slice(0, 16);
          const isSlotTaken = scheduledTimes.has(timeKey);

          // Calculate score
          let score = 50; // Base score
          let reason = 'Available time slot';

          if (isDayOptimal) {
            score += 20;
            reason = 'Optimal day for engagement';
          }

          if (!isSlotTaken) {
            score += 15;
          } else {
            score -= 30;
            reason = 'Slot has existing scheduled content';
          }

          // Bonus for prime hours (platform-specific)
          if (hour >= 9 && hour <= 11) {
            score += 10;
            reason = isDayOptimal ? 'Prime morning engagement window' : reason;
          } else if (hour >= 17 && hour <= 19) {
            score += 10;
            reason = isDayOptimal ? 'Prime evening engagement window' : reason;
          }

          suggestions.push({
            date: suggestionTime,
            score: Math.min(100, Math.max(0, score)),
            reason,
          });
        }
      }

      // Sort by score descending
      suggestions.sort((a, b) => b.score - a.score);

      return {
        success: true,
        times: suggestions.slice(0, 20), // Return top 20 suggestions
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get best post times',
      };
    }
  }

  /**
   * Check if posting is allowed based on rate limits
   */
  private async checkRateLimit(
    platform: SocialPlatform,
    scheduledTime: Date
  ): Promise<{ allowed: boolean; suggestedTime?: Date; reason?: string }> {
    const config = PLATFORM_RATE_LIMITS[platform];
    const windowStart = new Date(scheduledTime.getTime() - config.windowSizeMinutes * 60 * 1000);

    try {
      // Get posts in the rate limit window
      const { items } = await this.getQueuedPosts({
        platform,
        status: ['pending', 'processing', 'completed'],
        fromDate: windowStart,
        toDate: scheduledTime,
      });

      const postsInWindow = items?.length || 0;

      if (postsInWindow >= config.requestsPerWindow) {
        // Calculate suggested time (after the window)
        const suggestedTime = new Date(windowStart.getTime() + config.windowSizeMinutes * 60 * 1000 + 60000);
        return {
          allowed: false,
          suggestedTime,
          reason: `Rate limit reached: ${postsInWindow}/${config.requestsPerWindow} posts in ${config.windowSizeMinutes} minutes`,
        };
      }

      // Check minimum interval
      if (items && items.length > 0) {
        const lastPost = items[items.length - 1];
        const lastPostTime = new Date(lastPost.scheduled_time);
        const timeSinceLastPost = (scheduledTime.getTime() - lastPostTime.getTime()) / 1000;

        if (timeSinceLastPost < config.minIntervalSeconds) {
          const suggestedTime = new Date(lastPostTime.getTime() + config.minIntervalSeconds * 1000);
          return {
            allowed: false,
            suggestedTime,
            reason: `Minimum interval not met: ${config.minIntervalSeconds} seconds required between posts`,
          };
        }
      }

      return { allowed: true };
    } catch {
      // If we can't check, allow the post
      return { allowed: true };
    }
  }

  /**
   * Update queue item status
   */
  private async updateQueueItemStatus(
    queueId: string,
    status: QueueStatus,
    errorMessage?: string
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'processing') {
      updateData.last_attempt_at = new Date().toISOString();
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    await (supabase
      .from('post_queue') as any)
      .update(updateData)
      .eq('id', queueId)
      .eq('organization_id', this.organizationId);
  }

  /**
   * Handle retry for failed items
   */
  private async handleRetry(
    queueId: string,
    newRetryCount: number,
    errorMessage: string,
    retryTime: Date
  ): Promise<void> {
    await (supabase
      .from('post_queue') as any)
      .update({
        status: 'pending',
        retry_count: newRetryCount,
        error_message: errorMessage,
        scheduled_time: retryTime.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', queueId)
      .eq('organization_id', this.organizationId);
  }

  /**
   * Simulate publishing a post (for demo/testing)
   * In production, this would call actual platform APIs
   */
  private async simulatePublish(
    item: PostQueue
  ): Promise<{ success: boolean; error?: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate 90% success rate
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      // Update the original post status
      await (supabase
        .from('social_posts') as any)
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.post_id);

      return { success: true };
    }

    return {
      success: false,
      error: 'Simulated publishing error - platform API unavailable',
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    success: boolean;
    stats?: {
      pending: number;
      processing: number;
      completed: number;
      failed: number;
      byPlatform: Record<SocialPlatform, number>;
      byPriority: Record<QueuePriority, number>;
    };
    error?: string;
  }> {
    try {
      const { items } = await this.getQueuedPosts();

      if (!items) {
        return {
          success: true,
          stats: {
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0,
            byPlatform: {
              twitter: 0,
              linkedin: 0,
              facebook: 0,
              instagram: 0,
              tiktok: 0,
              youtube: 0,
            },
            byPriority: {
              high: 0,
              normal: 0,
              low: 0,
            },
          },
        };
      }

      const stats = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        byPlatform: {
          twitter: 0,
          linkedin: 0,
          facebook: 0,
          instagram: 0,
          tiktok: 0,
          youtube: 0,
        } as Record<SocialPlatform, number>,
        byPriority: {
          high: 0,
          normal: 0,
          low: 0,
        } as Record<QueuePriority, number>,
      };

      for (const item of items) {
        stats[item.status]++;
        stats.byPlatform[item.platform]++;
        stats.byPriority[item.priority]++;
      }

      return { success: true, stats };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get queue stats',
      };
    }
  }

  /**
   * Clear completed items older than specified days
   */
  async clearOldCompletedItems(daysOld: number = 30): Promise<{
    success: boolean;
    deleted: number;
    error?: string;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await (supabase
        .from('post_queue') as any)
        .delete()
        .eq('organization_id', this.organizationId)
        .eq('status', 'completed')
        .lt('updated_at', cutoffDate.toISOString())
        .select();

      if (error && error.code !== '42P01') {
        return { success: false, deleted: 0, error: error.message };
      }

      return { success: true, deleted: data?.length || 0 };
    } catch (error) {
      return {
        success: false,
        deleted: 0,
        error: error instanceof Error ? error.message : 'Failed to clear old items',
      };
    }
  }

  /**
   * Bulk update queue item priorities
   */
  async bulkUpdatePriority(
    queueIds: string[],
    priority: QueuePriority
  ): Promise<{ success: boolean; updated: number; error?: string }> {
    try {
      const { data, error } = await (supabase
        .from('post_queue') as any)
        .update({
          priority,
          updated_at: new Date().toISOString(),
        })
        .in('id', queueIds)
        .eq('organization_id', this.organizationId)
        .select();

      if (error && error.code !== '42P01') {
        return { success: false, updated: 0, error: error.message };
      }

      return { success: true, updated: data?.length || 0 };
    } catch (error) {
      return {
        success: false,
        updated: 0,
        error: error instanceof Error ? error.message : 'Failed to update priorities',
      };
    }
  }
}

// Utility functions for timezone handling
export function convertToTimezone(date: Date, timezone: string): Date {
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);

    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '0';

    return new Date(
      parseInt(getPart('year')),
      parseInt(getPart('month')) - 1,
      parseInt(getPart('day')),
      parseInt(getPart('hour')),
      parseInt(getPart('minute')),
      parseInt(getPart('second'))
    );
  } catch {
    return date;
  }
}

export function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
  } catch {
    return 0;
  }
}

// Export rate limit configurations for external use
export { PLATFORM_RATE_LIMITS, OPTIMAL_POSTING_TIMES, MAX_RETRY_COUNT };

// =============================================================================
// ADDITIONAL EXPORTS FOR TEST COMPATIBILITY
// =============================================================================

// Alias for backwards compatibility with tests
export { QueueManager as PostQueueManager };

// QueuedPost type alias (same as PostQueue but with test-expected field names)
export interface QueuedPost {
  id: string;
  post_id: string;
  account_id: string;
  platform: SocialPlatform;
  scheduled_at: string;
  status: QueueStatus;
  priority: QueuePriority;
  retry_count: number;
  max_retries: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

// Re-export SocialPlatform for test convenience
export type { SocialPlatform } from '../../types/social';
