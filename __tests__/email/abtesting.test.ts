/**
 * A/B Testing Module Tests
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
  ABTestManager,
  type ABTest,
  type ABVariant,
  type ABTestStats,
} from '../../lib/email/abtesting';

describe('A/B Testing Module', () => {
  let abTestManager: ABTestManager;

  beforeEach(() => {
    jest.clearAllMocks();
    abTestManager = new ABTestManager();

    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    });
  });

  describe('ABTestManager.getTests', () => {
    it('should fetch all A/B tests', async () => {
      const mockTests = [
        { id: '1', name: 'Test 1', status: 'draft' },
        { id: '2', name: 'Test 2', status: 'running' },
      ];

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockTests, error: null }),
      });

      const result = await abTestManager.getTests();

      expect(mockFrom).toHaveBeenCalledWith('email_ab_tests');
      expect(result).toHaveLength(2);
    });

    it('should filter by campaign ID', async () => {
      // The query chain is: from → select → order → eq → await
      // Create a mock that properly handles the chain and eventual resolution
      const chainedMock: any = {
        select: jest.fn(),
        order: jest.fn(),
        eq: jest.fn(),
        then: jest.fn(), // Makes it awaitable
      };

      // Each method returns the chainedMock for chaining
      chainedMock.select.mockReturnValue(chainedMock);
      chainedMock.order.mockReturnValue(chainedMock);
      chainedMock.eq.mockReturnValue(chainedMock);

      // Make the final query awaitable by implementing thenable
      chainedMock.then.mockImplementation((resolve: any) => {
        resolve({ data: [], error: null });
        return Promise.resolve({ data: [], error: null });
      });

      mockFrom.mockReturnValue(chainedMock);

      await abTestManager.getTests('campaign-123');

      expect(chainedMock.eq).toHaveBeenCalledWith('campaign_id', 'campaign-123');
    });
  });

  describe('ABTestManager.getTest', () => {
    it('should fetch single test by ID', async () => {
      const mockTest = { id: '1', name: 'Test', status: 'draft' };

      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockTest, error: null }),
      });

      const result = await abTestManager.getTest('1');

      expect(result).toEqual(mockTest);
    });
  });

  describe('ABTestManager.createTest', () => {
    it('should create test with valid variant weights', async () => {
      const newTest = {
        campaign_id: 'campaign-123',
        name: 'Subject Line Test',
        status: 'draft' as const,
        test_type: 'subject' as const,
        variants: [
          { id: 'a', name: 'Variant A', weight: 50, recipients: 0, opens: 0, clicks: 0, conversions: 0, unsubscribes: 0 },
          { id: 'b', name: 'Variant B', weight: 50, recipients: 0, opens: 0, clicks: 0, conversions: 0, unsubscribes: 0 },
        ],
        winner_criteria: 'open_rate' as const,
        sample_size_percent: 20,
        auto_send_winner: true,
        winner_delay_hours: 4,
      };

      mockFrom.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: '123', ...newTest }, error: null }),
      });

      const result = await abTestManager.createTest(newTest);

      expect(result).toHaveProperty('id');
    });

    it('should reject test with invalid variant weights', async () => {
      const newTest = {
        campaign_id: 'campaign-123',
        name: 'Invalid Test',
        status: 'draft' as const,
        test_type: 'subject' as const,
        variants: [
          { id: 'a', name: 'Variant A', weight: 30, recipients: 0, opens: 0, clicks: 0, conversions: 0, unsubscribes: 0 },
          { id: 'b', name: 'Variant B', weight: 50, recipients: 0, opens: 0, clicks: 0, conversions: 0, unsubscribes: 0 },
        ],
        winner_criteria: 'open_rate' as const,
        sample_size_percent: 20,
        auto_send_winner: true,
        winner_delay_hours: 4,
      };

      const result = await abTestManager.createTest(newTest);

      expect(result).toBeNull();
    });
  });

  describe('ABTestManager.updateTest', () => {
    it('should update test', async () => {
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: '1', name: 'Updated' }, error: null }),
      });

      const result = await abTestManager.updateTest('1', { name: 'Updated' });

      expect(result?.name).toBe('Updated');
    });
  });

  describe('ABTestManager.deleteTest', () => {
    it('should delete test', async () => {
      mockFrom.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      const result = await abTestManager.deleteTest('1');

      expect(result).toBe(true);
    });
  });

  describe('ABTestManager.startTest', () => {
    it('should start test in draft status', async () => {
      const mockTest = { id: '1', status: 'draft' };

      // First call for getTest
      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockTest, error: null }),
      });

      // Second call for updateTest
      mockFrom.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { ...mockTest, status: 'running' }, error: null }),
      });

      const result = await abTestManager.startTest('1');

      expect(result?.status).toBe('running');
    });

    it('should not start test not in draft status', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: '1', status: 'running' }, error: null }),
      });

      const result = await abTestManager.startTest('1');

      expect(result).toBeNull();
    });
  });

  describe('ABTestManager.calculateStats', () => {
    it('should calculate variant statistics', () => {
      const test: ABTest = {
        id: '1',
        campaign_id: 'campaign-123',
        name: 'Test',
        status: 'running',
        test_type: 'subject',
        variants: [
          { id: 'a', name: 'A', weight: 50, recipients: 1000, opens: 200, clicks: 50, conversions: 10, unsubscribes: 5 },
          { id: 'b', name: 'B', weight: 50, recipients: 1000, opens: 300, clicks: 80, conversions: 15, unsubscribes: 3 },
        ],
        winner_criteria: 'open_rate',
        sample_size_percent: 20,
        auto_send_winner: true,
        winner_delay_hours: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const stats = abTestManager.calculateStats(test);

      expect(stats.variants).toHaveLength(2);
      expect(stats.variants[0].open_rate).toBe(20);
      expect(stats.variants[1].open_rate).toBe(30);
      expect(stats.winner).toBe('b');
    });

    it('should calculate click rates correctly', () => {
      const test: ABTest = {
        id: '1',
        campaign_id: 'campaign-123',
        name: 'Test',
        status: 'running',
        test_type: 'content',
        variants: [
          { id: 'a', name: 'A', weight: 50, recipients: 500, opens: 100, clicks: 25, conversions: 5, unsubscribes: 2 },
          { id: 'b', name: 'B', weight: 50, recipients: 500, opens: 100, clicks: 50, conversions: 10, unsubscribes: 1 },
        ],
        winner_criteria: 'click_rate',
        sample_size_percent: 20,
        auto_send_winner: true,
        winner_delay_hours: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const stats = abTestManager.calculateStats(test);

      expect(stats.variants[0].click_rate).toBe(5);
      expect(stats.variants[1].click_rate).toBe(10);
      expect(stats.winner).toBe('b');
    });

    it('should handle zero recipients', () => {
      const test: ABTest = {
        id: '1',
        campaign_id: 'campaign-123',
        name: 'Test',
        status: 'draft',
        test_type: 'subject',
        variants: [
          { id: 'a', name: 'A', weight: 50, recipients: 0, opens: 0, clicks: 0, conversions: 0, unsubscribes: 0 },
          { id: 'b', name: 'B', weight: 50, recipients: 0, opens: 0, clicks: 0, conversions: 0, unsubscribes: 0 },
        ],
        winner_criteria: 'open_rate',
        sample_size_percent: 20,
        auto_send_winner: true,
        winner_delay_hours: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const stats = abTestManager.calculateStats(test);

      expect(stats.variants[0].open_rate).toBe(0);
      expect(stats.is_statistically_significant).toBe(false);
    });

    it('should determine statistical significance', () => {
      const test: ABTest = {
        id: '1',
        campaign_id: 'campaign-123',
        name: 'Test',
        status: 'running',
        test_type: 'subject',
        variants: [
          { id: 'a', name: 'A', weight: 50, recipients: 1000, opens: 100, clicks: 20, conversions: 5, unsubscribes: 2 },
          { id: 'b', name: 'B', weight: 50, recipients: 1000, opens: 200, clicks: 40, conversions: 10, unsubscribes: 1 },
        ],
        winner_criteria: 'open_rate',
        sample_size_percent: 20,
        auto_send_winner: true,
        winner_delay_hours: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const stats = abTestManager.calculateStats(test);

      // With 10% vs 20% open rate on 1000 samples each, should be significant
      expect(stats.is_statistically_significant).toBe(true);
    });

    it('should not be significant with small sample sizes', () => {
      const test: ABTest = {
        id: '1',
        campaign_id: 'campaign-123',
        name: 'Test',
        status: 'running',
        test_type: 'subject',
        variants: [
          { id: 'a', name: 'A', weight: 50, recipients: 50, opens: 10, clicks: 2, conversions: 1, unsubscribes: 0 },
          { id: 'b', name: 'B', weight: 50, recipients: 50, opens: 15, clicks: 3, conversions: 1, unsubscribes: 0 },
        ],
        winner_criteria: 'open_rate',
        sample_size_percent: 20,
        auto_send_winner: true,
        winner_delay_hours: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const stats = abTestManager.calculateStats(test);

      expect(stats.is_statistically_significant).toBe(false);
    });
  });

  describe('ABTestManager.selectWinner', () => {
    it('should select winner and complete test', async () => {
      const mockTest = { id: '1', status: 'running', variants: [] };

      mockFrom.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockTest, error: null }),
      });

      mockFrom.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockTest, status: 'completed', winning_variant_id: 'a' },
          error: null
        }),
      });

      const result = await abTestManager.selectWinner('1', 'a');

      expect(result?.status).toBe('completed');
      expect(result?.winning_variant_id).toBe('a');
    });

    it('should not select winner if test not running', async () => {
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: '1', status: 'draft' }, error: null }),
      });

      const result = await abTestManager.selectWinner('1', 'a');

      expect(result).toBeNull();
    });
  });

  describe('ABTestManager.cancelTest', () => {
    it('should cancel test', async () => {
      mockFrom.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: '1', status: 'cancelled' }, error: null }),
      });

      const result = await abTestManager.cancelTest('1');

      expect(result?.status).toBe('cancelled');
    });
  });

  describe('ABTestManager.createDefaultVariants', () => {
    it('should create two variants with 50/50 split', () => {
      const variants = abTestManager.createDefaultVariants('subject');

      expect(variants).toHaveLength(2);
      expect(variants[0].weight).toBe(50);
      expect(variants[1].weight).toBe(50);
      expect(variants[0].name).toContain('Control');
    });

    it('should initialize stats to zero', () => {
      const variants = abTestManager.createDefaultVariants('content');

      variants.forEach(v => {
        expect(v.recipients).toBe(0);
        expect(v.opens).toBe(0);
        expect(v.clicks).toBe(0);
        expect(v.conversions).toBe(0);
        expect(v.unsubscribes).toBe(0);
      });
    });
  });

  describe('ABTestManager.getRecommendedSampleSize', () => {
    it('should calculate sample size for given parameters', () => {
      const sampleSize = abTestManager.getRecommendedSampleSize(0.20, 0.02);

      expect(sampleSize).toBeGreaterThan(0);
      expect(Number.isInteger(sampleSize)).toBe(true);
    });

    it('should return larger sample for smaller effect size', () => {
      const smallEffect = abTestManager.getRecommendedSampleSize(0.20, 0.01);
      const largeEffect = abTestManager.getRecommendedSampleSize(0.20, 0.05);

      expect(smallEffect).toBeGreaterThan(largeEffect);
    });

    it('should handle custom power and significance', () => {
      const defaultPower = abTestManager.getRecommendedSampleSize(0.20, 0.02);
      const highPower = abTestManager.getRecommendedSampleSize(0.20, 0.02, 0.9, 0.05);

      // Both should return positive sample sizes
      expect(highPower).toBeGreaterThan(0);
      expect(defaultPower).toBeGreaterThan(0);
      // Higher power typically requires same or more samples
      expect(highPower).toBeGreaterThanOrEqual(defaultPower);
    });
  });
});
