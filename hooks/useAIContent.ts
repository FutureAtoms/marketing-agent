// AI Content Generation Hook - Uses Hugging Face Inference API
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import AI, { setAIConfig, getAIConfig, MODEL_CONFIGS, type ModelId, type AIConfig } from '../lib/ai';

// Types
export interface ContentGenerationOptions {
  model?: ModelId;
  provider?: 'huggingface' | 'openai' | 'anthropic' | 'auto';
  temperature?: number;
  maxTokens?: number;
}

export interface SocialCaptionRequest {
  topic: string;
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
  tone?: 'professional' | 'casual' | 'witty' | 'informative';
  options?: ContentGenerationOptions;
}

export interface BlogPostRequest {
  topic: string;
  keywords: string[];
  wordCount?: number;
  tone?: 'professional' | 'casual' | 'authoritative' | 'conversational';
  options?: ContentGenerationOptions;
}

export interface EmailSubjectRequest {
  emailContent: string;
  count?: number;
  options?: ContentGenerationOptions;
}

export interface ContentStrategyRequest {
  businessDescription: string;
  targetAudience: string;
  goals: string[];
  timeframe?: 'weekly' | 'monthly' | 'quarterly';
  options?: ContentGenerationOptions;
}

export interface AdCopyRequest {
  product: string;
  targetAudience: string;
  platform: 'google' | 'facebook' | 'instagram';
  options?: ContentGenerationOptions;
}

export interface LandingPageCopyRequest {
  productName: string;
  productDescription: string;
  targetAudience: string;
  uniqueSellingPoints: string[];
  options?: ContentGenerationOptions;
}

export interface RepurposeContentRequest {
  originalContent: string;
  originalType: 'blog_post' | 'email' | 'whitepaper';
  targetFormats: ('twitter' | 'linkedin' | 'instagram' | 'email_snippet' | 'summary')[];
  options?: ContentGenerationOptions;
}

// Hook to manage AI configuration
export function useAIConfig() {
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['ai-config'],
    queryFn: () => getAIConfig(),
    staleTime: Infinity,
  });

  const setConfig = useCallback((newConfig: Parameters<typeof setAIConfig>[0]) => {
    setAIConfig(newConfig);
    queryClient.setQueryData(['ai-config'], getAIConfig());
  }, [queryClient]);

  const setModel = useCallback((modelId: ModelId) => {
    setAIConfig({ huggingfaceModel: modelId });
    queryClient.setQueryData(['ai-config'], getAIConfig());
  }, [queryClient]);

  return {
    config,
    setConfig,
    setModel,
    availableModels: MODEL_CONFIGS,
  };
}

// Hook to generate social media captions
export function useGenerateSocialCaption() {
  const [lastGeneration, setLastGeneration] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ topic, platform, tone = 'professional', options }: SocialCaptionRequest) => {
      const config: AIConfig = {
        provider: options?.provider,
        model: options?.model,
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
      };
      return AI.generateSocialCaption(topic, platform, tone, config);
    },
    onSuccess: (data) => {
      setLastGeneration(data);
    },
  });

  return {
    ...mutation,
    lastGeneration,
    generate: mutation.mutate,
    generateAsync: mutation.mutateAsync,
  };
}

// Hook to generate hashtags
export function useGenerateHashtags() {
  return useMutation({
    mutationFn: async ({ content, platform, count = 5 }: {
      content: string;
      platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
      count?: number;
    }) => {
      return AI.generateHashtags(content, platform, count);
    },
  });
}

// Hook to generate blog posts
export function useGenerateBlogPost() {
  const [lastBlogPost, setLastBlogPost] = useState<{
    title: string;
    content: string;
    metaDescription: string;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: async ({
      topic,
      keywords,
      wordCount = 1500,
      tone = 'professional',
      options,
    }: BlogPostRequest) => {
      const config: AIConfig = {
        provider: options?.provider,
        model: options?.model || 'mixtral-8x7b', // Default to powerful model for blog posts
        temperature: options?.temperature,
        maxTokens: options?.maxTokens,
      };
      return AI.generateBlogPost(topic, keywords, wordCount, tone, config);
    },
    onSuccess: (data) => {
      setLastBlogPost(data);
    },
  });

  return {
    ...mutation,
    lastBlogPost,
    generate: mutation.mutate,
    generateAsync: mutation.mutateAsync,
  };
}

// Hook to generate email subject lines
export function useGenerateEmailSubjects() {
  return useMutation({
    mutationFn: async ({ emailContent, count = 5, options }: EmailSubjectRequest) => {
      const config: AIConfig = {
        provider: options?.provider,
        model: options?.model,
      };
      return AI.generateEmailSubjects(emailContent, count, config);
    },
  });
}

// Hook to generate content strategy
export function useGenerateContentStrategy() {
  const [lastStrategy, setLastStrategy] = useState<{
    overview: string;
    themes: string[];
    contentPlan: Array<{ week: number; topic: string; type: string; platform: string }>;
    kpis: string[];
  } | null>(null);

  const mutation = useMutation({
    mutationFn: async ({
      businessDescription,
      targetAudience,
      goals,
      timeframe = 'monthly',
      options,
    }: ContentStrategyRequest) => {
      const config: AIConfig = {
        provider: options?.provider,
        model: options?.model || 'mistral-large',
      };
      return AI.generateContentStrategy(businessDescription, targetAudience, goals, timeframe, config);
    },
    onSuccess: (data) => {
      setLastStrategy(data);
    },
  });

  return {
    ...mutation,
    lastStrategy,
    generate: mutation.mutate,
    generateAsync: mutation.mutateAsync,
  };
}

// Hook to generate ad copy
export function useGenerateAdCopy() {
  return useMutation({
    mutationFn: async ({ product, targetAudience, platform, options }: AdCopyRequest) => {
      const config: AIConfig = {
        provider: options?.provider,
        model: options?.model,
      };
      return AI.generateAdCopy(product, targetAudience, platform, config);
    },
  });
}

// Hook to generate landing page copy
export function useGenerateLandingPageCopy() {
  return useMutation({
    mutationFn: async ({
      productName,
      productDescription,
      targetAudience,
      uniqueSellingPoints,
      options,
    }: LandingPageCopyRequest) => {
      const config: AIConfig = {
        provider: options?.provider,
        model: options?.model || 'mistral-large',
      };
      return AI.generateLandingPageCopy(
        productName,
        productDescription,
        targetAudience,
        uniqueSellingPoints,
        config
      );
    },
  });
}

// Hook to repurpose content
export function useRepurposeContent() {
  return useMutation({
    mutationFn: async ({
      originalContent,
      originalType,
      targetFormats,
      options,
    }: RepurposeContentRequest) => {
      const config: AIConfig = {
        provider: options?.provider,
        model: options?.model || 'mixtral-8x7b',
      };
      return AI.repurposeContent(originalContent, originalType, targetFormats, config);
    },
  });
}

// Hook to analyze sentiment
export function useAnalyzeSentiment() {
  return useMutation({
    mutationFn: async (content: string) => {
      return AI.analyzeSentiment(content);
    },
  });
}

// Hook to improve content
export function useImproveContent() {
  return useMutation({
    mutationFn: async ({
      content,
      type,
    }: {
      content: string;
      type: 'grammar' | 'clarity' | 'engagement' | 'seo';
    }) => {
      return AI.improveContent(content, type);
    },
  });
}

// Hook to generate marketing insights
export function useGenerateMarketingInsights() {
  return useMutation({
    mutationFn: async (analyticsData: {
      pageViews: number;
      uniqueVisitors: number;
      bounceRate: number;
      avgSessionDuration: number;
      topPages: string[];
      conversionRate: number;
      trafficSources: Record<string, number>;
    }) => {
      return AI.generateMarketingInsights(analyticsData);
    },
  });
}

// Unified hook for all AI content generation
export function useAIContentGeneration() {
  const socialCaption = useGenerateSocialCaption();
  const hashtags = useGenerateHashtags();
  const blogPost = useGenerateBlogPost();
  const emailSubjects = useGenerateEmailSubjects();
  const contentStrategy = useGenerateContentStrategy();
  const adCopy = useGenerateAdCopy();
  const landingPageCopy = useGenerateLandingPageCopy();
  const repurposeContent = useRepurposeContent();
  const sentiment = useAnalyzeSentiment();
  const improveContent = useImproveContent();
  const marketingInsights = useGenerateMarketingInsights();
  const aiConfig = useAIConfig();

  return {
    // Configuration
    config: aiConfig,

    // Social Media
    socialCaption,
    hashtags,

    // Long-form Content
    blogPost,
    contentStrategy,
    landingPageCopy,
    repurposeContent,

    // Email
    emailSubjects,

    // Advertising
    adCopy,

    // Analysis
    sentiment,
    marketingInsights,

    // Content Improvement
    improveContent,

    // Loading state aggregation
    isGenerating:
      socialCaption.isPending ||
      hashtags.isPending ||
      blogPost.isPending ||
      emailSubjects.isPending ||
      contentStrategy.isPending ||
      adCopy.isPending ||
      landingPageCopy.isPending ||
      repurposeContent.isPending ||
      sentiment.isPending ||
      improveContent.isPending ||
      marketingInsights.isPending,
  };
}

export default useAIContentGeneration;
