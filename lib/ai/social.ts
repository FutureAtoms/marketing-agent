// AI-powered social media content generation (fetch-based for web compatibility)
import type { SocialPlatform, AIGenerationOptions } from '../../types/social';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const platformCharLimits: Record<SocialPlatform, number> = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
  tiktok: 2200,
  youtube: 5000,
};

// Helper function to call OpenAI API
async function callOpenAI(
  messages: { role: string; content: string }[],
  maxTokens = 500,
  temperature = 0.7
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'sk-your-openai-key-here') {
    // Return mock response for development
    return 'Sample AI-generated content for development. Configure EXPO_PUBLIC_OPENAI_API_KEY for real responses.';
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return '';
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('OpenAI API call failed:', error);
    return '';
  }
}

// Generate social media caption
export async function generateCaption(options: AIGenerationOptions): Promise<string> {
  const { tone, length, includeEmojis, targetPlatform, topic, keywords, brandVoice } = options;

  const charLimit = platformCharLimits[targetPlatform];
  const lengthGuide = length === 'short' ? 'concise (1-2 sentences)' :
                      length === 'medium' ? 'moderate (2-3 sentences)' :
                      'detailed (3-4 sentences)';

  const prompt = `Generate a ${tone} social media post for ${targetPlatform} about: ${topic}

Requirements:
- Length: ${lengthGuide}
- Maximum characters: ${charLimit}
- Tone: ${tone}
${includeEmojis ? '- Include relevant emojis' : '- No emojis'}
${keywords?.length ? `- Include keywords: ${keywords.join(', ')}` : ''}
${brandVoice ? `- Brand voice: ${brandVoice}` : ''}

Return ONLY the caption text, nothing else.`;

  return callOpenAI([
    {
      role: 'system',
      content: 'You are a social media marketing expert who creates engaging, platform-optimized content.',
    },
    { role: 'user', content: prompt },
  ], 500, 0.8);
}

// Generate hashtag suggestions
export async function generateHashtags(
  content: string,
  platform: SocialPlatform,
  count = 10
): Promise<string[]> {
  const prompt = `Analyze this social media post and suggest ${count} relevant hashtags for ${platform}:

"${content}"

Requirements:
- Return hashtags optimized for ${platform}
- Include a mix of popular and niche hashtags
- Format: #hashtag (lowercase, no spaces)
- Return as JSON array: ["#hashtag1", "#hashtag2", ...]`;

  const response = await callOpenAI([
    {
      role: 'system',
      content: 'You are a social media hashtag expert. Return only valid JSON.',
    },
    { role: 'user', content: prompt },
  ], 200, 0.7);

  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch {
    return [];
  }
}

// Optimize content for specific platform
export async function optimizeForPlatform(
  content: string,
  fromPlatform: SocialPlatform,
  toPlatform: SocialPlatform
): Promise<string> {
  const toCharLimit = platformCharLimits[toPlatform];

  const prompt = `Adapt this ${fromPlatform} post for ${toPlatform}:

Original post:
"${content}"

Requirements:
- Maximum ${toCharLimit} characters
- Optimize for ${toPlatform}'s audience and style
- Maintain the core message
- Adjust hashtags if needed

Return ONLY the adapted caption.`;

  const result = await callOpenAI([
    {
      role: 'system',
      content: 'You are a cross-platform social media expert.',
    },
    { role: 'user', content: prompt },
  ], 500, 0.7);

  return result || content;
}

// Generate content variations
export async function generateVariations(
  content: string,
  platform: SocialPlatform,
  count = 3
): Promise<string[]> {
  const charLimit = platformCharLimits[platform];

  const prompt = `Create ${count} variations of this ${platform} post:

Original:
"${content}"

Requirements:
- Each variation should have a different angle/approach
- Maximum ${charLimit} characters each
- Maintain the core message
- Number each variation

Return as a numbered list.`;

  const text = await callOpenAI([
    {
      role: 'system',
      content: 'You are a creative social media copywriter.',
    },
    { role: 'user', content: prompt },
  ], 800, 0.9);

  // Parse numbered variations
  const variations: string[] = [];
  const lines = text.split('\n');
  let currentVariation = '';

  for (const line of lines) {
    if (/^\d+[\.\)]\s/.test(line)) {
      if (currentVariation) {
        variations.push(currentVariation.trim());
      }
      currentVariation = line.replace(/^\d+[\.\)]\s*/, '');
    } else if (currentVariation) {
      currentVariation += ' ' + line;
    }
  }
  if (currentVariation) {
    variations.push(currentVariation.trim());
  }

  return variations.slice(0, count);
}

// Analyze content sentiment and engagement potential
export async function analyzeContent(content: string, platform: SocialPlatform): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative';
  engagementScore: number;
  suggestions: string[];
  readabilityScore: number;
}> {
  const prompt = `Analyze this ${platform} post for engagement potential:

"${content}"

Provide analysis as JSON:
{
  "sentiment": "positive" | "neutral" | "negative",
  "engagementScore": 1-100,
  "suggestions": ["suggestion1", "suggestion2", ...],
  "readabilityScore": 1-100
}`;

  const response = await callOpenAI([
    {
      role: 'system',
      content: 'You are a social media analytics expert. Return only valid JSON.',
    },
    { role: 'user', content: prompt },
  ], 300, 0.5);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Return defaults
  }

  return {
    sentiment: 'neutral',
    engagementScore: 50,
    suggestions: [],
    readabilityScore: 70,
  };
}

// Generate best posting times
export async function suggestPostingTimes(
  platform: SocialPlatform,
  timezone: string = 'America/New_York'
): Promise<{ day: string; times: string[] }[]> {
  // This would ideally use analytics data, but we'll use general best practices
  const bestTimes: Record<SocialPlatform, { day: string; times: string[] }[]> = {
    twitter: [
      { day: 'Monday', times: ['9:00 AM', '12:00 PM', '5:00 PM'] },
      { day: 'Tuesday', times: ['9:00 AM', '12:00 PM', '5:00 PM'] },
      { day: 'Wednesday', times: ['9:00 AM', '12:00 PM', '5:00 PM'] },
      { day: 'Thursday', times: ['9:00 AM', '12:00 PM', '5:00 PM'] },
      { day: 'Friday', times: ['9:00 AM', '12:00 PM'] },
    ],
    linkedin: [
      { day: 'Tuesday', times: ['8:00 AM', '10:00 AM', '12:00 PM'] },
      { day: 'Wednesday', times: ['8:00 AM', '10:00 AM', '12:00 PM'] },
      { day: 'Thursday', times: ['8:00 AM', '10:00 AM', '12:00 PM'] },
    ],
    facebook: [
      { day: 'Wednesday', times: ['11:00 AM', '1:00 PM'] },
      { day: 'Thursday', times: ['11:00 AM', '1:00 PM'] },
      { day: 'Friday', times: ['9:00 AM', '11:00 AM'] },
    ],
    instagram: [
      { day: 'Monday', times: ['11:00 AM', '2:00 PM'] },
      { day: 'Tuesday', times: ['11:00 AM', '2:00 PM'] },
      { day: 'Wednesday', times: ['11:00 AM'] },
      { day: 'Friday', times: ['10:00 AM', '11:00 AM'] },
    ],
    tiktok: [
      { day: 'Tuesday', times: ['9:00 AM', '12:00 PM', '7:00 PM'] },
      { day: 'Thursday', times: ['12:00 PM', '7:00 PM'] },
      { day: 'Friday', times: ['5:00 PM', '7:00 PM'] },
    ],
    youtube: [
      { day: 'Thursday', times: ['2:00 PM', '4:00 PM'] },
      { day: 'Friday', times: ['2:00 PM', '4:00 PM'] },
      { day: 'Saturday', times: ['9:00 AM', '11:00 AM'] },
    ],
  };

  return bestTimes[platform] || [];
}

// Generate thread from long content
export async function generateThread(
  content: string,
  platform: 'twitter' = 'twitter'
): Promise<string[]> {
  const charLimit = 280;

  const prompt = `Convert this content into a Twitter thread:

"${content}"

Requirements:
- Each tweet max ${charLimit} characters
- Make it engaging and readable as a thread
- Use numbers (1/, 2/, etc.) for continuity
- End with a call to action

Return as JSON array: ["tweet1", "tweet2", ...]`;

  const response = await callOpenAI([
    {
      role: 'system',
      content: 'You are a Twitter thread expert. Return only valid JSON.',
    },
    { role: 'user', content: prompt },
  ], 1000, 0.7);

  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Return single tweet
  }

  return [content.slice(0, charLimit)];
}
