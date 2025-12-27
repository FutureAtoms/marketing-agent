-- Social Media Module Schema
-- This migration adds/updates social media functionality

-- Drop existing tables if they exist (clean slate for social module)
DROP TABLE IF EXISTS content_calendar CASCADE;
DROP TABLE IF EXISTS hashtag_analytics CASCADE;
DROP TABLE IF EXISTS social_post_results CASCADE;
DROP TABLE IF EXISTS media_library CASCADE;

-- Update existing social_accounts table or create new one
DROP TABLE IF EXISTS public.social_accounts CASCADE;

-- Recreate social_accounts with extended fields
CREATE TABLE public.social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'youtube')),
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  platform_name TEXT,
  platform_avatar_url TEXT,
  access_token TEXT, -- Should be encrypted in production
  refresh_token TEXT, -- Should be encrypted in production
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, platform, platform_user_id)
);

-- Update existing social_posts table
DROP TABLE IF EXISTS public.social_posts CASCADE;

-- Recreate social_posts with extended fields
CREATE TABLE public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  media_types TEXT[] DEFAULT '{}',
  platforms TEXT[] NOT NULL DEFAULT '{}',
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  error_message TEXT,
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  metrics JSONB DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  mentions TEXT[] DEFAULT '{}',
  link_url TEXT,
  link_preview JSONB,
  is_thread BOOLEAN DEFAULT false,
  thread_position INTEGER,
  parent_post_id UUID REFERENCES public.social_posts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform-specific post results
CREATE TABLE public.social_post_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_post_id TEXT,
  platform_post_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed')),
  error_message TEXT,
  published_at TIMESTAMPTZ,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  metrics_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, social_account_id)
);

-- Media library for uploaded assets
CREATE TABLE public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.users(id),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  alt_text TEXT,
  tags TEXT[] DEFAULT '{}',
  folder TEXT DEFAULT 'default',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hashtag suggestions and analytics
CREATE TABLE public.hashtag_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  hashtag TEXT NOT NULL,
  platform TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  avg_engagement DECIMAL(10,2) DEFAULT 0,
  avg_reach INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  trending_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, hashtag, platform)
);

-- Content calendar events
CREATE TABLE public.content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('social_post', 'email_campaign', 'blog_post', 'event', 'deadline', 'other')),
  reference_id UUID,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  color TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  assigned_to UUID[] DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_social_accounts_org ON public.social_accounts(organization_id);
CREATE INDEX idx_social_accounts_platform ON public.social_accounts(platform);
CREATE INDEX idx_social_accounts_active ON public.social_accounts(organization_id) WHERE is_active = true;
CREATE INDEX idx_social_posts_org ON public.social_posts(organization_id);
CREATE INDEX idx_social_posts_status ON public.social_posts(status);
CREATE INDEX idx_social_posts_scheduled ON public.social_posts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_social_post_results_post ON public.social_post_results(post_id);
CREATE INDEX idx_social_post_results_account ON public.social_post_results(social_account_id);
CREATE INDEX idx_media_library_org ON public.media_library(organization_id);
CREATE INDEX idx_media_library_folder ON public.media_library(organization_id, folder);
CREATE INDEX idx_content_calendar_org_date ON public.content_calendar(organization_id, start_date);

-- RLS Policies
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_post_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtag_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;

-- Social accounts policies
CREATE POLICY "Users can view org social accounts"
  ON public.social_accounts FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.team_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can insert social accounts"
  ON public.social_accounts FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.team_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can update social accounts"
  ON public.social_accounts FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.team_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can delete social accounts"
  ON public.social_accounts FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.team_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Social posts policies
CREATE POLICY "Users can view org posts"
  ON public.social_posts FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.team_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Editors can insert posts"
  ON public.social_posts FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.team_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
  ));

CREATE POLICY "Editors can update posts"
  ON public.social_posts FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.team_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
  ));

CREATE POLICY "Editors can delete posts"
  ON public.social_posts FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.team_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
  ));

-- Social post results policies
CREATE POLICY "Users can view org post results"
  ON public.social_post_results FOR SELECT
  USING (post_id IN (
    SELECT id FROM public.social_posts WHERE organization_id IN (
      SELECT organization_id FROM public.team_members WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "System can manage post results"
  ON public.social_post_results FOR ALL
  USING (true);

-- Media library policies
CREATE POLICY "Users can view org media"
  ON public.media_library FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.team_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Editors can insert media"
  ON public.media_library FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.team_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
  ));

CREATE POLICY "Editors can delete media"
  ON public.media_library FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.team_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
  ));

-- Content calendar policies
CREATE POLICY "Users can view org calendar"
  ON public.content_calendar FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.team_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Editors can manage calendar"
  ON public.content_calendar FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.team_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
  ));

-- Hashtag analytics policies
CREATE POLICY "Users can view org hashtags"
  ON public.hashtag_analytics FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.team_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can manage hashtags"
  ON public.hashtag_analytics FOR ALL
  USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_social_post_results_updated_at
  BEFORE UPDATE ON public.social_post_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_media_library_updated_at
  BEFORE UPDATE ON public.media_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_content_calendar_updated_at
  BEFORE UPDATE ON public.content_calendar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_hashtag_analytics_updated_at
  BEFORE UPDATE ON public.hashtag_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
