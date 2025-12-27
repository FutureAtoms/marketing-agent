// Connect Social Accounts Component
import React from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Text, YStack, XStack, useTheme } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';

import { AnimatedCard, AnimatedButton, GlassCard } from '../ui';
import { useSocialAuth, platformInfo } from '../../hooks/useSocialAuth';
import { useSocialAccounts } from '../../hooks/useSocial';
import { borderRadius } from '../../lib/design-tokens';
import type { SocialPlatform, SocialAccount } from '../../types/social';

interface ConnectAccountsProps {
  onAccountConnected?: (platform: SocialPlatform) => void;
}

export function ConnectAccounts({ onAccountConnected }: ConnectAccountsProps) {
  const theme = useTheme();
  const primaryColor = theme.primary?.val || '#0F6CBD';
  const successColor = theme.success?.val || '#107C10';
  const textMutedColor = theme.textMuted?.val || '#6B6B6B';
  const successBgColor = theme.successBackground?.val || '#DFF6DD';

  const { data: accounts, isLoading } = useSocialAccounts();
  const { connectPlatform, disconnectPlatform, isConnecting, connectingPlatform } = useSocialAuth();

  const platforms: SocialPlatform[] = ['twitter', 'linkedin', 'facebook', 'instagram'];

  const getConnectedAccount = (platform: SocialPlatform): SocialAccount | undefined => {
    return accounts?.find((a) => a.platform === platform && a.is_active);
  };

  const handleConnect = (platform: SocialPlatform) => {
    connectPlatform(platform, {
      onSuccess: () => {
        onAccountConnected?.(platform);
      },
    });
  };

  const handleDisconnect = (account: SocialAccount) => {
    Alert.alert(
      'Disconnect Account',
      `Are you sure you want to disconnect ${platformInfo[account.platform]?.name || account.platform}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => disconnectPlatform(account.id),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <YStack space="$3">
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonCard} />
        ))}
      </YStack>
    );
  }

  return (
    <YStack space="$3">
      {platforms.map((platform) => {
        const info = platformInfo[platform];
        const connectedAccount = getConnectedAccount(platform);
        const isCurrentlyConnecting = connectingPlatform === platform;

        return (
          <AnimatedCard key={platform} variant="outlined">
            <XStack alignItems="center" space="$3">
              {/* Platform Icon */}
              <View style={[styles.platformIcon, { backgroundColor: `${info.color}15` }]}>
                <Ionicons name={info.icon as any} size={24} color={info.color} />
              </View>

              {/* Platform Info */}
              <YStack flex={1}>
                <Text color="$color" fontWeight="600" fontSize="$3">
                  {info.name}
                </Text>
                {connectedAccount ? (
                  <Text color="$colorHover" fontSize="$2">
                    @{connectedAccount.platform_username || 'Connected'}
                  </Text>
                ) : (
                  <Text color="$colorHover" fontSize="$2">
                    {info.description}
                  </Text>
                )}
              </YStack>

              {/* Action Button */}
              {connectedAccount ? (
                <XStack alignItems="center" space="$2">
                  <View style={[styles.connectedBadge, { backgroundColor: successBgColor }]}>
                    <Ionicons name="checkmark-circle" size={14} color={successColor} />
                    <Text color={successColor} fontSize={11} fontWeight="600">
                      Connected
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleDisconnect(connectedAccount)}
                    style={styles.disconnectButton}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={textMutedColor} />
                  </Pressable>
                </XStack>
              ) : (
                <AnimatedButton
                  variant="outline"
                  size="sm"
                  onPress={() => handleConnect(platform)}
                  disabled={isConnecting}
                  icon={
                    isCurrentlyConnecting ? (
                      <ActivityIndicator size="small" color={info.color} />
                    ) : (
                      <Ionicons name="add" size={16} color={info.color} />
                    )
                  }
                >
                  {isCurrentlyConnecting ? 'Connecting...' : 'Connect'}
                </AnimatedButton>
              )}
            </XStack>
          </AnimatedCard>
        );
      })}

      {/* Info Card */}
      <GlassCard>
        <XStack alignItems="flex-start" space="$3">
          <View style={[styles.infoIcon, { backgroundColor: `${primaryColor}15` }]}>
            <Ionicons name="information-circle" size={20} color={primaryColor} />
          </View>
          <YStack flex={1}>
            <Text color="$color" fontWeight="500" fontSize="$3">
              Secure Connection
            </Text>
            <Text color="$colorHover" fontSize="$2" marginTop="$1">
              We use OAuth 2.0 to securely connect to your accounts. We never store your passwords.
            </Text>
          </YStack>
        </XStack>
      </GlassCard>
    </YStack>
  );
}

// Compact version for embedding in other screens
export function ConnectAccountsCompact() {
  const theme = useTheme();
  const successColor = theme.success?.val || '#107C10';

  const { data: accounts } = useSocialAccounts();
  const { connectPlatform, isConnecting, connectingPlatform } = useSocialAuth();

  const platforms: SocialPlatform[] = ['twitter', 'linkedin', 'facebook', 'instagram'];
  const connectedPlatforms = accounts?.map((a) => a.platform) || [];

  return (
    <XStack flexWrap="wrap" gap="$2">
      {platforms.map((platform) => {
        const info = platformInfo[platform];
        const isConnected = connectedPlatforms.includes(platform);
        const isCurrentlyConnecting = connectingPlatform === platform;

        return (
          <Pressable
            key={platform}
            onPress={() => !isConnected && connectPlatform(platform)}
            disabled={isConnected || isConnecting}
            style={[
              styles.compactButton,
              { borderColor: info.color },
              isConnected && { backgroundColor: `${info.color}15` },
            ]}
          >
            {isCurrentlyConnecting ? (
              <ActivityIndicator size="small" color={info.color} />
            ) : (
              <>
                <Ionicons name={info.icon as any} size={16} color={info.color} />
                {isConnected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={12}
                    color={successColor}
                    style={[styles.checkIcon, { backgroundColor: theme.background?.val || '#FFFFFF' }]}
                  />
                )}
              </>
            )}
          </Pressable>
        );
      })}
    </XStack>
  );
}

const styles = StyleSheet.create({
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  disconnectButton: {
    padding: 4,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonCard: {
    height: 72,
    borderRadius: borderRadius.lg,
    backgroundColor: '#F5F5F5',
  },
  compactButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  checkIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    // backgroundColor is set dynamically via inline styles for theme support
    borderRadius: 6,
  },
});
