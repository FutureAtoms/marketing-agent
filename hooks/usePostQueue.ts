// React Hooks for Social Media Post Queue Management
// Provides easy-to-use hooks for managing the post queue system

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useOrgStore } from '../stores/orgStore';
import {
  QueueManager,
  PostQueue,
  QueueFilters,
  QueueStatus,
  QueuePriority,
  PLATFORM_RATE_LIMITS,
  OPTIMAL_POSTING_TIMES,
} from '../lib/social/queue';
import type { SocialPlatform, SocialPost } from '../types/social';

// Query keys for caching
const QUEUE_KEYS = {
  all: ['post-queue'] as const,
  list: (orgId: string, filters?: QueueFilters) => [...QUEUE_KEYS.all, 'list', orgId, filters] as const,
  stats: (orgId: string) => [...QUEUE_KEYS.all, 'stats', orgId] as const,
  bestTimes: (orgId: string, platform: SocialPlatform) =>
    [...QUEUE_KEYS.all, 'best-times', orgId, platform] as const,
};

/**
 * Internal hook to get the QueueManager instance
 */
function useQueueManagerInstance(timezone?: string) {
  const { currentOrg } = useOrgStore();

  return useMemo(() => {
    if (!currentOrg?.id) return null;
    return new QueueManager(currentOrg.id, timezone || 'UTC');
  }, [currentOrg?.id, timezone]);
}

/**
 * Hook to get all queued posts with optional filters
 * @param filters - Optional filters for the queue
 * @param options - Additional query options
 */
export function usePostQueue(
  filters?: QueueFilters,
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
    timezone?: string;
  }
) {
  const { currentOrg } = useOrgStore();
  const queueManager = useQueueManagerInstance(options?.timezone);

  return useQuery({
    queryKey: QUEUE_KEYS.list(currentOrg?.id || '', filters),
    queryFn: async () => {
      if (!queueManager) {
        return { items: [], total: 0 };
      }

      const result = await queueManager.getQueuedPosts(filters);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch queue');
      }

      return {
        items: result.items || [],
        total: result.items?.length || 0,
      };
    },
    enabled: !!currentOrg?.id && (options?.enabled !== false),
    refetchInterval: options?.refetchInterval,
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

/**
 * Hook to get queue statistics
 */
export function useQueueStats(options?: { enabled?: boolean; timezone?: string }) {
  const { currentOrg } = useOrgStore();
  const queueManager = useQueueManagerInstance(options?.timezone);

  return useQuery({
    queryKey: QUEUE_KEYS.stats(currentOrg?.id || ''),
    queryFn: async () => {
      if (!queueManager) {
        return {
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0,
          byPlatform: {} as Record<SocialPlatform, number>,
          byPriority: {} as Record<QueuePriority, number>,
        };
      }

      const result = await queueManager.getQueueStats();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch queue stats');
      }

      return result.stats!;
    },
    enabled: !!currentOrg?.id && (options?.enabled !== false),
    staleTime: 60000, // Consider data stale after 1 minute
  });
}

/**
 * Hook to get best posting times for a platform
 */
export function useBestPostTimes(
  platform: SocialPlatform,
  options?: {
    daysAhead?: number;
    enabled?: boolean;
    timezone?: string;
  }
) {
  const { currentOrg } = useOrgStore();
  const queueManager = useQueueManagerInstance(options?.timezone);

  return useQuery({
    queryKey: QUEUE_KEYS.bestTimes(currentOrg?.id || '', platform),
    queryFn: async () => {
      if (!queueManager) {
        return [];
      }

      const result = await queueManager.getBestPostTimes(platform, options?.daysAhead || 7);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch best post times');
      }

      return result.times || [];
    },
    enabled: !!currentOrg?.id && !!platform && (options?.enabled !== false),
    staleTime: 300000, // Consider data stale after 5 minutes
  });
}

/**
 * Mutation hook to add a post to the queue
 */
export function useQueuePost(options?: { timezone?: string }) {
  const queryClient = useQueryClient();
  const queueManager = useQueueManagerInstance(options?.timezone);

  return useMutation({
    mutationFn: async ({
      post,
      scheduledTime,
      priority = 'normal',
    }: {
      post: SocialPost | { id: string; platforms: SocialPlatform[] };
      scheduledTime: Date;
      priority?: QueuePriority;
    }) => {
      if (!queueManager) {
        throw new Error('No organization selected');
      }

      const result = await queueManager.addToQueue(post, scheduledTime, priority);

      if (!result.success) {
        throw new Error(result.error || 'Failed to add post to queue');
      }

      return result.queueItems;
    },
    onSuccess: () => {
      // Invalidate all queue-related queries
      queryClient.invalidateQueries({ queryKey: QUEUE_KEYS.all });
    },
    onError: (error) => {
      console.error('Failed to queue post:', error);
    },
  });
}

/**
 * Mutation hook to remove a post from the queue
 */
export function useRemoveFromQueue(options?: { timezone?: string }) {
  const queryClient = useQueryClient();
  const queueManager = useQueueManagerInstance(options?.timezone);

  return useMutation({
    mutationFn: async (queueId: string) => {
      if (!queueManager) {
        throw new Error('No organization selected');
      }

      const result = await queueManager.removeFromQueue(queueId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to remove from queue');
      }

      return queueId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUEUE_KEYS.all });
    },
  });
}

/**
 * Mutation hook to reschedule a queued post
 */
export function useReschedulePost(options?: { timezone?: string }) {
  const queryClient = useQueryClient();
  const queueManager = useQueueManagerInstance(options?.timezone);

  return useMutation({
    mutationFn: async ({
      queueId,
      newTime,
    }: {
      queueId: string;
      newTime: Date;
    }) => {
      if (!queueManager) {
        throw new Error('No organization selected');
      }

      const result = await queueManager.reschedulePost(queueId, newTime);

      if (!result.success) {
        throw new Error(result.error || 'Failed to reschedule post');
      }

      return { queueId, newTime };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUEUE_KEYS.all });
    },
  });
}

/**
 * Mutation hook to process the queue
 * Typically called by a background job, but can be triggered manually
 */
export function useProcessQueue(options?: { timezone?: string }) {
  const queryClient = useQueryClient();
  const queueManager = useQueueManagerInstance(options?.timezone);

  return useMutation({
    mutationFn: async () => {
      if (!queueManager) {
        throw new Error('No organization selected');
      }

      const result = await queueManager.processQueue();

      if (!result.success) {
        throw new Error(result.errors?.[0] || 'Failed to process queue');
      }

      return {
        processed: result.processed,
        failed: result.failed,
        errors: result.errors,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUEUE_KEYS.all });
    },
  });
}

/**
 * Mutation hook to bulk update priority
 */
export function useBulkUpdatePriority(options?: { timezone?: string }) {
  const queryClient = useQueryClient();
  const queueManager = useQueueManagerInstance(options?.timezone);

  return useMutation({
    mutationFn: async ({
      queueIds,
      priority,
    }: {
      queueIds: string[];
      priority: QueuePriority;
    }) => {
      if (!queueManager) {
        throw new Error('No organization selected');
      }

      const result = await queueManager.bulkUpdatePriority(queueIds, priority);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update priorities');
      }

      return result.updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUEUE_KEYS.all });
    },
  });
}

/**
 * Mutation hook to clear old completed items
 */
export function useClearOldItems(options?: { timezone?: string }) {
  const queryClient = useQueryClient();
  const queueManager = useQueueManagerInstance(options?.timezone);

  return useMutation({
    mutationFn: async (daysOld: number = 30) => {
      if (!queueManager) {
        throw new Error('No organization selected');
      }

      const result = await queueManager.clearOldCompletedItems(daysOld);

      if (!result.success) {
        throw new Error(result.error || 'Failed to clear old items');
      }

      return result.deleted;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUEUE_KEYS.all });
    },
  });
}

/**
 * Combined hook for queue management
 * Provides a convenient API for common queue operations
 */
export function useQueueManager(options?: {
  filters?: QueueFilters;
  refetchInterval?: number;
  timezone?: string;
}) {
  const queue = usePostQueue(options?.filters, {
    refetchInterval: options?.refetchInterval,
    timezone: options?.timezone,
  });
  const stats = useQueueStats({ timezone: options?.timezone });
  const queuePostMutation = useQueuePost({ timezone: options?.timezone });
  const removeFromQueueMutation = useRemoveFromQueue({ timezone: options?.timezone });
  const reschedulePostMutation = useReschedulePost({ timezone: options?.timezone });
  const processQueueMutation = useProcessQueue({ timezone: options?.timezone });
  const bulkUpdatePriorityMutation = useBulkUpdatePriority({ timezone: options?.timezone });
  const clearOldItemsMutation = useClearOldItems({ timezone: options?.timezone });

  const addToQueue = useCallback(
    (post: SocialPost | { id: string; platforms: SocialPlatform[] }, scheduledTime: Date, priority?: QueuePriority) => {
      return queuePostMutation.mutateAsync({ post, scheduledTime, priority });
    },
    [queuePostMutation]
  );

  const removeFromQueue = useCallback(
    (queueId: string) => {
      return removeFromQueueMutation.mutateAsync(queueId);
    },
    [removeFromQueueMutation]
  );

  const reschedule = useCallback(
    (queueId: string, newTime: Date) => {
      return reschedulePostMutation.mutateAsync({ queueId, newTime });
    },
    [reschedulePostMutation]
  );

  const processQueue = useCallback(() => {
    return processQueueMutation.mutateAsync();
  }, [processQueueMutation]);

  const updatePriority = useCallback(
    (queueIds: string[], priority: QueuePriority) => {
      return bulkUpdatePriorityMutation.mutateAsync({ queueIds, priority });
    },
    [bulkUpdatePriorityMutation]
  );

  const clearOld = useCallback(
    (daysOld: number = 30) => {
      return clearOldItemsMutation.mutateAsync(daysOld);
    },
    [clearOldItemsMutation]
  );

  return {
    // Data
    items: queue.data?.items || [],
    total: queue.data?.total || 0,
    stats: stats.data,

    // Loading states
    isLoading: queue.isLoading,
    isLoadingStats: stats.isLoading,
    isAdding: queuePostMutation.isPending,
    isRemoving: removeFromQueueMutation.isPending,
    isRescheduling: reschedulePostMutation.isPending,
    isProcessing: processQueueMutation.isPending,

    // Errors
    error: queue.error,
    statsError: stats.error,

    // Actions
    addToQueue,
    removeFromQueue,
    reschedule,
    processQueue,
    updatePriority,
    clearOld,

    // Refetch
    refetch: queue.refetch,
    refetchStats: stats.refetch,
  };
}

/**
 * Hook to get platform-specific rate limit information
 */
export function usePlatformRateLimits(platform?: SocialPlatform) {
  return useMemo(() => {
    if (!platform) {
      return PLATFORM_RATE_LIMITS;
    }
    return PLATFORM_RATE_LIMITS[platform];
  }, [platform]);
}

/**
 * Hook to get platform-specific optimal posting times
 */
export function useOptimalPostTimes(platform?: SocialPlatform) {
  return useMemo(() => {
    if (!platform) {
      return OPTIMAL_POSTING_TIMES;
    }
    return OPTIMAL_POSTING_TIMES[platform];
  }, [platform]);
}

/**
 * Utility hook to check if a time slot is available
 */
export function useTimeSlotAvailability(
  platform: SocialPlatform,
  scheduledTime: Date,
  options?: { timezone?: string }
) {
  const queue = usePostQueue(
    {
      platform,
      status: ['pending', 'processing'],
      fromDate: new Date(scheduledTime.getTime() - 60 * 60 * 1000), // 1 hour before
      toDate: new Date(scheduledTime.getTime() + 60 * 60 * 1000), // 1 hour after
    },
    { timezone: options?.timezone }
  );

  const rateLimit = PLATFORM_RATE_LIMITS[platform];

  return useMemo(() => {
    const items = queue.data?.items || [];
    const conflictingItems = items.filter(item => {
      const itemTime = new Date(item.scheduled_time);
      const timeDiff = Math.abs(itemTime.getTime() - scheduledTime.getTime()) / 1000;
      return timeDiff < rateLimit.minIntervalSeconds;
    });

    return {
      isAvailable: conflictingItems.length === 0,
      conflictingItems,
      minIntervalSeconds: rateLimit.minIntervalSeconds,
      isLoading: queue.isLoading,
    };
  }, [queue.data, scheduledTime, rateLimit.minIntervalSeconds, queue.isLoading]);
}

// Export types for external use
export type {
  PostQueue,
  QueueFilters,
  QueueStatus,
  QueuePriority,
};
