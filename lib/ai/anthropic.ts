// Fetch-based Anthropic client for web compatibility (avoids import.meta issues)
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicRequest {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  system?: string;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{ type: 'text'; text: string }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

// Fetch-based Anthropic client
async function createMessage(request: AnthropicRequest): Promise<AnthropicResponse> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'sk-ant-your-anthropic-key-here') {
    // Return mock response for development without API key
    console.warn('Anthropic API key not configured. Using mock response.');
    return {
      id: 'mock-' + Date.now(),
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: getMockResponse(request) }],
      model: request.model,
      stop_reason: 'end_turn',
      usage: { input_tokens: 0, output_tokens: 0 },
    };
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
  }

  return response.json();
}

// Mock responses for development
function getMockResponse(request: AnthropicRequest): string {
  const userMessage = request.messages.find(m => m.role === 'user')?.content || '';

  // Blog post mock
  if (userMessage.includes('blog post')) {
    return JSON.stringify({
      title: 'How AI is Transforming Modern Marketing',
      content: '## Introduction\n\nIn today\'s fast-paced digital landscape, AI is revolutionizing how businesses approach marketing...\n\n## Key Benefits\n\n### Personalization at Scale\n\nAI enables marketers to deliver personalized experiences to millions of customers simultaneously...\n\n## Conclusion\n\nThe future of marketing is AI-powered, and businesses that embrace these technologies will lead their industries.',
      metaDescription: 'Discover how AI is transforming marketing strategies and helping businesses achieve unprecedented growth.'
    });
  }

  // Content strategy mock
  if (userMessage.includes('content strategy')) {
    return JSON.stringify({
      overview: 'A comprehensive content strategy focused on building authority and driving conversions.',
      themes: ['Industry Insights', 'Product Features', 'Customer Success', 'Thought Leadership'],
      contentPlan: [
        { week: 1, topic: 'Introduction to AI Marketing', type: 'blog', platform: 'website' },
        { week: 2, topic: 'Case Study: Customer Success', type: 'social', platform: 'linkedin' },
        { week: 3, topic: 'Product Update Announcement', type: 'email', platform: 'newsletter' },
        { week: 4, topic: 'Industry Trends Report', type: 'blog', platform: 'website' }
      ],
      kpis: ['Website traffic', 'Email open rate', 'Social engagement', 'Lead generation']
    });
  }

  // Landing page mock
  if (userMessage.includes('landing page')) {
    return JSON.stringify({
      headline: 'Transform Your Marketing with AI',
      subheadline: 'Automate, optimize, and scale your campaigns like never before',
      heroDescription: 'Our AI-powered platform helps marketing teams create better content, reach the right audience, and measure what matters.',
      features: [
        { title: 'AI Content Generation', description: 'Create compelling content in seconds' },
        { title: 'Smart Scheduling', description: 'Post at the perfect time for maximum engagement' },
        { title: 'Analytics Dashboard', description: 'Track performance across all channels' }
      ],
      testimonialPrompts: ['What results have you seen?', 'How has it saved you time?'],
      ctaText: 'Start Free Trial',
      faq: [
        { question: 'How does the AI work?', answer: 'Our AI uses advanced language models to understand your brand and generate relevant content.' },
        { question: 'Is there a free trial?', answer: 'Yes, we offer a 14-day free trial with full access to all features.' }
      ]
    });
  }

  // Marketing insights mock
  if (userMessage.includes('analytics')) {
    return JSON.stringify({
      summary: 'Overall performance is strong with room for improvement in conversion optimization.',
      insights: [
        'Traffic from organic search is growing steadily',
        'Mobile users have a higher bounce rate than desktop',
        'Top-performing pages are product-focused'
      ],
      recommendations: [
        'Optimize mobile experience to reduce bounce rate',
        'Create more product-focused content',
        'Implement A/B testing on landing pages'
      ],
      priorities: [
        { action: 'Mobile optimization', impact: 'high', effort: 'medium' },
        { action: 'Content expansion', impact: 'medium', effort: 'low' },
        { action: 'A/B testing setup', impact: 'high', effort: 'high' }
      ]
    });
  }

  // Repurpose content mock
  if (userMessage.includes('Repurpose')) {
    return JSON.stringify({
      twitter: 'Excited to share our latest insights on AI marketing! Key takeaway: Personalization at scale is now possible.',
      linkedin: 'We\'ve just published a comprehensive guide on how AI is transforming marketing strategies. Here are the key insights...',
      summary: 'This article explores how AI enables marketers to deliver personalized experiences at scale while improving efficiency.'
    });
  }

  return JSON.stringify({ result: 'Mock response for development. Configure your Anthropic API key to get real responses.' });
}

export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
}

// Generate long-form blog post
export async function generateBlogPost(
  topic: string,
  keywords: string[],
  wordCount: number = 1500,
  tone: 'professional' | 'casual' | 'authoritative' | 'conversational' = 'professional',
  options: GenerateOptions = {}
): Promise<{ title: string; content: string; metaDescription: string }> {
  const response = await createMessage({
    model: 'claude-sonnet-4-20250514',
    max_tokens: options.maxTokens || 4000,
    messages: [
      {
        role: 'user',
        content: `Write a comprehensive blog post about "${topic}".

Requirements:
- Approximately ${wordCount} words
- Tone: ${tone}
- Include these keywords naturally: ${keywords.join(', ')}
- Use proper headings (H2, H3)
- Include an engaging introduction and strong conclusion
- Add actionable insights and examples

Format your response as JSON:
{
  "title": "SEO-optimized title (50-60 characters)",
  "content": "Full blog post content with markdown formatting",
  "metaDescription": "Meta description for SEO (150-160 characters)"
}`,
      },
    ],
    system: `You are an expert content writer specializing in AI SaaS and technology topics.
You write engaging, informative content that ranks well in search engines while providing genuine value to readers.
Always return valid JSON.`,
  });

  const textContent = response.content.find((block) => block.type === 'text');
  const text = textContent?.text || '{}';

  try {
    return JSON.parse(text);
  } catch {
    // If JSON parsing fails, try to extract from markdown code block
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return { title: '', content: text, metaDescription: '' };
  }
}

// Generate content strategy
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
  const response = await createMessage({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `Create a ${timeframe} content strategy for this business:

Business: ${businessDescription}
Target Audience: ${targetAudience}
Goals: ${goals.join(', ')}

Provide a comprehensive content strategy with:
1. Strategic overview
2. Key content themes/pillars
3. Detailed content calendar
4. KPIs to track

Format as JSON:
{
  "overview": "Strategic overview paragraph",
  "themes": ["theme1", "theme2", ...],
  "contentPlan": [
    { "week": 1, "topic": "...", "type": "blog/social/email", "platform": "..." }
  ],
  "kpis": ["kpi1", "kpi2", ...]
}`,
      },
    ],
    system: `You are a senior content strategist with expertise in digital marketing for SaaS companies.
You create data-driven content strategies that align with business goals.
Always return valid JSON.`,
  });

  const textContent = response.content.find((block) => block.type === 'text');
  const text = textContent?.text || '{}';

  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return { overview: '', themes: [], contentPlan: [], kpis: [] };
  }
}

// Repurpose content across platforms
export async function repurposeContent(
  originalContent: string,
  originalType: 'blog_post' | 'email' | 'whitepaper',
  targetFormats: ('twitter' | 'linkedin' | 'instagram' | 'email_snippet' | 'summary')[]
): Promise<Record<string, string>> {
  const response = await createMessage({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: `Repurpose this ${originalType} into the following formats: ${targetFormats.join(', ')}

Original content:
${originalContent}

Create optimized versions for each platform/format while maintaining the core message.
Consider character limits and best practices for each platform.

Return as JSON with format names as keys:
{
  "twitter": "...",
  "linkedin": "...",
  etc.
}`,
      },
    ],
    system: `You are a content repurposing expert who adapts content for different platforms while maintaining message consistency.
You understand platform-specific best practices and character limits.
Always return valid JSON.`,
  });

  const textContent = response.content.find((block) => block.type === 'text');
  const text = textContent?.text || '{}';

  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return {};
  }
}

// Generate landing page copy
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
  const response = await createMessage({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `Create compelling landing page copy for:

Product: ${productName}
Description: ${productDescription}
Target Audience: ${targetAudience}
USPs: ${uniqueSellingPoints.join(', ')}

Generate copy that converts visitors to leads/customers.

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
    ],
    system: `You are a conversion copywriter specializing in SaaS landing pages.
You write copy that is clear, compelling, and drives action.
Focus on benefits over features, and use social proof effectively.
Always return valid JSON.`,
  });

  const textContent = response.content.find((block) => block.type === 'text');
  const text = textContent?.text || '{}';

  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
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

// Generate marketing insights from analytics data
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
  const response = await createMessage({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [
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
    ],
    system: `You are a senior marketing analyst with expertise in digital marketing metrics.
You provide actionable insights based on data, not generic advice.
Focus on specific, measurable improvements.
Always return valid JSON.`,
  });

  const textContent = response.content.find((block) => block.type === 'text');
  const text = textContent?.text || '{}';

  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    return { summary: '', insights: [], recommendations: [], priorities: [] };
  }
}

// Export a compatible interface
const anthropic = {
  messages: {
    create: createMessage,
  },
};

export default anthropic;
