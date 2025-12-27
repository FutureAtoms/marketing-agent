// Social Media Types

export type SocialPlatform = 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'youtube';

export type PostStatus = 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';

export interface SocialAccount {
  id: string;
  organization_id: string;
  platform: SocialPlatform;
  platform_user_id: string;
  platform_username: string | null;
  platform_name: string | null;
  platform_avatar_url: string | null;
  is_active: boolean;
  last_synced_at: string | null;
  follower_count: number;
  following_count: number;
  post_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: string;
  organization_id: string;
  created_by: string;
  status: PostStatus;
  content: string;
  media_urls: string[];
  media_types: string[];
  platforms: SocialPlatform[];
  scheduled_for: string | null;
  published_at: string | null;
  error_message: string | null;
  ai_generated: boolean;
  ai_prompt: string | null;
  metrics: PostMetrics;
  hashtags: string[];
  mentions: string[];
  link_url: string | null;
  link_preview: LinkPreview | null;
  is_thread: boolean;
  thread_position: number | null;
  parent_post_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostMetrics {
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  engagement_rate?: number;
}

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image_url?: string;
  site_name?: string;
}

export interface SocialPostResult {
  id: string;
  post_id: string;
  social_account_id: string;
  platform: SocialPlatform;
  platform_post_id: string | null;
  platform_post_url: string | null;
  status: 'pending' | 'published' | 'failed';
  error_message: string | null;
  published_at: string | null;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  engagement_rate: number;
  metrics_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaItem {
  id: string;
  organization_id: string;
  uploaded_by: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  public_url: string;
  thumbnail_url: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  alt_text: string | null;
  tags: string[];
  folder: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  event_type: 'social_post' | 'email_campaign' | 'blog_post' | 'event' | 'deadline' | 'other';
  reference_id: string | null;
  start_date: string;
  end_date: string | null;
  all_day: boolean;
  color: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Platform-specific configurations
export interface PlatformConfig {
  id: SocialPlatform;
  name: string;
  icon: string;
  color: string;
  maxChars: number;
  maxMedia: number;
  supportedMediaTypes: string[];
  supportsThreads: boolean;
  supportsScheduling: boolean;
  supportsAnalytics: boolean;
}

export const PLATFORM_CONFIGS: Record<SocialPlatform, PlatformConfig> = {
  twitter: {
    id: 'twitter',
    name: 'Twitter / X',
    icon: 'logo-twitter',
    color: '#1DA1F2',
    maxChars: 280,
    maxMedia: 4,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
    supportsThreads: true,
    supportsScheduling: true,
    supportsAnalytics: true,
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'logo-linkedin',
    color: '#0A66C2',
    maxChars: 3000,
    maxMedia: 9,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
    supportsThreads: false,
    supportsScheduling: true,
    supportsAnalytics: true,
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: 'logo-facebook',
    color: '#1877F2',
    maxChars: 63206,
    maxMedia: 10,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
    supportsThreads: false,
    supportsScheduling: true,
    supportsAnalytics: true,
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: 'logo-instagram',
    color: '#E4405F',
    maxChars: 2200,
    maxMedia: 10,
    supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
    supportsThreads: false,
    supportsScheduling: true,
    supportsAnalytics: true,
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'logo-tiktok',
    color: '#000000',
    maxChars: 2200,
    maxMedia: 1,
    supportedMediaTypes: ['video/mp4'],
    supportsThreads: false,
    supportsScheduling: false,
    supportsAnalytics: true,
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    icon: 'logo-youtube',
    color: '#FF0000',
    maxChars: 5000,
    maxMedia: 1,
    supportedMediaTypes: ['video/mp4'],
    supportsThreads: false,
    supportsScheduling: true,
    supportsAnalytics: true,
  },
};

// Post composer state
export interface PostComposerState {
  content: string;
  platforms: SocialPlatform[];
  mediaItems: MediaItem[];
  scheduledFor: Date | null;
  hashtags: string[];
  mentions: string[];
  linkUrl: string | null;
  isThread: boolean;
  threadPosts: string[];
}

// AI generation options
export interface AIGenerationOptions {
  tone: 'professional' | 'casual' | 'humorous' | 'inspirational' | 'educational';
  length: 'short' | 'medium' | 'long';
  includeEmojis: boolean;
  includeHashtags: boolean;
  targetPlatform: SocialPlatform;
  topic: string;
  keywords?: string[];
  brandVoice?: string;
}
