import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useOrgStore } from '../stores/orgStore';
import type {
  SocialAccount,
  SocialPost,
  SocialPostResult,
  MediaItem,
  CalendarEvent,
  SocialPlatform,
  PostStatus,
} from '../types/social';

// Fetch connected social accounts
export function useSocialAccounts() {
  const { currentOrg } = useOrgStore();

  return useQuery({
    queryKey: ['social-accounts', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('organization_id', currentOrg.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SocialAccount[];
    },
    enabled: !!currentOrg?.id,
  });
}

// Fetch social posts with filters
export function useSocialPosts(options?: {
  status?: PostStatus | PostStatus[];
  platform?: SocialPlatform;
  limit?: number;
}) {
  const { currentOrg } = useOrgStore();

  return useQuery({
    queryKey: ['social-posts', currentOrg?.id, options],
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      let query = supabase
        .from('social_posts')
        .select('*')
        .eq('organization_id', currentOrg.id)
        .order('created_at', { ascending: false });

      if (options?.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status', options.status);
        } else {
          query = query.eq('status', options.status);
        }
      }

      if (options?.platform) {
        query = query.contains('platforms', [options.platform]);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SocialPost[];
    },
    enabled: !!currentOrg?.id,
  });
}

// Fetch scheduled posts for calendar
export function useScheduledPosts(startDate: Date, endDate: Date) {
  const { currentOrg } = useOrgStore();

  return useQuery({
    queryKey: ['scheduled-posts', currentOrg?.id, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      const { data, error } = await supabase
        .from('social_posts')
        .select('*')
        .eq('organization_id', currentOrg.id)
        .in('status', ['scheduled', 'published'])
        .gte('scheduled_for', startDate.toISOString())
        .lte('scheduled_for', endDate.toISOString())
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      return data as SocialPost[];
    },
    enabled: !!currentOrg?.id,
  });
}

// Create new social post
export function useCreatePost() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrgStore();

  return useMutation({
    mutationFn: async (post: Partial<SocialPost>) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      if (!currentOrg?.id) throw new Error('No organization selected');

      const insertData = {
        content: post.content || '',
        platforms: post.platforms || [],
        organization_id: currentOrg.id,
        created_by: userData.user.id,
        status: post.status || 'draft',
        media_urls: post.media_urls || [],
        media_types: post.media_types || [],
        scheduled_for: post.scheduled_for,
        ai_generated: post.ai_generated || false,
        ai_prompt: post.ai_prompt,
        hashtags: post.hashtags || [],
        mentions: post.mentions || [],
        link_url: post.link_url,
        is_thread: post.is_thread || false,
        thread_position: post.thread_position,
        parent_post_id: post.parent_post_id,
      };

      const { data, error } = await (supabase
        .from('social_posts') as any)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as SocialPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
    },
  });
}

// Update social post
export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SocialPost> & { id: string }) => {
      const updateData = {
        status: updates.status,
        content: updates.content,
        media_urls: updates.media_urls,
        media_types: updates.media_types,
        platforms: updates.platforms,
        scheduled_for: updates.scheduled_for,
        hashtags: updates.hashtags,
        mentions: updates.mentions,
        link_url: updates.link_url,
        is_thread: updates.is_thread,
      };

      const { data, error } = await (supabase
        .from('social_posts') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as SocialPost;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
    },
  });
}

// Delete social post
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('social_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-posts'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
    },
  });
}

// Fetch media library
export function useMediaLibrary(folder?: string) {
  const { currentOrg } = useOrgStore();

  return useQuery({
    queryKey: ['media-library', currentOrg?.id, folder],
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      let query = supabase
        .from('media_library')
        .select('*')
        .eq('organization_id', currentOrg.id)
        .order('created_at', { ascending: false });

      if (folder) {
        query = query.eq('folder', folder);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MediaItem[];
    },
    enabled: !!currentOrg?.id,
  });
}

// Upload media
export function useUploadMedia() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrgStore();

  return useMutation({
    mutationFn: async ({
      file,
      folder = 'default',
    }: {
      file: { uri: string; name: string; type: string; size: number };
      folder?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');
      if (!currentOrg?.id) throw new Error('No organization selected');

      // Upload to Supabase Storage
      const fileName = `${currentOrg.id}/${folder}/${Date.now()}-${file.name}`;

      const response = await fetch(file.uri);
      const blob = await response.blob();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, blob, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(fileName);

      // Save to database
      const insertData = {
        organization_id: currentOrg.id,
        uploaded_by: userData.user.id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: fileName,
        public_url: urlData.publicUrl,
        folder,
      };

      const { data, error } = await (supabase
        .from('media_library') as any)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as MediaItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
    },
  });
}

// Delete media
export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (media: MediaItem) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([media.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error } = await supabase
        .from('media_library')
        .delete()
        .eq('id', media.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
    },
  });
}

// Fetch calendar events
export function useCalendarEvents(startDate: Date, endDate: Date) {
  const { currentOrg } = useOrgStore();

  return useQuery({
    queryKey: ['calendar-events', currentOrg?.id, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      if (!currentOrg?.id) return [];

      const { data, error } = await supabase
        .from('content_calendar')
        .select('*')
        .eq('organization_id', currentOrg.id)
        .gte('start_date', startDate.toISOString())
        .lte('start_date', endDate.toISOString())
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data as CalendarEvent[];
    },
    enabled: !!currentOrg?.id,
  });
}

// Get post analytics
export function usePostAnalytics(postId: string) {
  return useQuery({
    queryKey: ['post-analytics', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('social_post_results')
        .select('*')
        .eq('post_id', postId);

      if (error) throw error;
      return data as SocialPostResult[];
    },
    enabled: !!postId,
  });
}

// Get platform analytics summary
export function usePlatformAnalytics(platform: SocialPlatform, days = 30) {
  const { currentOrg } = useOrgStore();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return useQuery({
    queryKey: ['platform-analytics', currentOrg?.id, platform, days],
    queryFn: async () => {
      if (!currentOrg?.id) return null;

      // Get posts for this platform
      const { data: posts, error: postsError } = await supabase
        .from('social_posts')
        .select('id')
        .eq('organization_id', currentOrg.id)
        .contains('platforms', [platform])
        .gte('created_at', startDate.toISOString());

      if (postsError) throw postsError;

      if (!posts || !posts.length) {
        return {
          totalPosts: 0,
          totalImpressions: 0,
          totalEngagement: 0,
          avgEngagementRate: 0,
          topPost: null,
        };
      }

      // Get analytics for these posts
      const postIds = posts.map((p) => (p as { id: string }).id);
      const { data: rawResults, error: resultsError } = await supabase
        .from('social_post_results')
        .select('*')
        .in('post_id', postIds)
        .eq('platform', platform);

      if (resultsError) throw resultsError;

      // Cast results to proper type
      const results = (rawResults || []) as unknown as SocialPostResult[];

      const totalImpressions = results.reduce((sum, r) => sum + (r.impressions || 0), 0);
      const totalEngagement = results.reduce(
        (sum, r) => sum + (r.likes || 0) + (r.comments || 0) + (r.shares || 0),
        0
      );
      const avgEngagementRate =
        results.length > 0
          ? results.reduce((sum, r) => sum + (r.engagement_rate || 0), 0) / results.length
          : 0;

      // Find top post
      const topPost = results.reduce<SocialPostResult | null>(
        (top, r) => (r.engagement_rate > (top?.engagement_rate || 0) ? r : top),
        null
      );

      return {
        totalPosts: posts.length,
        totalImpressions,
        totalEngagement,
        avgEngagementRate,
        topPost,
      };
    },
    enabled: !!currentOrg?.id,
  });
}
