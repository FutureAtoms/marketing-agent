// Hugging Face Router API - Unified AI Provider
// Supports multiple models including GLM-4.7, Claude, GPT, Mistral, Llama, etc.
// Uses OpenAI-compatible API via Hugging Face Router

import OpenAI from 'openai';

// Available model providers through Hugging Face
export type HFModelProvider =
  | 'anthropic'    // Claude models
  | 'openai'       // GPT models
  | 'mistral'      // Mistral models
  | 'meta'         // Llama models
  | 'google'       // Gemma models
  | 'cohere'       // Command models
  | 'thudm'        // GLM models (Zhipu AI)
  | 'auto';        // Auto-select best model for task

// Model configurations
export const MODEL_CONFIGS = {
  // GLM-4.7 (zai-org via Novita) - Primary model
  'glm-4-9b': {
    id: 'zai-org/GLM-4.7:novita',
    provider: 'thudm' as HFModelProvider,
    maxTokens: 8192,
    description: 'GLM-4.7 - High quality multilingual model, excellent reasoning',
  },
  // Anthropic Claude (via HF Inference API)
  'claude-3-sonnet': {
    id: 'anthropic/claude-3-sonnet',
    provider: 'anthropic' as HFModelProvider,
    maxTokens: 4096,
    description: 'Claude 3 Sonnet - Best for complex reasoning and long-form content',
  },
  'claude-3-haiku': {
    id: 'anthropic/claude-3-haiku',
    provider: 'anthropic' as HFModelProvider,
    maxTokens: 4096,
    description: 'Claude 3 Haiku - Fast, efficient for quick tasks',
  },
  // Mistral models (fully supported on HF)
  'mistral-large': {
    id: 'mistralai/Mistral-Large-Instruct-2407',
    provider: 'mistral' as HFModelProvider,
    maxTokens: 8192,
    description: 'Mistral Large - High quality reasoning',
  },
  'mistral-nemo': {
    id: 'mistralai/Mistral-Nemo-Instruct-2407',
    provider: 'mistral' as HFModelProvider,
    maxTokens: 8192,
    description: 'Mistral Nemo - Balanced performance',
  },
  'mixtral-8x7b': {
    id: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    provider: 'mistral' as HFModelProvider,
    maxTokens: 32768,
    description: 'Mixtral MoE - Great for diverse tasks',
  },
  // Meta Llama models
  'llama-3-70b': {
    id: 'meta-llama/Meta-Llama-3-70B-Instruct',
    provider: 'meta' as HFModelProvider,
    maxTokens: 8192,
    description: 'Llama 3 70B - Powerful open model',
  },
  'llama-3-8b': {
    id: 'meta-llama/Meta-Llama-3-8B-Instruct',
    provider: 'meta' as HFModelProvider,
    maxTokens: 8192,
    description: 'Llama 3 8B - Fast and efficient',
  },
  // Google Gemma
  'gemma-2-27b': {
    id: 'google/gemma-2-27b-it',
    provider: 'google' as HFModelProvider,
    maxTokens: 8192,
    description: 'Gemma 2 27B - Google\'s open model',
  },
  // Cohere Command
  'command-r-plus': {
    id: 'CohereForAI/c4ai-command-r-plus',
    provider: 'cohere' as HFModelProvider,
    maxTokens: 4096,
    description: 'Command R+ - Great for RAG and enterprise',
  },
} as const;

export type ModelId = keyof typeof MODEL_CONFIGS;

// Task to model mapping for auto-selection (GLM-4 as primary)
const TASK_MODEL_MAP: Record<string, ModelId> = {
  // Quick, short-form tasks -> GLM-4 (fast and high quality)
  social_caption: 'glm-4-9b',
  hashtags: 'glm-4-9b',
  email_subjects: 'glm-4-9b',
  ad_copy: 'glm-4-9b',
  sentiment: 'glm-4-9b',
  improve: 'glm-4-9b',
  // Long-form, complex tasks -> GLM-4 (excellent reasoning)
  blog_post: 'glm-4-9b',
  content_strategy: 'glm-4-9b',
  repurpose: 'glm-4-9b',
  landing_page: 'glm-4-9b',
  insights: 'glm-4-9b',
};

// Hugging Face Router Base URL (OpenAI-compatible)
const HF_ROUTER_BASE_URL = 'https://router.huggingface.co/v1';

// Initialize OpenAI client with HF Router
let hfClient: OpenAI | null = null;

function getHFClient(): OpenAI {
  if (!hfClient) {
    const apiKey = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;

    if (!apiKey || apiKey === 'hf_your-huggingface-key-here') {
      console.warn('Hugging Face API key not configured. Using mock responses.');
      // Return a client that will fail gracefully
      return new OpenAI({ apiKey: 'mock', baseURL: HF_ROUTER_BASE_URL });
    }

    hfClient = new OpenAI({
      apiKey,
      baseURL: HF_ROUTER_BASE_URL,
    });
  }
  return hfClient;
}

export interface HFGenerateOptions {
  model?: ModelId;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  taskType?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Core chat completion function (OpenAI-compatible via HF Router)
export async function chatCompletion(
  messages: ChatMessage[],
  options: HFGenerateOptions = {}
): Promise<string> {
  const client = getHFClient();

  // Auto-select model if not specified (GLM-4.7 as default)
  const modelId = options.model ||
    (options.taskType ? TASK_MODEL_MAP[options.taskType] : 'glm-4-9b') ||
    'glm-4-9b';

  const modelConfig = MODEL_CONFIGS[modelId];

  // Check if API key is configured
  const apiKey = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY;
  if (!apiKey || apiKey === 'hf_your-huggingface-key-here') {
    return getMockResponse(messages, options.taskType);
  }

  try {
    const response = await client.chat.completions.create({
      model: modelConfig.id,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: options.maxTokens || modelConfig.maxTokens,
      temperature: options.temperature || 0.7,
      top_p: options.topP || 0.9,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error: any) {
    console.error('HuggingFace Router API error:', error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

// Mock responses for development
function getMockResponse(messages: ChatMessage[], taskType?: string): string {
  const userMessage = messages.find(m => m.role === 'user')?.content || '';

  // JSON response mocks
  if (userMessage.includes('JSON') || userMessage.includes('json')) {
    if (taskType === 'ad_copy' || userMessage.includes('ad copy')) {
      return JSON.stringify({
        headline: 'Transform Your Business Today',
        description: 'Discover powerful solutions that drive real results.',
        cta: 'Get Started',
      });
    }
    if (taskType === 'sentiment' || userMessage.includes('sentiment')) {
      return JSON.stringify({
        sentiment: 'positive',
        score: 0.85,
        summary: 'The content has an optimistic and encouraging tone.',
      });
    }
    if (taskType === 'blog_post' || userMessage.includes('blog post')) {
      return JSON.stringify({
        title: 'How AI is Transforming Modern Marketing',
        content: '## Introduction\n\nIn today\'s digital landscape, AI is revolutionizing marketing...\n\n## Key Benefits\n\nAI enables personalization at scale...\n\n## Conclusion\n\nThe future of marketing is AI-powered.',
        metaDescription: 'Discover how AI is transforming marketing strategies.',
      });
    }
    if (taskType === 'content_strategy' || userMessage.includes('content strategy')) {
      return JSON.stringify({
        overview: 'A comprehensive strategy focused on building authority.',
        themes: ['Industry Insights', 'Product Features', 'Customer Success'],
        contentPlan: [
          { week: 1, topic: 'AI Marketing Guide', type: 'blog', platform: 'website' },
          { week: 2, topic: 'Customer Case Study', type: 'social', platform: 'linkedin' },
        ],
        kpis: ['Website traffic', 'Email open rate', 'Lead generation'],
      });
    }
    if (taskType === 'landing_page' || userMessage.includes('landing page')) {
      return JSON.stringify({
        headline: 'Transform Your Marketing with AI',
        subheadline: 'Automate and scale your campaigns',
        heroDescription: 'Our AI platform helps teams create better content.',
        features: [
          { title: 'AI Content Generation', description: 'Create content in seconds' },
          { title: 'Smart Scheduling', description: 'Post at the perfect time' },
        ],
        testimonialPrompts: ['What results have you seen?'],
        ctaText: 'Start Free Trial',
        faq: [{ question: 'Is there a free trial?', answer: 'Yes, 14-day free trial.' }],
      });
    }
    if (taskType === 'insights' || userMessage.includes('analytics')) {
      return JSON.stringify({
        summary: 'Performance is strong with room for conversion optimization.',
        insights: ['Organic traffic is growing', 'Mobile bounce rate is high'],
        recommendations: ['Optimize mobile experience', 'Create more product content'],
        priorities: [
          { action: 'Mobile optimization', impact: 'high', effort: 'medium' },
        ],
      });
    }
    if (userMessage.includes('Repurpose')) {
      return JSON.stringify({
        twitter: 'Excited to share insights on AI marketing!',
        linkedin: 'We\'ve published a comprehensive guide on AI marketing strategies.',
        summary: 'This article explores AI-powered personalization at scale.',
      });
    }
    return JSON.stringify({ result: 'Mock response' });
  }

  // Text response mocks
  if (userMessage.toLowerCase().includes('hashtag')) {
    return 'marketing\ndigital\nstrategy\ngrowth\nsuccess';
  }
  if (userMessage.toLowerCase().includes('subject')) {
    return 'Unlock Your Potential Today\nDon\'t Miss This Opportunity\nExclusive Offer Inside';
  }

  return 'This is a mock response. Configure your Hugging Face API key in .env for real AI responses.';
}

// ============================================================================
// SOCIAL MEDIA FUNCTIONS
// ============================================================================

export async function generateSocialCaption(
  topic: string,
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram',
  tone: 'professional' | 'casual' | 'witty' | 'informative' = 'professional',
  options: HFGenerateOptions = {}
): Promise<string> {
  const platformLimits = {
    twitter: 280,
    linkedin: 3000,
    facebook: 500,
    instagram: 2200,
  };

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are a social media expert. Generate engaging ${platform} posts that are ${tone} in tone.
Keep posts under ${platformLimits[platform]} characters. Include relevant emojis and hashtags.
For LinkedIn, be professional. For Instagram, be visual with more emojis.
For Twitter, be concise and punchy. For Facebook, be conversational.`,
    },
    {
      role: 'user',
      content: `Write a ${platform} post about: ${topic}`,
    },
  ];

  return chatCompletion(messages, {
    ...options,
    taskType: 'social_caption',
    maxTokens: options.maxTokens || 500,
    temperature: options.temperature || 0.7,
  });
}

export async function generateHashtags(
  content: string,
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram',
  count: number = 5
): Promise<string[]> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `Generate ${count} relevant hashtags for social media content.
Return only the hashtags, one per line, without the # symbol.
Focus on hashtags that are popular and relevant for ${platform}.`,
    },
    {
      role: 'user',
      content: content,
    },
  ];

  const response = await chatCompletion(messages, {
    taskType: 'hashtags',
    maxTokens: 100,
    temperature: 0.5,
  });

  return response.split('\n').filter(Boolean).map((tag) => `#${tag.replace('#', '').trim()}`);
}

// ============================================================================
// EMAIL MARKETING FUNCTIONS
// ============================================================================

export async function generateEmailSubjects(
  emailContent: string,
  count: number = 5
): Promise<string[]> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `Generate ${count} compelling email subject lines.
Subject lines should be under 60 characters, create urgency or curiosity.
Return only the subject lines, one per line.`,
    },
    {
      role: 'user',
      content: `Generate subject lines for this email:\n\n${emailContent}`,
    },
  ];

  const response = await chatCompletion(messages, {
    taskType: 'email_subjects',
    maxTokens: 200,
    temperature: 0.8,
  });

  return response.split('\n').filter(Boolean);
}

// ============================================================================
// AD COPY FUNCTIONS
// ============================================================================

export async function generateAdCopy(
  product: string,
  targetAudience: string,
  platform: 'google' | 'facebook' | 'instagram',
  options: HFGenerateOptions = {}
): Promise<{ headline: string; description: string; cta: string }> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are an advertising copywriter. Generate compelling ad copy for ${platform}.
Return the response in this exact JSON format:
{
  "headline": "Short headline (max 30 chars for Google, 40 for others)",
  "description": "Description (max 90 chars for Google, 125 for others)",
  "cta": "Call to action (max 15 chars)"
}`,
    },
    {
      role: 'user',
      content: `Create ad copy for: ${product}\nTarget audience: ${targetAudience}`,
    },
  ];

  const response = await chatCompletion(messages, {
    ...options,
    taskType: 'ad_copy',
    maxTokens: 300,
    temperature: 0.7,
  });

  try {
    return JSON.parse(response);
  } catch {
    return { headline: '', description: '', cta: '' };
  }
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

export async function analyzeSentiment(
  content: string
): Promise<{ sentiment: 'positive' | 'negative' | 'neutral'; score: number; summary: string }> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `Analyze the sentiment of the provided content.
Return the response in this exact JSON format:
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": 0.0 to 1.0,
  "summary": "Brief explanation"
}`,
    },
    {
      role: 'user',
      content: content,
    },
  ];

  const response = await chatCompletion(messages, {
    taskType: 'sentiment',
    maxTokens: 200,
    temperature: 0.3,
  });

  try {
    return JSON.parse(response);
  } catch {
    return { sentiment: 'neutral', score: 0.5, summary: 'Unable to analyze' };
  }
}

export async function improveContent(
  content: string,
  type: 'grammar' | 'clarity' | 'engagement' | 'seo'
): Promise<string> {
  const prompts = {
    grammar: 'Fix any grammar, spelling, or punctuation errors.',
    clarity: 'Improve the clarity and readability while keeping the same meaning.',
    engagement: 'Make the content more engaging and compelling.',
    seo: 'Optimize the content for SEO while maintaining readability.',
  };

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `${prompts[type]} Return only the improved content, nothing else.`,
    },
    {
      role: 'user',
      content: content,
    },
  ];

  return chatCompletion(messages, {
    taskType: 'improve',
    maxTokens: 2000,
    temperature: 0.3,
  });
}

// ============================================================================
// LONG-FORM CONTENT FUNCTIONS
// ============================================================================

export async function generateBlogPost(
  topic: string,
  keywords: string[],
  wordCount: number = 1500,
  tone: 'professional' | 'casual' | 'authoritative' | 'conversational' = 'professional',
  options: HFGenerateOptions = {}
): Promise<{ title: string; content: string; metaDescription: string }> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are an expert content writer for AI SaaS and technology topics.
Write engaging, informative content that ranks well in search engines.
Always return valid JSON.`,
    },
    {
      role: 'user',
      content: `Write a comprehensive blog post about "${topic}".

Requirements:
- Approximately ${wordCount} words
- Tone: ${tone}
- Include these keywords naturally: ${keywords.join(', ')}
- Use proper headings (H2, H3)
- Include an engaging introduction and strong conclusion

Format your response as JSON:
{
  "title": "SEO-optimized title (50-60 characters)",
  "content": "Full blog post content with markdown formatting",
  "metaDescription": "Meta description for SEO (150-160 characters)"
}`,
    },
  ];

  const response = await chatCompletion(messages, {
    ...options,
    taskType: 'blog_post',
    model: options.model || 'glm-4-9b',
    maxTokens: 4000,
  });

  try {
    return JSON.parse(response);
  } catch {
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return { title: '', content: response, metaDescription: '' };
  }
}

export async function generateContentStrategy(
  businessDescription: string,
  targetAudience: string,
  goals: string[],
  timeframe: 'weekly' | 'monthly' | 'quarterly' = 'monthly'
): Promise<{
  overview: string;
  themes: string[];
  contentPlan: Array<{ week: number; topic: string; type: string; platform: string }>;
  kpis: string[];
}> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are a senior content strategist with expertise in digital marketing for SaaS companies.
Create data-driven content strategies that align with business goals.
Always return valid JSON.`,
    },
    {
      role: 'user',
      content: `Create a ${timeframe} content strategy for this business:

Business: ${businessDescription}
Target Audience: ${targetAudience}
Goals: ${goals.join(', ')}

Provide:
1. Strategic overview
2. Key content themes/pillars
3. Detailed content calendar
4. KPIs to track

Format as JSON:
{
  "overview": "Strategic overview paragraph",
  "themes": ["theme1", "theme2", ...],
  "contentPlan": [{ "week": 1, "topic": "...", "type": "blog/social/email", "platform": "..." }],
  "kpis": ["kpi1", "kpi2", ...]
}`,
    },
  ];

  const response = await chatCompletion(messages, {
    taskType: 'content_strategy',
    model: 'glm-4-9b',
    maxTokens: 4000,
  });

  try {
    return JSON.parse(response);
  } catch {
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return { overview: '', themes: [], contentPlan: [], kpis: [] };
  }
}

export async function repurposeContent(
  originalContent: string,
  originalType: 'blog_post' | 'email' | 'whitepaper',
  targetFormats: ('twitter' | 'linkedin' | 'instagram' | 'email_snippet' | 'summary')[]
): Promise<Record<string, string>> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are a content repurposing expert who adapts content for different platforms.
Understand platform-specific best practices and character limits.
Always return valid JSON.`,
    },
    {
      role: 'user',
      content: `Repurpose this ${originalType} into the following formats: ${targetFormats.join(', ')}

Original content:
${originalContent}

Return as JSON with format names as keys:
{
  "twitter": "...",
  "linkedin": "...",
  etc.
}`,
    },
  ];

  const response = await chatCompletion(messages, {
    taskType: 'repurpose',
    model: 'glm-4-9b',
    maxTokens: 3000,
  });

  try {
    return JSON.parse(response);
  } catch {
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return {};
  }
}

export async function generateLandingPageCopy(
  productName: string,
  productDescription: string,
  targetAudience: string,
  uniqueSellingPoints: string[]
): Promise<{
  headline: string;
  subheadline: string;
  heroDescription: string;
  features: Array<{ title: string; description: string }>;
  testimonialPrompts: string[];
  ctaText: string;
  faq: Array<{ question: string; answer: string }>;
}> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are a conversion copywriter specializing in SaaS landing pages.
Write copy that is clear, compelling, and drives action.
Focus on benefits over features.
Always return valid JSON.`,
    },
    {
      role: 'user',
      content: `Create compelling landing page copy for:

Product: ${productName}
Description: ${productDescription}
Target Audience: ${targetAudience}
USPs: ${uniqueSellingPoints.join(', ')}

Return as JSON:
{
  "headline": "Main hero headline (10 words max)",
  "subheadline": "Supporting subheadline",
  "heroDescription": "2-3 sentence hero description",
  "features": [{ "title": "...", "description": "..." }],
  "testimonialPrompts": ["questions to ask for testimonials"],
  "ctaText": "Call to action button text",
  "faq": [{ "question": "...", "answer": "..." }]
}`,
    },
  ];

  const response = await chatCompletion(messages, {
    taskType: 'landing_page',
    model: 'glm-4-9b',
    maxTokens: 4000,
  });

  try {
    return JSON.parse(response);
  } catch {
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return {
      headline: '',
      subheadline: '',
      heroDescription: '',
      features: [],
      testimonialPrompts: [],
      ctaText: '',
      faq: [],
    };
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
  }
): Promise<{
  summary: string;
  insights: string[];
  recommendations: string[];
  priorities: Array<{ action: string; impact: 'high' | 'medium' | 'low'; effort: 'high' | 'medium' | 'low' }>;
}> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `You are a senior marketing analyst with expertise in digital marketing metrics.
Provide actionable insights based on data, not generic advice.
Focus on specific, measurable improvements.
Always return valid JSON.`,
    },
    {
      role: 'user',
      content: `Analyze this marketing analytics data and provide actionable insights:

${JSON.stringify(analyticsData, null, 2)}

Provide:
1. Executive summary
2. Key insights
3. Specific recommendations
4. Prioritized actions

Return as JSON:
{
  "summary": "Executive summary paragraph",
  "insights": ["insight1", "insight2", ...],
  "recommendations": ["recommendation1", ...],
  "priorities": [{ "action": "...", "impact": "high/medium/low", "effort": "high/medium/low" }]
}`,
    },
  ];

  const response = await chatCompletion(messages, {
    taskType: 'insights',
    model: 'glm-4-9b',
    maxTokens: 2000,
  });

  try {
    return JSON.parse(response);
  } catch {
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return { summary: '', insights: [], recommendations: [], priorities: [] };
  }
}

// Export configuration and utilities
export const HuggingFace = {
  chatCompletion,
  generateSocialCaption,
  generateHashtags,
  generateEmailSubjects,
  generateAdCopy,
  analyzeSentiment,
  improveContent,
  generateBlogPost,
  generateContentStrategy,
  repurposeContent,
  generateLandingPageCopy,
  generateMarketingInsights,
  models: MODEL_CONFIGS,
  getModelForTask: (taskType: string): ModelId => TASK_MODEL_MAP[taskType] || 'glm-4-9b',
};

export default HuggingFace;
