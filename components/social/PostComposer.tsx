import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Platform, TextInput } from 'react-native';
import { Text, YStack, XStack, ScrollView, useTheme } from 'tamagui';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { AnimatedButton, GlassCard, useToast } from '../ui';
import { borderRadius } from '../../lib/design-tokens';
import { generateCaption, generateHashtags, analyzeContent } from '../../lib/ai/social';
import { useCreatePost, useUploadMedia, useSocialAccounts } from '../../hooks/useSocial';
import type { SocialPlatform, PLATFORM_CONFIGS, PostComposerState, AIGenerationOptions } from '../../types/social';

const platformIcons: Record<SocialPlatform, string> = {
  twitter: 'logo-twitter',
  linkedin: 'logo-linkedin',
  facebook: 'logo-facebook',
  instagram: 'logo-instagram',
  tiktok: 'logo-tiktok',
  youtube: 'logo-youtube',
};

const platformColors: Record<SocialPlatform, string> = {
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  facebook: '#1877F2',
  instagram: '#E4405F',
  tiktok: '#000000',
  youtube: '#FF0000',
};

const platformCharLimits: Record<SocialPlatform, number> = {
  twitter: 280,
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
  tiktok: 2200,
  youtube: 5000,
};

interface PostComposerProps {
  onClose?: () => void;
  initialPlatforms?: SocialPlatform[];
  onPostCreated?: () => void;
}

export function PostComposer({
  onClose,
  initialPlatforms = [],
  onPostCreated,
}: PostComposerProps) {
  const theme = useTheme();
  const primaryColor = theme.primary?.val || '#0F6CBD';
  const textMutedColor = theme.textMuted?.val || '#6B6B6B';
  const textColor = theme.color?.val || '#1A1A1A';
  const borderColor = theme.borderColor?.val || '#E0E0E0';
  const backgroundColor = theme.background?.val || '#FFFFFF';
  const errorColor = theme.error?.val || '#C42B1C';

  const { showToast } = useToast();
  const { data: accounts } = useSocialAccounts();
  const createPost = useCreatePost();
  const uploadMedia = useUploadMedia();

  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(initialPlatforms);
  const [mediaItems, setMediaItems] = useState<{ uri: string; type: string }[]>([]);
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [aiTone, setAiTone] = useState<AIGenerationOptions['tone']>('professional');

  // Get available platforms (connected accounts)
  const availablePlatforms = accounts?.map((a) => a.platform) || [];
  const uniquePlatforms = [...new Set(availablePlatforms)] as SocialPlatform[];

  // Character count for selected platforms
  const minCharLimit = selectedPlatforms.length > 0
    ? Math.min(...selectedPlatforms.map((p) => platformCharLimits[p]))
    : 280;

  const charCount = content.length;
  const isOverLimit = charCount > minCharLimit;

  const togglePlatform = useCallback((platform: SocialPlatform) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  }, []);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newMedia = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
      }));
      setMediaItems((prev) => [...prev, ...newMedia]);
    }
  }, []);

  const removeMedia = useCallback((index: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleGenerateCaption = useCallback(async () => {
    if (selectedPlatforms.length === 0) {
      showToast({
        type: 'warning',
        title: 'Select a platform',
        message: 'Choose at least one platform to generate content for',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const caption = await generateCaption({
        tone: aiTone,
        length: 'medium',
        includeEmojis: true,
        includeHashtags: false,
        targetPlatform: selectedPlatforms[0],
        topic: content || 'engaging social media post',
      });

      setContent(caption);

      // Also generate hashtags
      const tags = await generateHashtags(caption, selectedPlatforms[0], 8);
      setHashtags(tags);

      showToast({
        type: 'success',
        title: 'Content generated',
        message: 'AI has created your caption',
      });
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Generation failed',
        message: 'Could not generate content',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedPlatforms, aiTone, content, showToast]);

  const handleGenerateHashtags = useCallback(async () => {
    if (!content || selectedPlatforms.length === 0) return;

    setIsGenerating(true);
    try {
      const tags = await generateHashtags(content, selectedPlatforms[0], 10);
      setHashtags(tags);
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to generate hashtags',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [content, selectedPlatforms, showToast]);

  const addHashtag = useCallback((tag: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    if (!content.includes(tag)) {
      setContent((prev) => prev + ' ' + tag);
    }
  }, [content]);

  const handlePost = useCallback(async () => {
    if (!content.trim()) {
      showToast({
        type: 'warning',
        title: 'Content required',
        message: 'Please write something to post',
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      showToast({
        type: 'warning',
        title: 'Select platforms',
        message: 'Choose at least one platform',
      });
      return;
    }

    try {
      // Upload media first
      const mediaUrls: string[] = [];
      const mediaTypes: string[] = [];

      for (const media of mediaItems) {
        const result = await uploadMedia.mutateAsync({
          file: {
            uri: media.uri,
            name: `media-${Date.now()}.${media.type === 'video' ? 'mp4' : 'jpg'}`,
            type: media.type === 'video' ? 'video/mp4' : 'image/jpeg',
            size: 0,
          },
        });
        mediaUrls.push(result.public_url);
        mediaTypes.push(media.type);
      }

      // Create post
      await createPost.mutateAsync({
        content,
        platforms: selectedPlatforms,
        media_urls: mediaUrls,
        media_types: mediaTypes,
        hashtags: hashtags.filter((h) => content.includes(h)),
        status: scheduledFor ? 'scheduled' : 'draft',
        scheduled_for: scheduledFor?.toISOString(),
      });

      showToast({
        type: 'success',
        title: scheduledFor ? 'Post scheduled' : 'Post created',
        message: scheduledFor
          ? `Scheduled for ${format(scheduledFor, 'MMM d, h:mm a')}`
          : 'Your post has been saved as a draft',
      });

      onPostCreated?.();
      onClose?.();
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Failed to create post',
        message: 'Please try again',
      });
    }
  }, [content, selectedPlatforms, mediaItems, hashtags, scheduledFor, uploadMedia, createPost, showToast, onPostCreated, onClose]);

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" space="$4">
        {/* Platform Selector */}
        <YStack space="$2">
          <Text color="$colorHover" fontSize="$2" fontWeight="500">
            POST TO
          </Text>
          <XStack flexWrap="wrap" gap="$2">
            {uniquePlatforms.length > 0 ? (
              uniquePlatforms.map((platform) => (
                <Pressable
                  key={platform}
                  onPress={() => togglePlatform(platform)}
                >
                  <View
                    style={[
                      styles.platformChip,
                      { backgroundColor, borderColor },
                      selectedPlatforms.includes(platform) && {
                        backgroundColor: platformColors[platform],
                        borderColor: platformColors[platform],
                      },
                    ]}
                  >
                    <Ionicons
                      name={platformIcons[platform] as any}
                      size={18}
                      color={selectedPlatforms.includes(platform) ? '#fff' : textMutedColor}
                    />
                    <Text
                      color={selectedPlatforms.includes(platform) ? '#fff' : textMutedColor}
                      fontSize="$2"
                      fontWeight="500"
                      textTransform="capitalize"
                    >
                      {platform}
                    </Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text color="$colorHover" fontSize="$2">
                No connected accounts. Connect accounts in Settings.
              </Text>
            )}
          </XStack>
        </YStack>

        {/* Content Input */}
        <YStack space="$2">
          <XStack justifyContent="space-between" alignItems="center">
            <Text color="$colorHover" fontSize="$2" fontWeight="500">
              CONTENT
            </Text>
            <Text
              color={isOverLimit ? errorColor : textMutedColor}
              fontSize="$1"
            >
              {charCount}/{minCharLimit}
            </Text>
          </XStack>
          <View style={[styles.inputContainer, { borderColor, backgroundColor }]}>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="What's on your mind?"
              placeholderTextColor={textMutedColor}
              multiline
              style={[styles.textInput, { color: textColor }]}
            />
          </View>
        </YStack>

        {/* AI Generation */}
        <GlassCard padding={16}>
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
            <XStack alignItems="center" gap="$2">
              <Ionicons name="sparkles" size={18} color={primaryColor} />
              <Text color="$color" fontWeight="600">AI Assistant</Text>
            </XStack>
            <Pressable onPress={() => setShowAIOptions(!showAIOptions)}>
              <Ionicons
                name={showAIOptions ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={textMutedColor}
              />
            </Pressable>
          </XStack>

          {showAIOptions && (
            <YStack space="$2" marginBottom="$3">
              <Text color="$colorHover" fontSize="$2">Tone</Text>
              <XStack flexWrap="wrap" gap="$2">
                {(['professional', 'casual', 'humorous', 'inspirational'] as const).map((tone) => (
                  <Pressable key={tone} onPress={() => setAiTone(tone)}>
                    <View
                      style={[
                        styles.toneChip,
                        { backgroundColor: theme.backgroundHover?.val || '#F5F5F5' },
                        aiTone === tone && { backgroundColor: primaryColor },
                      ]}
                    >
                      <Text
                        color={aiTone === tone ? '#fff' : textMutedColor}
                        fontSize="$2"
                        textTransform="capitalize"
                      >
                        {tone}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </XStack>
            </YStack>
          )}

          <XStack gap="$2">
            <AnimatedButton
              variant="gradient"
              size="sm"
              onPress={handleGenerateCaption}
              loading={isGenerating}
              icon={<Ionicons name="sparkles" size={16} color="#fff" />}
            >
              Generate Caption
            </AnimatedButton>
            <AnimatedButton
              variant="outline"
              size="sm"
              onPress={handleGenerateHashtags}
              loading={isGenerating}
              disabled={!content}
            >
              Get Hashtags
            </AnimatedButton>
          </XStack>
        </GlassCard>

        {/* Hashtag Suggestions */}
        {hashtags.length > 0 && (
          <YStack space="$2">
            <Text color="$colorHover" fontSize="$2" fontWeight="500">
              SUGGESTED HASHTAGS
            </Text>
            <XStack flexWrap="wrap" gap="$2">
              {hashtags.map((tag, index) => (
                <Pressable key={index} onPress={() => addHashtag(tag)}>
                  <View
                    style={[
                      styles.hashtagChip,
                      { backgroundColor: `${primaryColor}15`, borderColor: `${primaryColor}40` },
                      content.includes(tag) && { backgroundColor: primaryColor, borderColor: primaryColor },
                    ]}
                  >
                    <Text
                      color={content.includes(tag) ? '#fff' : primaryColor}
                      fontSize="$2"
                    >
                      {tag}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </XStack>
          </YStack>
        )}

        {/* Media */}
        <YStack space="$2">
          <XStack justifyContent="space-between" alignItems="center">
            <Text color="$colorHover" fontSize="$2" fontWeight="500">
              MEDIA
            </Text>
            <AnimatedButton variant="ghost" size="sm" onPress={pickImage}>
              <Ionicons name="add" size={18} color={primaryColor} />
              Add Media
            </AnimatedButton>
          </XStack>

          {mediaItems.length > 0 && (
            <XStack flexWrap="wrap" gap="$2">
              {mediaItems.map((media, index) => (
                <View
                  key={index}
                  style={styles.mediaPreview}
                >
                  <View style={styles.mediaImage}>
                    {media.type === 'video' && (
                      <View style={styles.videoOverlay}>
                        <Ionicons name="play" size={24} color="#fff" />
                      </View>
                    )}
                  </View>
                  <Pressable
                    style={styles.removeMedia}
                    onPress={() => removeMedia(index)}
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </XStack>
          )}
        </YStack>

        {/* Schedule */}
        <YStack space="$2">
          <XStack justifyContent="space-between" alignItems="center">
            <Text color="$colorHover" fontSize="$2" fontWeight="500">
              SCHEDULE
            </Text>
            <Pressable onPress={() => setShowScheduler(!showScheduler)}>
              <XStack alignItems="center" gap="$1">
                <Ionicons
                  name={scheduledFor ? 'calendar' : 'calendar-outline'}
                  size={18}
                  color={scheduledFor ? primaryColor : textMutedColor}
                />
                <Text
                  color={scheduledFor ? primaryColor : textMutedColor}
                  fontSize="$2"
                >
                  {scheduledFor ? format(scheduledFor, 'MMM d, h:mm a') : 'Schedule'}
                </Text>
              </XStack>
            </Pressable>
          </XStack>

          {showScheduler && (
            <XStack gap="$2" marginTop="$2">
              <AnimatedButton
                variant="secondary"
                size="sm"
                onPress={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  tomorrow.setHours(9, 0, 0, 0);
                  setScheduledFor(tomorrow);
                }}
              >
                Tomorrow 9 AM
              </AnimatedButton>
              <AnimatedButton
                variant="secondary"
                size="sm"
                onPress={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  nextWeek.setHours(12, 0, 0, 0);
                  setScheduledFor(nextWeek);
                }}
              >
                Next Week
              </AnimatedButton>
              {scheduledFor && (
                <AnimatedButton
                  variant="ghost"
                  size="sm"
                  onPress={() => setScheduledFor(null)}
                >
                  Clear
                </AnimatedButton>
              )}
            </XStack>
          )}
        </YStack>

        {/* Actions */}
        <XStack gap="$3" marginTop="$4">
          <View style={{ flex: 1 }}>
            <AnimatedButton
              variant="secondary"
              fullWidth
              onPress={handlePost}
              disabled={!content || selectedPlatforms.length === 0}
            >
              Save Draft
            </AnimatedButton>
          </View>
          <View style={{ flex: 1 }}>
            <AnimatedButton
              variant="gradient"
              fullWidth
              onPress={handlePost}
              disabled={!content || selectedPlatforms.length === 0 || isOverLimit}
              loading={createPost.isPending}
            >
              {scheduledFor ? 'Schedule' : 'Post Now'}
            </AnimatedButton>
          </View>
        </XStack>
      </YStack>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  platformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    // backgroundColor and borderColor are set dynamically via inline styles for theme support
  },
  inputContainer: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    minHeight: 150,
    padding: 16,
  },
  textInput: {
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  toneChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    // backgroundColor is set dynamically via inline styles for theme support
  },
  hashtagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  mediaPreview: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeMedia: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
