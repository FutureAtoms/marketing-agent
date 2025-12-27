// Hook for managing social platform authentication
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Platform as RNPlatform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useOrgStore } from '../stores/orgStore';
import { useToast } from '../components/ui';
import {
  connectPlatform,
  disconnectPlatform,
  refreshAccessToken,
  isPlatformConnected,
  platformInfo,
} from '../lib/social/oauth';
import type { SocialPlatform } from '../types/social';

export function useSocialAuth() {
  const { currentOrg } = useOrgStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [connectingPlatform, setConnectingPlatform] = useState<SocialPlatform | null>(null);

  // Connect to a platform
  const connectMutation = useMutation({
    mutationFn: async (platform: SocialPlatform) => {
      if (!currentOrg?.id) throw new Error('No organization selected');
      return connectPlatform(platform, currentOrg.id);
    },
    onMutate: (platform) => {
      setConnectingPlatform(platform);
      if (RNPlatform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    onSuccess: (result, platform) => {
      if (result.success) {
        showToast({
          type: 'success',
          title: `${platformInfo[platform]?.name || platform} Connected`,
          message: 'Your account has been linked successfully',
        });
        queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      } else {
        showToast({
          type: 'error',
          title: 'Connection Failed',
          message: result.error || 'Could not connect account',
        });
      }
    },
    onError: (error) => {
      showToast({
        type: 'error',
        title: 'Connection Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    },
    onSettled: () => {
      setConnectingPlatform(null);
    },
  });

  // Disconnect from a platform
  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      return disconnectPlatform(accountId);
    },
    onSuccess: (result) => {
      if (result.success) {
        showToast({
          type: 'success',
          title: 'Account Disconnected',
          message: 'The social account has been unlinked',
        });
        queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      } else {
        showToast({
          type: 'error',
          title: 'Disconnect Failed',
          message: result.error || 'Could not disconnect account',
        });
      }
    },
    onError: (error) => {
      showToast({
        type: 'error',
        title: 'Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  // Refresh token for a platform
  const refreshMutation = useMutation({
    mutationFn: async (accountId: string) => {
      return refreshAccessToken(accountId);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      }
    },
  });

  // Check connection status
  const checkConnection = useCallback(
    async (platform: SocialPlatform): Promise<boolean> => {
      if (!currentOrg?.id) return false;
      return isPlatformConnected(platform, currentOrg.id);
    },
    [currentOrg?.id]
  );

  return {
    connectPlatform: connectMutation.mutate,
    disconnectPlatform: disconnectMutation.mutate,
    refreshToken: refreshMutation.mutate,
    checkConnection,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    connectingPlatform,
    platformInfo,
  };
}

// Export platform info for direct use
export { platformInfo };
