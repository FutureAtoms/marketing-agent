export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          plan: 'free' | 'starter' | 'pro' | 'enterprise';
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          plan?: 'free' | 'starter' | 'pro' | 'enterprise';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          logo_url?: string | null;
          plan?: 'free' | 'starter' | 'pro' | 'enterprise';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          updated_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          role: 'owner' | 'admin' | 'editor' | 'viewer';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          role?: 'owner' | 'admin' | 'editor' | 'viewer';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: 'owner' | 'admin' | 'editor' | 'viewer';
          updated_at?: string;
        };
      };
      social_accounts: {
        Row: {
          id: string;
          organization_id: string;
          platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'youtube';
          platform_user_id: string;
          platform_username: string | null;
          platform_name: string | null;
          platform_avatar_url: string | null;
          access_token: string;
          refresh_token: string | null;
          token_expires_at: string | null;
          is_active: boolean;
          last_synced_at: string | null;
          follower_count: number;
          following_count: number;
          post_count: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'youtube';
          platform_user_id: string;
          platform_username?: string | null;
          platform_name?: string | null;
          platform_avatar_url?: string | null;
          access_token: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          is_active?: boolean;
          last_synced_at?: string | null;
          follower_count?: number;
          following_count?: number;
          post_count?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          platform_username?: string | null;
          platform_name?: string | null;
          platform_avatar_url?: string | null;
          access_token?: string;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          is_active?: boolean;
          last_synced_at?: string | null;
          follower_count?: number;
          following_count?: number;
          post_count?: number;
          metadata?: Json;
          updated_at?: string;
        };
      };
      social_posts: {
        Row: {
          id: string;
          organization_id: string;
          created_by: string;
          status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
          content: string;
          media_urls: string[];
          media_types: string[];
          platforms: ('twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'youtube')[];
          scheduled_for: string | null;
          published_at: string | null;
          error_message: string | null;
          ai_generated: boolean;
          ai_prompt: string | null;
          metrics: Json;
          hashtags: string[];
          mentions: string[];
          link_url: string | null;
          link_preview: Json | null;
          is_thread: boolean;
          thread_position: number | null;
          parent_post_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          created_by: string;
          status?: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
          content: string;
          media_urls?: string[];
          media_types?: string[];
          platforms: ('twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'youtube')[];
          scheduled_for?: string | null;
          published_at?: string | null;
          error_message?: string | null;
          ai_generated?: boolean;
          ai_prompt?: string | null;
          metrics?: Json;
          hashtags?: string[];
          mentions?: string[];
          link_url?: string | null;
          link_preview?: Json | null;
          is_thread?: boolean;
          thread_position?: number | null;
          parent_post_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
          content?: string;
          media_urls?: string[];
          media_types?: string[];
          platforms?: ('twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'youtube')[];
          scheduled_for?: string | null;
          published_at?: string | null;
          error_message?: string | null;
          ai_generated?: boolean;
          ai_prompt?: string | null;
          metrics?: Json;
          hashtags?: string[];
          mentions?: string[];
          link_url?: string | null;
          link_preview?: Json | null;
          is_thread?: boolean;
          thread_position?: number | null;
          parent_post_id?: string | null;
          updated_at?: string;
        };
      };
      social_post_results: {
        Row: {
          id: string;
          post_id: string;
          social_account_id: string;
          platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'youtube';
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
        };
        Insert: {
          id?: string;
          post_id: string;
          social_account_id: string;
          platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'tiktok' | 'youtube';
          platform_post_id?: string | null;
          platform_post_url?: string | null;
          status?: 'pending' | 'published' | 'failed';
          error_message?: string | null;
          published_at?: string | null;
          impressions?: number;
          reach?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          saves?: number;
          clicks?: number;
          engagement_rate?: number;
          metrics_updated_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          platform_post_id?: string | null;
          platform_post_url?: string | null;
          status?: 'pending' | 'published' | 'failed';
          error_message?: string | null;
          published_at?: string | null;
          impressions?: number;
          reach?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          saves?: number;
          clicks?: number;
          engagement_rate?: number;
          metrics_updated_at?: string | null;
          updated_at?: string;
        };
      };
      media_library: {
        Row: {
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
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          uploaded_by: string;
          file_name: string;
          file_type: string;
          file_size: number;
          storage_path: string;
          public_url: string;
          thumbnail_url?: string | null;
          width?: number | null;
          height?: number | null;
          duration?: number | null;
          alt_text?: string | null;
          tags?: string[];
          folder?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          file_name?: string;
          thumbnail_url?: string | null;
          alt_text?: string | null;
          tags?: string[];
          folder?: string;
          metadata?: Json;
          updated_at?: string;
        };
      };
      content_calendar: {
        Row: {
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
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          description?: string | null;
          event_type: 'social_post' | 'email_campaign' | 'blog_post' | 'event' | 'deadline' | 'other';
          reference_id?: string | null;
          start_date: string;
          end_date?: string | null;
          all_day?: boolean;
          color?: string | null;
          status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
          assigned_to?: string[];
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          event_type?: 'social_post' | 'email_campaign' | 'blog_post' | 'event' | 'deadline' | 'other';
          reference_id?: string | null;
          start_date?: string;
          end_date?: string | null;
          all_day?: boolean;
          color?: string | null;
          status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
          assigned_to?: string[];
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          company: string | null;
          phone: string | null;
          lead_score: number;
          status: 'lead' | 'qualified' | 'customer' | 'churned';
          source: string | null;
          tags: string[];
          custom_fields: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          company?: string | null;
          phone?: string | null;
          lead_score?: number;
          status?: 'lead' | 'qualified' | 'customer' | 'churned';
          source?: string | null;
          tags?: string[];
          custom_fields?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          company?: string | null;
          phone?: string | null;
          lead_score?: number;
          status?: 'lead' | 'qualified' | 'customer' | 'churned';
          source?: string | null;
          tags?: string[];
          custom_fields?: Json;
          updated_at?: string;
        };
      };
      email_campaigns: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          subject: string;
          content: string;
          status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
          scheduled_at: string | null;
          sent_at: string | null;
          segment_id: string | null;
          stats: Json;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          subject: string;
          content: string;
          status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
          scheduled_at?: string | null;
          sent_at?: string | null;
          segment_id?: string | null;
          stats?: Json;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          subject?: string;
          content?: string;
          status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
          scheduled_at?: string | null;
          sent_at?: string | null;
          segment_id?: string | null;
          stats?: Json;
          updated_at?: string;
        };
      };
      landing_pages: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          slug: string;
          content: Json;
          status: 'draft' | 'published' | 'archived';
          custom_domain: string | null;
          stats: Json;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          slug: string;
          content: Json;
          status?: 'draft' | 'published' | 'archived';
          custom_domain?: string | null;
          stats?: Json;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          content?: Json;
          status?: 'draft' | 'published' | 'archived';
          custom_domain?: string | null;
          stats?: Json;
          updated_at?: string;
        };
      };
      content_pieces: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          content: string;
          type: 'blog_post' | 'article' | 'social_post' | 'email_template';
          status: 'draft' | 'review' | 'published' | 'archived';
          seo_metadata: Json;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          content: string;
          type: 'blog_post' | 'article' | 'social_post' | 'email_template';
          status?: 'draft' | 'review' | 'published' | 'archived';
          seo_metadata?: Json;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          type?: 'blog_post' | 'article' | 'social_post' | 'email_template';
          status?: 'draft' | 'review' | 'published' | 'archived';
          seo_metadata?: Json;
          updated_at?: string;
        };
      };
      deals: {
        Row: {
          id: string;
          organization_id: string;
          contact_id: string;
          title: string;
          company: string | null;
          value: number;
          currency: string;
          stage: string;
          probability: number;
          expected_close_date: string | null;
          actual_close_date: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          contact_id: string;
          title: string;
          company?: string | null;
          value: number;
          currency?: string;
          stage?: string;
          probability?: number;
          expected_close_date?: string | null;
          actual_close_date?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          contact_id?: string;
          title?: string;
          company?: string | null;
          value?: number;
          currency?: string;
          stage?: string;
          probability?: number;
          expected_close_date?: string | null;
          actual_close_date?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      pipeline_stages: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          order: number;
          color: string;
          probability: number;
          is_won: boolean;
          is_lost: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          order?: number;
          color?: string;
          probability?: number;
          is_won?: boolean;
          is_lost?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          order?: number;
          color?: string;
          probability?: number;
          is_won?: boolean;
          is_lost?: boolean;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row'];
export type Organization = Database['public']['Tables']['organizations']['Row'];
export type TeamMember = Database['public']['Tables']['team_members']['Row'];
export type SocialAccountDB = Database['public']['Tables']['social_accounts']['Row'];
export type SocialPostDB = Database['public']['Tables']['social_posts']['Row'];
export type SocialPostResult = Database['public']['Tables']['social_post_results']['Row'];
export type MediaLibraryItem = Database['public']['Tables']['media_library']['Row'];
export type ContentCalendarEvent = Database['public']['Tables']['content_calendar']['Row'];
export type Contact = Database['public']['Tables']['contacts']['Row'];
export type EmailCampaign = Database['public']['Tables']['email_campaigns']['Row'];
export type LandingPage = Database['public']['Tables']['landing_pages']['Row'];
export type ContentPiece = Database['public']['Tables']['content_pieces']['Row'];
export type DealDB = Database['public']['Tables']['deals']['Row'];
export type PipelineStageDB = Database['public']['Tables']['pipeline_stages']['Row'];
