// Unified AI Service - Multi-Provider Support
// Routes to appropriate provider based on configuration and task type

import {
  generateSocialCaption as openaiSocialCaption,
  generateHashtags as openaiHashtags,
  generateEmailSubjects as openaiEmailSubjects,
  generateAdCopy as openaiAdCopy,
  analyzeSentiment as openaiSentiment,
  improveContent as openaiImprove,
} from './openai';

import {
  generateBlogPost as anthropicBlogPost,
  generateContentStrategy as anthropicContentStrategy,
  repurposeContent as anthropicRepurpose,
  generateLandingPageCopy as anthropicLandingPage,
  generateMarketingInsights as anthropicInsights,
} from './anthropic';

import {
  HuggingFace,
  MODEL_CONFIGS,
  type ModelId,
  type HFModelProvider,
  type HFGenerateOptions,
  generateSocialCaption as hfSocialCaption,
  generateHashtags as hfHashtags,
  generateEmailSubjects as hfEmailSubjects,
  generateAdCopy as hfAdCopy,
  analyzeSentiment as hfSentiment,
  improveContent as hfImprove,
  generateBlogPost as hfBlogPost,
  generateContentStrategy as hfContentStrategy,
  repurposeContent as hfRepurpose,
  generateLandingPageCopy as hfLandingPage,
  generateMarketingInsights as hfInsights,
} from './huggingface';

// Provider types
export type AIProvider = 'openai' | 'anthropic' | 'huggingface' | 'auto';

// Global AI configuration
interface AIGlobalConfig {
  defaultProvider: AIProvider;
  huggingfaceModel?: ModelId;
}

// Default configuration - can be overridden at runtime
let globalConfig: AIGlobalConfig = {
  defaultProvider: 'huggingface', // Use HuggingFace by default for flexibility
  huggingfaceModel: 'mistral-nemo',
};

// Set global AI configuration
export function setAIConfig(config: Partial<AIGlobalConfig>) {
  globalConfig = { ...globalConfig, ...config };
}

// Get current AI configuration
export function getAIConfig(): AIGlobalConfig {
  return { ...globalConfig };
}

// Get available models
export function getAvailableModels() {
  return MODEL_CONFIGS;
}

// Set default Hugging Face model
export function setDefaultModel(modelId: ModelId) {
  globalConfig.huggingfaceModel = modelId;
}

export interface AIConfig {
  provider?: AIProvider;
  model?: ModelId;
  maxTokens?: number;
  temperature?: number;
}

// Task type to provider mapping (for 'auto' mode when not using HuggingFace)
const taskProviderMap: Record<string, AIProvider> = {
  // Quick, short-form tasks -> OpenAI (faster, cheaper)
  social_caption: 'openai',
  hashtags: 'openai',
  email_subjects: 'openai',
  ad_copy: 'openai',
  sentiment: 'openai',
  improve: 'openai',
  // Long-form, complex tasks -> Anthropic (better reasoning)
  blog_post: 'anthropic',
  content_strategy: 'anthropic',
  repurpose: 'anthropic',
  landing_page: 'anthropic',
  insights: 'anthropic',
};

// Get provider for a specific task type
function getProviderForTask(taskType: string, config?: AIConfig): AIProvider {
  if (config?.provider && config.provider !== 'auto') {
    return config.provider;
  }
  if (globalConfig.defaultProvider !== 'auto') {
    return globalConfig.defaultProvider;
  }
  return taskProviderMap[taskType] || 'huggingface';
}

// ============================================================================
// UNIFIED AI FUNCTIONS - Automatically route to selected provider
// ============================================================================

export async function generateSocialCaption(
  topic: string,
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram',
  tone: 'professional' | 'casual' | 'witty' | 'informative' = 'professional',
  config?: AIConfig
): Promise<string> {
  const provider = getProviderForTask('social_caption', config);

  switch (provider) {
    case 'huggingface':
      return hfSocialCaption(topic, platform, tone, {
        model: config?.model || globalConfig.huggingfaceModel,
        maxTokens: config?.maxTokens,
        temperature: config?.temperature,
      });
    case 'openai':
    default:
      return openaiSocialCaption(topic, platform, tone, {
        maxTokens: config?.maxTokens,
        temperature: config?.temperature,
      });
  }
}

export async function generateHashtags(
  content: string,
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram',
  count: number = 5,
  config?: AIConfig
): Promise<string[]> {
  const provider = getProviderForTask('hashtags', config);

  switch (provider) {
    case 'huggingface':
      return hfHashtags(content, platform, count);
    case 'openai':
    default:
      return openaiHashtags(content, platform, count);
  }
}

export async function generateEmailSubjects(
  emailContent: string,
  count: number = 5,
  config?: AIConfig
): Promise<string[]> {
  const provider = getProviderForTask('email_subjects', config);

  switch (provider) {
    case 'huggingface':
      return hfEmailSubjects(emailContent, count);
    case 'openai':
    default:
      return openaiEmailSubjects(emailContent, count);
  }
}

export async function generateAdCopy(
  product: string,
  targetAudience: string,
  platform: 'google' | 'facebook' | 'instagram',
  config?: AIConfig
): Promise<{ headline: string; description: string; cta: string }> {
  const provider = getProviderForTask('ad_copy', config);

  switch (provider) {
    case 'huggingface':
      return hfAdCopy(product, targetAudience, platform, {
        model: config?.model || globalConfig.huggingfaceModel,
        maxTokens: config?.maxTokens,
        temperature: config?.temperature,
      });
    case 'openai':
    default:
      return openaiAdCopy(product, targetAudience, platform, {
        maxTokens: config?.maxTokens,
        temperature: config?.temperature,
      });
  }
}

export async function analyzeSentiment(
  content: string,
  config?: AIConfig
): Promise<{ sentiment: 'positive' | 'negative' | 'neutral'; score: number; summary: string }> {
  const provider = getProviderForTask('sentiment', config);

  switch (provider) {
    case 'huggingface':
      return hfSentiment(content);
    case 'openai':
    default:
      return openaiSentiment(content);
  }
}

export async function improveContent(
  content: string,
  type: 'grammar' | 'clarity' | 'engagement' | 'seo',
  config?: AIConfig
): Promise<string> {
  const provider = getProviderForTask('improve', config);

  switch (provider) {
    case 'huggingface':
      return hfImprove(content, type);
    case 'openai':
    default:
      return openaiImprove(content, type);
  }
}

export async function generateBlogPost(
  topic: string,
  keywords: string[],
  wordCount: number = 1500,
  tone: 'professional' | 'casual' | 'authoritative' | 'conversational' = 'professional',
  config?: AIConfig
): Promise<{ title: string; content: string; metaDescription: string }> {
  const provider = getProviderForTask('blog_post', config);

  switch (provider) {
    case 'huggingface':
      return hfBlogPost(topic, keywords, wordCount, tone, {
        model: config?.model || 'mixtral-8x7b',
        maxTokens: config?.maxTokens,
        temperature: config?.temperature,
      });
    case 'anthropic':
    default:
      return anthropicBlogPost(topic, keywords, wordCount, tone, {
        maxTokens: config?.maxTokens,
        temperature: config?.temperature,
      });
  }
}

export async function generateContentStrategy(
  businessDescription: string,
  targetAudience: string,
  goals: string[],
  timeframe: 'weekly' | 'monthly' | 'quarterly' = 'monthly',
  config?: AIConfig
): Promise<{
  overview: string;
  themes: string[];
  contentPlan: Array<{ week: number; topic: string; type: string; platform: string }>;
  kpis: string[];
}> {
  const provider = getProviderForTask('content_strategy', config);

  switch (provider) {
    case 'huggingface':
      return hfContentStrategy(businessDescription, targetAudience, goals, timeframe);
    case 'anthropic':
    default:
      return anthropicContentStrategy(businessDescription, targetAudience, goals, timeframe);
  }
}

export async function repurposeContent(
  originalContent: string,
  originalType: 'blog_post' | 'email' | 'whitepaper',
  targetFormats: ('twitter' | 'linkedin' | 'instagram' | 'email_snippet' | 'summary')[],
  config?: AIConfig
): Promise<Record<string, string>> {
  const provider = getProviderForTask('repurpose', config);

  switch (provider) {
    case 'huggingface':
      return hfRepurpose(originalContent, originalType, targetFormats);
    case 'anthropic':
    default:
      return anthropicRepurpose(originalContent, originalType, targetFormats);
  }
}

export async function generateLandingPageCopy(
  productName: string,
  productDescription: string,
  targetAudience: string,
  uniqueSellingPoints: string[],
  config?: AIConfig
): Promise<{
  headline: string;
  subheadline: string;
  heroDescription: string;
  features: Array<{ title: string; description: string }>;
  testimonialPrompts: string[];
  ctaText: string;
  faq: Array<{ question: string; answer: string }>;
}> {
  const provider = getProviderForTask('landing_page', config);

  switch (provider) {
    case 'huggingface':
      return hfLandingPage(productName, productDescription, targetAudience, uniqueSellingPoints);
    case 'anthropic':
    default:
      return anthropicLandingPage(productName, productDescription, targetAudience, uniqueSellingPoints);
  }
}

export async function generateMarketingInsights(
  analyticsData: {
    pageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    avgSessionDuration: number;
    topPages: string[];
    conversionRate: number;
    trafficSources: Record<string, number>;
  },
  config?: AIConfig
): Promise<{
  summary: string;
  insights: string[];
  recommendations: string[];
  priorities: Array<{ action: string; impact: 'high' | 'medium' | 'low'; effort: 'high' | 'medium' | 'low' }>;
}> {
  const provider = getProviderForTask('insights', config);

  switch (provider) {
    case 'huggingface':
      return hfInsights(analyticsData);
    case 'anthropic':
    default:
      return anthropicInsights(analyticsData);
  }
}

// ============================================================================
// UNIFIED AI EXPORT
// ============================================================================

export const AI = {
  // Configuration
  setConfig: setAIConfig,
  getConfig: getAIConfig,
  setDefaultModel,
  getAvailableModels,

  // Social Media
  generateSocialCaption,
  generateHashtags,

  // Email
  generateEmailSubjects,

  // Advertising
  generateAdCopy,

  // Analysis
  analyzeSentiment,
  generateMarketingInsights,

  // Content Creation
  improveContent,
  generateBlogPost,
  generateContentStrategy,
  repurposeContent,
  generateLandingPageCopy,

  // Direct provider access
  providers: {
    huggingface: HuggingFace,
  },

  // Utility: Get provider for task type
  getProviderForTask: (taskType: string): AIProvider => {
    return taskProviderMap[taskType] || globalConfig.defaultProvider;
  },
};

// Re-export types
export type { GenerateOptions } from './openai';
export type { ModelId, HFModelProvider, HFGenerateOptions };
export { MODEL_CONFIGS };

export default AI;
