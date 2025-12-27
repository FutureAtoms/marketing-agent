/**
 * Social Media Queue Module Tests
 * Tests for the QueueManager (PostQueueManager) class
 */

// Mock Supabase with inline mock factory
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Import the mocked module and get reference
import { supabase } from '../../lib/supabase';
const mockFrom = supabase.from as jest.Mock;

import {
  PostQueueManager,
  PLATFORM_RATE_LIMITS,
  OPTIMAL_POSTING_TIMES,
  convertToTimezone,
  getTimezoneOffset,
  type PostQueue,
  type QueueStatus,
  type QueuePriority,
} from '../../lib/social/queue';

// Define platform type locally for tests
type SocialPlatform = 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'youtube';

describe('Social Media Queue Module', () => {
  let queueManager: InstanceType<typeof PostQueueManager>;
  const testOrgId = 'test-org-123';

  beforeEach(() => {
    jest.clearAllMocks();
    queueManager = new PostQueueManager(testOrgId, 'UTC');

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    });
  });

  describe('PLATFORM_RATE_LIMITS', () => {
    it('should have rate limits for all platforms', () => {
      const platforms: SocialPlatform[] = ['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube'];

      platforms.forEach(platform => {
        expect(PLATFORM_RATE_LIMITS[platform]).toBeDefined();
        expect(PLATFORM_RATE_LIMITS[platform]).toHaveProperty('requestsPerWindow');
        expect(PLATFORM_RATE_LIMITS[platform]).toHaveProperty('windowSizeMinutes');
        expect(PLATFORM_RATE_LIMITS[platform]).toHaveProperty('minIntervalSeconds');
      });
    });

    it('should have reasonable rate limits', () => {
      Object.values(PLATFORM_RATE_LIMITS).forEach(limit => {
        expect(limit.requestsPerWindow).toBeGreaterThan(0);
        expect(limit.windowSizeMinutes).toBeGreaterThan(0);
        expect(limit.minIntervalSeconds).toBeGreaterThan(0);
      });
    });

    it('should have stricter limits for Instagram', () => {
      expect(PLATFORM_RATE_LIMITS.instagram.requestsPerWindow).toBeLessThan(PLATFORM_RATE_LIMITS.twitter.requestsPerWindow);
    });

    it('should have Twitter rate limit of 300 per 180 minutes', () => {
      expect(PLATFORM_RATE_LIMITS.twitter.requestsPerWindow).toBe(300);
      expect(PLATFORM_RATE_LIMITS.twitter.windowSizeMinutes).toBe(180);
    });

    it('should have appropriate minimum intervals', () => {
      // Twitter: 30 seconds
      expect(PLATFORM_RATE_LIMITS.twitter.minIntervalSeconds).toBe(30);
      // Instagram: 5 minutes (300 seconds)
      expect(PLATFORM_RATE_LIMITS.instagram.minIntervalSeconds).toBe(300);
      // YouTube: 1 hour (3600 seconds)
      expect(PLATFORM_RATE_LIMITS.youtube.minIntervalSeconds).toBe(3600);
    });
  });

  describe('OPTIMAL_POSTING_TIMES', () => {
    it('should have posting times for all platforms', () => {
      const platforms: SocialPlatform[] = ['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube'];

      platforms.forEach(platform => {
        expect(OPTIMAL_POSTING_TIMES[platform]).toBeDefined();
        expect(OPTIMAL_POSTING_TIMES[platform]).toHaveProperty('days');
        expect(OPTIMAL_POSTING_TIMES[platform]).toHaveProperty('hours');
      });
    });

    it('should have valid day values (0-6)', () => {
      Object.values(OPTIMAL_POSTING_TIMES).forEach(times => {
        times.days.forEach(day => {
          expect(day).toBeGreaterThanOrEqual(0);
          expect(day).toBeLessThanOrEqual(6);
        });
      });
    });

    it('should have valid hour values (0-23)', () => {
      Object.values(OPTIMAL_POSTING_TIMES).forEach(times => {
        times.hours.forEach(hour => {
          expect(hour).toBeGreaterThanOrEqual(0);
          expect(hour).toBeLessThanOrEqual(23);
        });
      });
    });

    it('should have LinkedIn optimal on weekdays', () => {
      // LinkedIn should focus on Monday-Thursday (1-4)
      const linkedInDays = OPTIMAL_POSTING_TIMES.linkedin.days;
      expect(linkedInDays).toContain(1); // Monday
      expect(linkedInDays).toContain(2); // Tuesday
      expect(linkedInDays).toContain(3); // Wednesday
      expect(linkedInDays).toContain(4); // Thursday
    });
  });

  describe('PostQueueManager.addToQueue', () => {
    it('should add post to queue', async () => {
      const post = {
        id: 'post-123',
        platforms: ['twitter' as SocialPlatform],
      };
      const scheduledTime = new Date();

      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'queue-1', post_id: 'post-123', status: 'pending' },
          error: null
        }),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const result = await queueManager.addToQueue(post, scheduledTime, 'normal');

      expect(result.success).toBe(true);
      expect(result.queueItems).toBeDefined();
    });

    it('should create queue entry for each platform', async () => {
      const post = {
        id: 'post-123',
        platforms: ['twitter', 'linkedin', 'facebook'] as SocialPlatform[],
      };
      const scheduledTime = new Date();

      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'queue-1', post_id: 'post-123' },
          error: null
        }),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const result = await queueManager.addToQueue(post, scheduledTime);

      expect(result.success).toBe(true);
      expect(result.queueItems?.length).toBe(3);
    });

    it('should handle database errors gracefully', async () => {
      const post = {
        id: 'post-123',
        platforms: ['twitter' as SocialPlatform],
      };

      // Simulate table not existing - should create simulated item
      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: '42P01', message: 'Table does not exist' }
        }),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const result = await queueManager.addToQueue(post, new Date());

      // Should still succeed with simulated item
      expect(result.success).toBe(true);
    });
  });

  describe('PostQueueManager.getQueuedPosts', () => {
    // Helper to create chainable mock that is also awaitable
    const createChainedMock = (resolveData: any = [], resolveError: any = null) => {
      const mock: any = {
        select: jest.fn(),
        eq: jest.fn(),
        in: jest.fn(),
        gte: jest.fn(),
        lte: jest.fn(),
        limit: jest.fn(),
        range: jest.fn(),
        order: jest.fn(),
        // Make it awaitable by implementing thenable
        then: jest.fn((resolve: any) => {
          resolve({ data: resolveData, error: resolveError });
          return Promise.resolve({ data: resolveData, error: resolveError });
        }),
      };
      // All query methods return the mock for chaining
      Object.keys(mock).forEach(key => {
        if (key !== 'then') {
          mock[key].mockReturnValue(mock);
        }
      });
      return mock;
    };

    it('should fetch queue items', async () => {
      const mockQueue = [
        { id: '1', post_id: 'post-1', status: 'pending', scheduled_time: new Date().toISOString(), priority: 'normal' },
        { id: '2', post_id: 'post-2', status: 'pending', scheduled_time: new Date().toISOString(), priority: 'high' },
      ];

      const chainedMock = createChainedMock(mockQueue);
      mockFrom.mockReturnValue(chainedMock);

      const result = await queueManager.getQueuedPosts();

      expect(result.success).toBe(true);
      expect(result.items).toHaveLength(2);
    });

    it('should handle filtering by status array', async () => {
      const chainedMock = createChainedMock([]);
      mockFrom.mockReturnValue(chainedMock);

      const result = await queueManager.getQueuedPosts({ status: ['pending', 'processing'] });

      expect(result.success).toBe(true);
      expect(result.items).toEqual([]);
    });

    it('should handle filtering by single status', async () => {
      const chainedMock = createChainedMock([]);
      mockFrom.mockReturnValue(chainedMock);

      const result = await queueManager.getQueuedPosts({ status: 'pending' });

      expect(result.success).toBe(true);
      expect(result.items).toEqual([]);
    });

    it('should handle filtering by platform', async () => {
      const chainedMock = createChainedMock([]);
      mockFrom.mockReturnValue(chainedMock);

      const result = await queueManager.getQueuedPosts({ platform: 'twitter' });

      expect(result.success).toBe(true);
      expect(result.items).toEqual([]);
    });

    it('should handle filtering by date range', async () => {
      const chainedMock = createChainedMock([]);
      mockFrom.mockReturnValue(chainedMock);

      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-01-31');

      const result = await queueManager.getQueuedPosts({ fromDate, toDate });

      expect(result.success).toBe(true);
      expect(result.items).toEqual([]);
    });

    it('should return empty array on error', async () => {
      const chainedMock = createChainedMock(null, { code: '42P01', message: 'Table does not exist' });
      mockFrom.mockReturnValue(chainedMock);

      const result = await queueManager.getQueuedPosts();

      expect(result.success).toBe(true);
      expect(result.items).toEqual([]);
    });
  });

  describe('PostQueueManager.removeFromQueue', () => {
    it('should remove item from queue', async () => {
      const chainedMock: any = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn(),
      };
      // First eq returns chainedMock, second eq resolves the promise
      chainedMock.eq
        .mockReturnValueOnce(chainedMock)
        .mockResolvedValueOnce({ error: null });
      mockFrom.mockReturnValue(chainedMock);

      const result = await queueManager.removeFromQueue('queue-1');

      expect(result.success).toBe(true);
    });

    it('should handle missing table gracefully', async () => {
      const chainedMock: any = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn(),
      };
      chainedMock.eq
        .mockReturnValueOnce(chainedMock)
        .mockResolvedValueOnce({ error: { code: '42P01', message: 'Table does not exist' } });
      mockFrom.mockReturnValue(chainedMock);

      const result = await queueManager.removeFromQueue('queue-1');

      expect(result.success).toBe(true);
    });
  });

  describe('PostQueueManager.reschedulePost', () => {
    it('should reschedule post to new time', async () => {
      const newTime = new Date(Date.now() + 86400000); // Tomorrow

      const chainedMock: any = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn(),
      };
      // First eq returns chainedMock, second eq resolves the promise
      chainedMock.eq
        .mockReturnValueOnce(chainedMock)
        .mockResolvedValueOnce({ error: null });
      mockFrom.mockReturnValue(chainedMock);

      const result = await queueManager.reschedulePost('queue-1', newTime);

      expect(result.success).toBe(true);
    });
  });

  describe('PostQueueManager.getQueueStats', () => {
    it('should return queue statistics', async () => {
      const mockQueue = [
        { status: 'pending', platform: 'twitter', priority: 'normal', scheduled_time: new Date().toISOString() },
        { status: 'pending', platform: 'twitter', priority: 'high', scheduled_time: new Date().toISOString() },
        { status: 'completed', platform: 'linkedin', priority: 'normal', scheduled_time: new Date().toISOString() },
        { status: 'failed', platform: 'instagram', priority: 'low', scheduled_time: new Date().toISOString() },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockQueue, error: null }),
      });

      const result = await queueManager.getQueueStats();

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats?.pending).toBe(2);
      expect(result.stats?.completed).toBe(1);
      expect(result.stats?.failed).toBe(1);
      expect(result.stats?.byPlatform.twitter).toBe(2);
      expect(result.stats?.byPriority.high).toBe(1);
    });

    it('should return zero stats when queue is empty', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const result = await queueManager.getQueueStats();

      expect(result.success).toBe(true);
      expect(result.stats?.pending).toBe(0);
      expect(result.stats?.byPlatform.twitter).toBe(0);
    });
  });

  describe('PostQueueManager.getBestPostTimes', () => {
    it('should return optimal posting slots', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const result = await queueManager.getBestPostTimes('twitter', 7);

      expect(result.success).toBe(true);
      expect(result.times).toBeDefined();
      expect(result.times!.length).toBeGreaterThan(0);
      expect(result.times!.length).toBeLessThanOrEqual(20);
    });

    it('should return sorted slots by score', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const result = await queueManager.getBestPostTimes('linkedin', 3);

      expect(result.success).toBe(true);
      for (let i = 1; i < (result.times?.length || 0); i++) {
        expect(result.times![i].score).toBeLessThanOrEqual(result.times![i - 1].score);
      }
    });

    it('should include reason for each suggestion', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const result = await queueManager.getBestPostTimes('instagram', 5);

      expect(result.success).toBe(true);
      result.times?.forEach(slot => {
        expect(slot).toHaveProperty('date');
        expect(slot).toHaveProperty('score');
        expect(slot).toHaveProperty('reason');
        expect(typeof slot.reason).toBe('string');
      });
    });
  });

  describe('PostQueueManager.processQueue', () => {
    it('should process pending items', async () => {
      const mockQueue = [
        {
          id: '1',
          post_id: 'post-1',
          status: 'pending',
          platform: 'twitter',
          scheduled_time: new Date(Date.now() - 60000).toISOString(),
          retry_count: 0,
          priority: 'normal'
        },
      ];

      // Setup mock chain for getQueuedPosts
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockQueue, error: null }),
        update: jest.fn().mockReturnThis(),
      });

      const result = await queueManager.processQueue();

      expect(result.success).toBe(true);
      expect(typeof result.processed).toBe('number');
      expect(typeof result.failed).toBe('number');
    });

    it('should return zero counts when queue is empty', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const result = await queueManager.processQueue();

      expect(result.success).toBe(true);
      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe('PostQueueManager.clearOldCompletedItems', () => {
    it('should remove completed posts older than specified days', async () => {
      mockFrom.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: [{ id: '1' }, { id: '2' }], error: null }),
      });

      const result = await queueManager.clearOldCompletedItems(7);

      expect(result.success).toBe(true);
      expect(result.deleted).toBe(2);
    });

    it('should default to 30 days', async () => {
      const ltMock = jest.fn().mockReturnThis();
      mockFrom.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        lt: ltMock,
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      await queueManager.clearOldCompletedItems();

      expect(ltMock).toHaveBeenCalled();
    });
  });

  describe('PostQueueManager.bulkUpdatePriority', () => {
    it('should update multiple items priority', async () => {
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ data: [{ id: '1' }, { id: '2' }], error: null }),
      });

      const result = await queueManager.bulkUpdatePriority(['1', '2'], 'high');

      expect(result.success).toBe(true);
      expect(result.updated).toBe(2);
    });
  });

  describe('Timezone Utilities', () => {
    it('should convert date to timezone', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const converted = convertToTimezone(date, 'America/New_York');

      expect(converted).toBeInstanceOf(Date);
    });

    it('should return original date for invalid timezone', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const converted = convertToTimezone(date, 'Invalid/Timezone');

      expect(converted).toBeInstanceOf(Date);
    });

    it('should get timezone offset', () => {
      const offset = getTimezoneOffset('America/New_York');

      expect(typeof offset).toBe('number');
    });

    it('should return 0 for invalid timezone', () => {
      const offset = getTimezoneOffset('Invalid/Timezone');

      expect(offset).toBe(0);
    });
  });

  describe('Priority Sorting', () => {
    it('should sort items by priority within same time', async () => {
      const now = new Date().toISOString();
      const mockQueue = [
        { id: '1', status: 'pending', platform: 'twitter', priority: 'low', scheduled_time: now },
        { id: '2', status: 'pending', platform: 'twitter', priority: 'high', scheduled_time: now },
        { id: '3', status: 'pending', platform: 'twitter', priority: 'normal', scheduled_time: now },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockQueue, error: null }),
      });

      const result = await queueManager.getQueuedPosts();

      expect(result.success).toBe(true);
      // High priority should come first
      expect(result.items![0].priority).toBe('high');
      expect(result.items![1].priority).toBe('normal');
      expect(result.items![2].priority).toBe('low');
    });
  });
});
