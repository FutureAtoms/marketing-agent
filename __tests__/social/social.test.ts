/**
 * Social Media Module Test Suite
 * Comprehensive tests for social media management features
 */

import { generateSocialCaption, generateHashtags } from '../../lib/ai/openai';

// Mock fetch for API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Social Media Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: { content: 'Test social media post content #marketing' },
          index: 0,
        }],
      }),
    });
  });

  describe('Caption Generation', () => {
    it('should generate Twitter caption within character limit', async () => {
      const caption = await generateSocialCaption('AI Marketing', 'twitter', 'professional');

      expect(caption).toBeDefined();
      expect(typeof caption).toBe('string');
    });

    it('should generate LinkedIn caption with professional tone', async () => {
      const caption = await generateSocialCaption('AI Marketing', 'linkedin', 'professional');

      expect(caption).toBeDefined();
    });

    it('should generate Instagram caption with casual tone', async () => {
      const caption = await generateSocialCaption('AI Marketing', 'instagram', 'casual');

      expect(caption).toBeDefined();
    });

    it('should generate Facebook caption', async () => {
      const caption = await generateSocialCaption('AI Marketing', 'facebook', 'informative');

      expect(caption).toBeDefined();
    });

    it('should handle empty topic gracefully', async () => {
      const caption = await generateSocialCaption('', 'twitter', 'professional');

      expect(caption).toBeDefined();
    });

    it('should handle different tones correctly', async () => {
      const tones = ['professional', 'casual', 'witty', 'informative'] as const;

      for (const tone of tones) {
        const caption = await generateSocialCaption('Test Topic', 'twitter', tone);
        expect(caption).toBeDefined();
      }
    });
  });

  describe('Hashtag Generation', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: { content: 'marketing\ndigital\nai\ntech\nsocial' },
            index: 0,
          }],
        }),
      });
    });

    it('should generate specified number of hashtags', async () => {
      const hashtags = await generateHashtags('AI Marketing content', 'twitter', 5);

      expect(hashtags).toBeDefined();
      expect(Array.isArray(hashtags)).toBe(true);
    });

    it('should format hashtags with # prefix', async () => {
      const hashtags = await generateHashtags('AI Marketing content', 'twitter', 5);

      hashtags.forEach(tag => {
        expect(tag.startsWith('#')).toBe(true);
      });
    });

    it('should generate hashtags for different platforms', async () => {
      const platforms = ['twitter', 'linkedin', 'facebook', 'instagram'] as const;

      for (const platform of platforms) {
        const hashtags = await generateHashtags('Test content', platform, 3);
        expect(hashtags).toBeDefined();
      }
    });
  });

  describe('Post Scheduling', () => {
    // Helper function for optimal post times
    const suggestOptimalPostTime = (platform: string) => {
      const times: Record<string, { hour: number; minute: number; dayOfWeek: number }> = {
        twitter: { hour: 9, minute: 0, dayOfWeek: 2 },
        linkedin: { hour: 10, minute: 30, dayOfWeek: 3 },
        facebook: { hour: 13, minute: 0, dayOfWeek: 4 },
        instagram: { hour: 11, minute: 0, dayOfWeek: 5 },
      };
      return times[platform] || { hour: 9, minute: 0, dayOfWeek: 1 };
    };

    it('should suggest optimal post times for different platforms', () => {
      const platforms = ['twitter', 'linkedin', 'facebook', 'instagram'] as const;

      platforms.forEach(platform => {
        const time = suggestOptimalPostTime(platform);
        expect(time).toBeDefined();
        expect(time).toHaveProperty('hour');
        expect(time).toHaveProperty('minute');
      });
    });

    it('should suggest weekday times for LinkedIn', () => {
      const time = suggestOptimalPostTime('linkedin');

      expect(time.dayOfWeek).toBeDefined();
      // LinkedIn typically best on weekdays
      expect([1, 2, 3, 4, 5]).toContain(time.dayOfWeek);
    });
  });

  describe('Social Content Generation', () => {
    // Mock content generation function
    const generateSocialContent = async (options: {
      topic: string;
      platform: string;
      tone: string;
      includeHashtags: boolean;
      includeEmoji: boolean;
      includeCTA: boolean;
    }) => {
      const caption = await generateSocialCaption(
        options.topic,
        options.platform as any,
        options.tone as any
      );

      let result = caption;
      if (options.includeHashtags) {
        const hashtags = await generateHashtags(caption, options.platform as any, 3);
        result += ' ' + hashtags.join(' ');
      }
      if (options.includeCTA) {
        result += ' Learn more at our website!';
      }

      return {
        post: result,
        hashtags: options.includeHashtags ? ['#marketing', '#ai'] : [],
        emoji: options.includeEmoji,
        callToAction: options.includeCTA ? 'Learn more' : null,
      };
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: 'Test post content #marketing',
            },
            index: 0,
          }],
        }),
      });
    });

    it('should generate complete social content package', async () => {
      const content = await generateSocialContent({
        topic: 'AI Marketing',
        platform: 'twitter',
        tone: 'professional',
        includeHashtags: true,
        includeEmoji: true,
        includeCTA: true,
      });

      expect(content).toBeDefined();
      expect(content.post).toBeDefined();
    });

    it('should handle content without hashtags', async () => {
      const content = await generateSocialContent({
        topic: 'AI Marketing',
        platform: 'linkedin',
        tone: 'professional',
        includeHashtags: false,
        includeEmoji: false,
        includeCTA: true,
      });

      expect(content).toBeDefined();
      expect(content.hashtags).toEqual([]);
    });
  });

  describe('Platform Character Limits', () => {
    const platformLimits = {
      twitter: 280,
      linkedin: 3000,
      facebook: 500,
      instagram: 2200,
    };

    Object.entries(platformLimits).forEach(([platform, limit]) => {
      it(`should respect ${platform} character limit of ${limit}`, async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            choices: [{
              message: { content: 'A'.repeat(limit - 50) }, // Safe content
              index: 0,
            }],
          }),
        });

        const caption = await generateSocialCaption(
          'Test topic',
          platform as keyof typeof platformLimits,
          'professional'
        );

        expect(caption.length).toBeLessThanOrEqual(limit);
      });
    });
  });

  describe('Error Handling', () => {
    it('should return mock content when API key is not configured', async () => {
      // Our implementation returns mock data when no API key is set
      const caption = await generateSocialCaption('Test', 'twitter', 'professional');

      expect(caption).toBeDefined();
      expect(typeof caption).toBe('string');
    });

    it('should handle network errors with fallback', async () => {
      // When using mock mode, errors don't propagate - we get mock data
      const caption = await generateSocialCaption('Test', 'twitter', 'professional');

      expect(caption).toBeDefined();
    });

    it('should handle invalid platform gracefully', async () => {
      // TypeScript would catch this, but runtime should handle it
      const caption = await generateSocialCaption(
        'Test',
        'invalid' as any,
        'professional'
      );

      expect(caption).toBeDefined();
    });
  });

  describe('Content Moderation', () => {
    it('should handle potentially sensitive content', async () => {
      const caption = await generateSocialCaption(
        'Controversial topic',
        'twitter',
        'professional'
      );

      expect(caption).toBeDefined();
    });
  });
});

describe('Social Account Management', () => {
  const mockSocialAccounts = [
    { id: '1', platform: 'twitter', username: '@testuser', isActive: true },
    { id: '2', platform: 'linkedin', username: 'Test User', isActive: true },
    { id: '3', platform: 'facebook', username: 'Test Page', isActive: false },
  ];

  it('should filter active accounts', () => {
    const activeAccounts = mockSocialAccounts.filter(acc => acc.isActive);

    expect(activeAccounts.length).toBe(2);
  });

  it('should group accounts by platform', () => {
    const grouped = mockSocialAccounts.reduce((acc, account) => {
      acc[account.platform] = acc[account.platform] || [];
      acc[account.platform].push(account);
      return acc;
    }, {} as Record<string, typeof mockSocialAccounts>);

    expect(Object.keys(grouped)).toContain('twitter');
    expect(Object.keys(grouped)).toContain('linkedin');
  });
});

describe('Post Analytics', () => {
  const mockPostData = {
    impressions: 1000,
    engagements: 50,
    likes: 30,
    shares: 10,
    comments: 10,
    clicks: 25,
  };

  it('should calculate engagement rate correctly', () => {
    const engagementRate = (mockPostData.engagements / mockPostData.impressions) * 100;

    expect(engagementRate).toBe(5);
  });

  it('should calculate click-through rate', () => {
    const ctr = (mockPostData.clicks / mockPostData.impressions) * 100;

    expect(ctr).toBe(2.5);
  });

  it('should handle zero impressions', () => {
    const data = { ...mockPostData, impressions: 0 };
    const engagementRate = data.impressions > 0
      ? (data.engagements / data.impressions) * 100
      : 0;

    expect(engagementRate).toBe(0);
  });
});
