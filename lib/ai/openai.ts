import { Platform } from 'react-native';

// Use fetch-based implementation for web compatibility (avoids import.meta issues)
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  response_format?: { type: 'json_object' | 'text' };
}

interface ChatCompletionResponse {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Fetch-based OpenAI client for web compatibility
async function createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'sk-your-openai-key-here') {
    // Return mock response for development without API key
    console.warn('OpenAI API key not configured. Using mock response.');
    return {
      id: 'mock-' + Date.now(),
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: getMockResponse(request),
        },
        finish_reason: 'stop',
      }],
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }

  return response.json();
}

// Mock responses for development
function getMockResponse(request: ChatCompletionRequest): string {
  const userMessage = request.messages.find(m => m.role === 'user')?.content || '';

  if (request.response_format?.type === 'json_object') {
    // Return appropriate mock JSON based on context
    if (userMessage.includes('ad copy')) {
      return JSON.stringify({
        headline: 'Transform Your Business Today',
        description: 'Discover powerful solutions that drive real results for your team.',
        cta: 'Get Started'
      });
    }
    if (userMessage.includes('sentiment') || request.messages[0]?.content?.includes('sentiment')) {
      return JSON.stringify({
        sentiment: 'positive',
        score: 0.85,
        summary: 'The content has an optimistic and encouraging tone.'
      });
    }
    return JSON.stringify({ result: 'Mock response' });
  }

  // Return mock text responses
  if (userMessage.toLowerCase().includes('hashtag')) {
    return 'marketing\ndigital\nstrategy\ngrowth\nsuccess';
  }
  if (userMessage.toLowerCase().includes('subject')) {
    return 'Unlock Your Potential Today\nDon\'t Miss This Opportunity\nExclusive Offer Inside\nYour Success Starts Here\nLimited Time Only';
  }

  return 'This is a mock response for development. Configure your OpenAI API key in .env to get real AI responses.';
}

export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
}

// Generate social media caption
export async function generateSocialCaption(
  topic: string,
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram',
  tone: 'professional' | 'casual' | 'witty' | 'informative' = 'professional',
  options: GenerateOptions = {}
): Promise<string> {
  const platformLimits = {
    twitter: 280,
    linkedin: 3000,
    facebook: 500,
    instagram: 2200,
  };

  const response = await createChatCompletion({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are a social media expert. Generate engaging ${platform} posts that are ${tone} in tone.
Keep posts under ${platformLimits[platform]} characters. Include relevant emojis and hashtags when appropriate.
For LinkedIn, be more professional. For Instagram, be more visual and use more emojis.
For Twitter, be concise and punchy. For Facebook, be conversational.`,
      },
      {
        role: 'user',
        content: `Write a ${platform} post about: ${topic}`,
      },
    ],
    max_tokens: options.maxTokens || 500,
    temperature: options.temperature || 0.7,
  });

  return response.choices[0]?.message?.content || '';
}

// Generate hashtag suggestions
export async function generateHashtags(
  content: string,
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram',
  count: number = 5
): Promise<string[]> {
  const response = await createChatCompletion({
    model: 'gpt-4-turbo-preview',
    messages: [
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
    ],
    max_tokens: 100,
    temperature: 0.5,
  });

  const text = response.choices[0]?.message?.content || '';
  return text.split('\n').filter(Boolean).map((tag) => `#${tag.replace('#', '').trim()}`);
}

// Generate email subject lines
export async function generateEmailSubjects(
  emailContent: string,
  count: number = 5
): Promise<string[]> {
  const response = await createChatCompletion({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `Generate ${count} compelling email subject lines.
Subject lines should be under 60 characters, create urgency or curiosity, and be relevant to the content.
Return only the subject lines, one per line.`,
      },
      {
        role: 'user',
        content: `Generate subject lines for this email:\n\n${emailContent}`,
      },
    ],
    max_tokens: 200,
    temperature: 0.8,
  });

  const text = response.choices[0]?.message?.content || '';
  return text.split('\n').filter(Boolean);
}

// Generate ad copy
export async function generateAdCopy(
  product: string,
  targetAudience: string,
  platform: 'google' | 'facebook' | 'instagram',
  options: GenerateOptions = {}
): Promise<{ headline: string; description: string; cta: string }> {
  const response = await createChatCompletion({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an advertising copywriter. Generate compelling ad copy for ${platform}.
Return the response in this exact JSON format:
{
  "headline": "Short attention-grabbing headline (max 30 chars for Google, 40 for others)",
  "description": "Compelling description (max 90 chars for Google, 125 for others)",
  "cta": "Call to action button text (max 15 chars)"
}`,
      },
      {
        role: 'user',
        content: `Create ad copy for: ${product}\nTarget audience: ${targetAudience}`,
      },
    ],
    max_tokens: options.maxTokens || 300,
    temperature: options.temperature || 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content || '{}';
  return JSON.parse(content);
}

// Analyze content sentiment
export async function analyzeSentiment(
  content: string
): Promise<{ sentiment: 'positive' | 'negative' | 'neutral'; score: number; summary: string }> {
  const response = await createChatCompletion({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `Analyze the sentiment of the provided content.
Return the response in this exact JSON format:
{
  "sentiment": "positive" | "negative" | "neutral",
  "score": 0.0 to 1.0 (how confident you are in the sentiment),
  "summary": "Brief explanation of why this sentiment was detected"
}`,
      },
      {
        role: 'user',
        content: content,
      },
    ],
    max_tokens: 200,
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const result = response.choices[0]?.message?.content || '{}';
  return JSON.parse(result);
}

// Quick content improvements
export async function improveContent(
  content: string,
  type: 'grammar' | 'clarity' | 'engagement' | 'seo'
): Promise<string> {
  const prompts = {
    grammar: 'Fix any grammar, spelling, or punctuation errors.',
    clarity: 'Improve the clarity and readability while keeping the same meaning.',
    engagement: 'Make the content more engaging and compelling while keeping the core message.',
    seo: 'Optimize the content for SEO while maintaining readability.',
  };

  const response = await createChatCompletion({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `${prompts[type]} Return only the improved content, nothing else.`,
      },
      {
        role: 'user',
        content: content,
      },
    ],
    max_tokens: 2000,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content || content;
}

// Export a compatible interface
const openai = {
  chat: {
    completions: {
      create: createChatCompletion,
    },
  },
};

export default openai;
