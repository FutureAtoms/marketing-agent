/**
 * HuggingFace AI Integration Tests
 * Tests for GLM-4.7 model via HuggingFace Router
 */

// Store original env
const originalEnv = process.env;

// Mock OpenAI before importing the module
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  };
});

describe('HuggingFace AI Integration', () => {
  // Import after mocking
  let chatCompletion: typeof import('../../lib/ai/huggingface').chatCompletion;
  let generateSocialCaption: typeof import('../../lib/ai/huggingface').generateSocialCaption;
  let generateHashtags: typeof import('../../lib/ai/huggingface').generateHashtags;
  let generateEmailSubjects: typeof import('../../lib/ai/huggingface').generateEmailSubjects;
  let generateAdCopy: typeof import('../../lib/ai/huggingface').generateAdCopy;
  let analyzeSentiment: typeof import('../../lib/ai/huggingface').analyzeSentiment;
  let improveContent: typeof import('../../lib/ai/huggingface').improveContent;
  let generateBlogPost: typeof import('../../lib/ai/huggingface').generateBlogPost;
  let generateContentStrategy: typeof import('../../lib/ai/huggingface').generateContentStrategy;
  let repurposeContent: typeof import('../../lib/ai/huggingface').repurposeContent;
  let generateLandingPageCopy: typeof import('../../lib/ai/huggingface').generateLandingPageCopy;
  let generateMarketingInsights: typeof import('../../lib/ai/huggingface').generateMarketingInsights;
  let MODEL_CONFIGS: typeof import('../../lib/ai/huggingface').MODEL_CONFIGS;
  let HuggingFace: typeof import('../../lib/ai/huggingface').HuggingFace;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Set test API key
    process.env = { ...originalEnv, EXPO_PUBLIC_HUGGINGFACE_API_KEY: 'hf_test_key_12345' };

    // Re-import the module to get fresh state
    const module = require('../../lib/ai/huggingface');
    chatCompletion = module.chatCompletion;
    generateSocialCaption = module.generateSocialCaption;
    generateHashtags = module.generateHashtags;
    generateEmailSubjects = module.generateEmailSubjects;
    generateAdCopy = module.generateAdCopy;
    analyzeSentiment = module.analyzeSentiment;
    improveContent = module.improveContent;
    generateBlogPost = module.generateBlogPost;
    generateContentStrategy = module.generateContentStrategy;
    repurposeContent = module.repurposeContent;
    generateLandingPageCopy = module.generateLandingPageCopy;
    generateMarketingInsights = module.generateMarketingInsights;
    MODEL_CONFIGS = module.MODEL_CONFIGS;
    HuggingFace = module.HuggingFace;

    // Default mock response
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Test response' } }],
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('MODEL_CONFIGS', () => {
    it('should have GLM-4.7 as the primary model', () => {
      expect(MODEL_CONFIGS['glm-4-9b']).toBeDefined();
      expect(MODEL_CONFIGS['glm-4-9b'].id).toBe('zai-org/GLM-4.7:novita');
      expect(MODEL_CONFIGS['glm-4-9b'].provider).toBe('thudm');
      expect(MODEL_CONFIGS['glm-4-9b'].maxTokens).toBe(8192);
    });

    it('should have all expected model configurations', () => {
      const expectedModels = [
        'glm-4-9b',
        'claude-3-sonnet',
        'claude-3-haiku',
        'mistral-large',
        'mistral-nemo',
        'mixtral-8x7b',
        'llama-3-70b',
        'llama-3-8b',
        'gemma-2-27b',
        'command-r-plus',
      ];

      expectedModels.forEach(model => {
        expect(MODEL_CONFIGS[model as keyof typeof MODEL_CONFIGS]).toBeDefined();
      });
    });

    it('should have valid maxTokens for all models', () => {
      Object.values(MODEL_CONFIGS).forEach(config => {
        expect(config.maxTokens).toBeGreaterThan(0);
        expect(config.maxTokens).toBeLessThanOrEqual(32768);
      });
    });
  });

  describe('chatCompletion', () => {
    it('should call OpenAI API with correct parameters', async () => {
      const result = await chatCompletion([
        { role: 'user', content: 'Hello' }
      ]);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'zai-org/GLM-4.7:novita',
          messages: [{ role: 'user', content: 'Hello' }],
          temperature: 0.7,
          top_p: 0.9,
        })
      );
      expect(result).toBe('Test response');
    });

    it('should use custom model when specified', async () => {
      await chatCompletion(
        [{ role: 'user', content: 'Test' }],
        { model: 'mistral-large' }
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'mistralai/Mistral-Large-Instruct-2407',
        })
      );
    });

    it('should use custom temperature and maxTokens', async () => {
      await chatCompletion(
        [{ role: 'user', content: 'Be creative' }],
        { temperature: 0.9, maxTokens: 500 }
      );

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.9,
          max_tokens: 500,
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      mockCreate.mockRejectedValueOnce(new Error('API rate limit exceeded'));

      await expect(chatCompletion([
        { role: 'user', content: 'Test' }
      ])).rejects.toThrow('AI generation failed: API rate limit exceeded');
    });

    it('should return empty string when no content in response', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: null } }],
      });

      const result = await chatCompletion([
        { role: 'user', content: 'Test' }
      ]);

      expect(result).toBe('');
    });

    it('should return mock response when API key not configured', async () => {
      jest.resetModules();
      process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY = 'hf_your-huggingface-key-here';

      const module = require('../../lib/ai/huggingface');
      const result = await module.chatCompletion([
        { role: 'user', content: 'Generate hashtags for marketing' }
      ]);

      // Mock responses don't call the API
      expect(result).toContain('marketing');
    });
  });

  describe('generateSocialCaption', () => {
    it('should generate caption for Twitter', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Check out our new AI features! #innovation' } }],
      });

      const result = await generateSocialCaption('AI product launch', 'twitter', 'professional');

      expect(mockCreate).toHaveBeenCalled();
      expect(result).toContain('AI');
    });

    it('should generate caption for LinkedIn', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Excited to share our milestone!' } }],
      });

      await generateSocialCaption('Company milestone', 'linkedin', 'professional');

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('linkedin');
    });

    it('should generate caption for Instagram', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Behind the scenes!' } }],
      });

      await generateSocialCaption('Behind the scenes', 'instagram', 'casual');

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('instagram');
    });

    it('should support different tones', async () => {
      const tones = ['professional', 'casual', 'witty', 'informative'] as const;

      for (const tone of tones) {
        mockCreate.mockClear();
        mockCreate.mockResolvedValueOnce({
          choices: [{ message: { content: 'Test response' } }],
        });

        await generateSocialCaption('Test topic', 'twitter', tone);

        const callArgs = mockCreate.mock.calls[0][0];
        expect(callArgs.messages[0].content).toContain(tone);
      }
    });
  });

  describe('generateHashtags', () => {
    it('should return array of hashtags', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'marketing\ndigital\ntech\ngrowth\nsuccess' } }],
      });

      const result = await generateHashtags('AI marketing automation', 'twitter', 5);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
      result.forEach(tag => {
        expect(tag.startsWith('#')).toBe(true);
      });
    });

    it('should filter empty lines', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'marketing\n\ndigital\n\ntech' } }],
      });

      const result = await generateHashtags('Test content', 'instagram', 3);

      expect(result.length).toBe(3);
      result.forEach(tag => {
        expect(tag).not.toBe('#');
      });
    });
  });

  describe('generateEmailSubjects', () => {
    it('should return array of subject lines', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Unlock Your Potential\nDon\'t Miss Out\nExclusive Offer Inside\nLast Chance\nYour Results Are In' } }],
      });

      const result = await generateEmailSubjects('Newsletter about AI updates', 5);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
    });
  });

  describe('generateAdCopy', () => {
    it('should return structured ad copy object', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              headline: 'Transform Your Business',
              description: 'AI-powered solutions for growth',
              cta: 'Get Started',
            })
          }
        }],
      });

      const result = await generateAdCopy(
        'Marketing automation tool',
        'Small business owners',
        'google'
      );

      expect(result).toHaveProperty('headline');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('cta');
    });

    it('should handle invalid JSON response', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Invalid JSON response' } }],
      });

      const result = await generateAdCopy('Product', 'Audience', 'facebook');

      expect(result).toEqual({ headline: '', description: '', cta: '' });
    });
  });

  describe('analyzeSentiment', () => {
    it('should return sentiment analysis', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              sentiment: 'positive',
              score: 0.85,
              summary: 'The content has an optimistic tone',
            })
          }
        }],
      });

      const result = await analyzeSentiment('I love this product!');

      expect(result.sentiment).toBe('positive');
      expect(result.score).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
    });

    it('should return neutral on parse error', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'Not JSON' } }],
      });

      const result = await analyzeSentiment('Test content');

      expect(result.sentiment).toBe('neutral');
      expect(result.score).toBe(0.5);
    });
  });

  describe('improveContent', () => {
    it('should improve content for grammar', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'The improved sentence is correct.' } }],
      });

      const result = await improveContent('The improved sentance is correct.', 'grammar');

      expect(mockCreate).toHaveBeenCalled();
      expect(result).toBe('The improved sentence is correct.');
    });

    it('should support all improvement types', async () => {
      const types = ['grammar', 'clarity', 'engagement', 'seo'] as const;

      for (const type of types) {
        mockCreate.mockClear();
        mockCreate.mockResolvedValueOnce({
          choices: [{ message: { content: 'Improved content' } }],
        });

        await improveContent('Original content', type);
        expect(mockCreate).toHaveBeenCalled();
      }
    });
  });

  describe('generateBlogPost', () => {
    it('should generate structured blog post', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              title: 'AI Marketing Guide',
              content: '## Introduction\n\nAI is changing marketing...',
              metaDescription: 'Learn about AI marketing',
            })
          }
        }],
      });

      const result = await generateBlogPost(
        'AI in Marketing',
        ['AI', 'marketing', 'automation'],
        1500,
        'professional'
      );

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('metaDescription');
    });

    it('should extract JSON from markdown code blocks', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: '```json\n{"title":"Test","content":"Content","metaDescription":"Meta"}\n```'
          }
        }],
      });

      const result = await generateBlogPost('Topic', ['keyword'], 1000);

      expect(result.title).toBe('Test');
    });
  });

  describe('generateContentStrategy', () => {
    it('should generate content strategy', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              overview: 'Strategic plan for growth',
              themes: ['AI', 'Innovation', 'Growth'],
              contentPlan: [{ week: 1, topic: 'AI Guide', type: 'blog', platform: 'website' }],
              kpis: ['Traffic', 'Engagement'],
            })
          }
        }],
      });

      const result = await generateContentStrategy(
        'AI SaaS company',
        'Marketing professionals',
        ['Increase leads', 'Brand awareness'],
        'monthly'
      );

      expect(result).toHaveProperty('overview');
      expect(result.themes).toBeInstanceOf(Array);
      expect(result.contentPlan).toBeInstanceOf(Array);
      expect(result.kpis).toBeInstanceOf(Array);
    });
  });

  describe('repurposeContent', () => {
    it('should repurpose content to multiple formats', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              twitter: 'Short tweet about AI',
              linkedin: 'Professional LinkedIn post about AI',
              summary: 'Brief summary',
            })
          }
        }],
      });

      const result = await repurposeContent(
        'Long blog post about AI marketing...',
        'blog_post',
        ['twitter', 'linkedin', 'summary']
      );

      expect(result).toHaveProperty('twitter');
      expect(result).toHaveProperty('linkedin');
      expect(result).toHaveProperty('summary');
    });
  });

  describe('generateLandingPageCopy', () => {
    it('should generate complete landing page copy', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              headline: 'Transform Your Marketing',
              subheadline: 'With AI-powered automation',
              heroDescription: 'Our platform helps teams...',
              features: [{ title: 'Feature 1', description: 'Description 1' }],
              testimonialPrompts: ['What results?'],
              ctaText: 'Start Free',
              faq: [{ question: 'Q1?', answer: 'A1' }],
            })
          }
        }],
      });

      const result = await generateLandingPageCopy(
        'Marketing Hub',
        'AI marketing platform',
        'Marketing teams',
        ['Easy to use', 'Powerful analytics']
      );

      expect(result).toHaveProperty('headline');
      expect(result).toHaveProperty('subheadline');
      expect(result).toHaveProperty('heroDescription');
      expect(result.features).toBeInstanceOf(Array);
      expect(result.faq).toBeInstanceOf(Array);
    });
  });

  describe('generateMarketingInsights', () => {
    it('should generate insights from analytics data', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              summary: 'Performance is strong overall',
              insights: ['Traffic is growing', 'Mobile needs work'],
              recommendations: ['Optimize mobile', 'Create more content'],
              priorities: [{ action: 'Mobile optimization', impact: 'high', effort: 'medium' }],
            })
          }
        }],
      });

      const result = await generateMarketingInsights({
        pageViews: 10000,
        uniqueVisitors: 5000,
        bounceRate: 45,
        avgSessionDuration: 180,
        topPages: ['/home', '/pricing'],
        conversionRate: 2.5,
        trafficSources: { organic: 50, direct: 30, social: 20 },
      });

      expect(result).toHaveProperty('summary');
      expect(result.insights).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.priorities).toBeInstanceOf(Array);
    });
  });

  describe('HuggingFace export', () => {
    it('should export all functions', () => {
      expect(HuggingFace.chatCompletion).toBeDefined();
      expect(HuggingFace.generateSocialCaption).toBeDefined();
      expect(HuggingFace.generateHashtags).toBeDefined();
      expect(HuggingFace.generateEmailSubjects).toBeDefined();
      expect(HuggingFace.generateAdCopy).toBeDefined();
      expect(HuggingFace.analyzeSentiment).toBeDefined();
      expect(HuggingFace.improveContent).toBeDefined();
      expect(HuggingFace.generateBlogPost).toBeDefined();
      expect(HuggingFace.generateContentStrategy).toBeDefined();
      expect(HuggingFace.repurposeContent).toBeDefined();
      expect(HuggingFace.generateLandingPageCopy).toBeDefined();
      expect(HuggingFace.generateMarketingInsights).toBeDefined();
      expect(HuggingFace.models).toBeDefined();
      expect(HuggingFace.getModelForTask).toBeDefined();
    });

    it('should return GLM-4 for task selection', () => {
      expect(HuggingFace.getModelForTask('social_caption')).toBe('glm-4-9b');
      expect(HuggingFace.getModelForTask('blog_post')).toBe('glm-4-9b');
      expect(HuggingFace.getModelForTask('unknown_task')).toBe('glm-4-9b');
    });
  });
});
