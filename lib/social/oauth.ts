// Social Platform OAuth Connection Service
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { supabase } from '../supabase';
import type { SocialPlatform } from '../../types/social';

// OAuth configurations
interface OAuthConfig {
  clientId: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scopes: string[];
  redirectUri: string;
}

// Platform-specific OAuth configs
const oauthConfigs: Record<string, OAuthConfig> = {
  twitter: {
    clientId: process.env.EXPO_PUBLIC_TWITTER_CLIENT_ID || '',
    authorizationEndpoint: 'https://twitter.com/i/oauth2/authorize',
    tokenEndpoint: 'https://api.twitter.com/2/oauth2/token',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    redirectUri: AuthSession.makeRedirectUri({ scheme: 'marketing-app', path: 'oauth/twitter' }),
  },
  linkedin: {
    clientId: process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID || '',
    authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
    redirectUri: AuthSession.makeRedirectUri({ scheme: 'marketing-app', path: 'oauth/linkedin' }),
  },
  facebook: {
    clientId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '',
    authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scopes: ['public_profile', 'pages_manage_posts', 'pages_read_engagement'],
    redirectUri: AuthSession.makeRedirectUri({ scheme: 'marketing-app', path: 'oauth/facebook' }),
  },
  instagram: {
    clientId: process.env.EXPO_PUBLIC_INSTAGRAM_CLIENT_ID || '',
    authorizationEndpoint: 'https://api.instagram.com/oauth/authorize',
    tokenEndpoint: 'https://api.instagram.com/oauth/access_token',
    scopes: ['user_profile', 'user_media'],
    redirectUri: AuthSession.makeRedirectUri({ scheme: 'marketing-app', path: 'oauth/instagram' }),
  },
};

// Generate PKCE challenge
async function generatePKCE() {
  // Generate random bytes for code verifier
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  const codeVerifier = base64URLEncode(randomBytes);

  // Hash the verifier with SHA-256
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    codeVerifier,
    { encoding: Crypto.CryptoEncoding.BASE64 }
  );

  // Convert base64 to base64url
  const codeChallenge = digest
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return { codeVerifier, codeChallenge };
}

// Base64URL encode bytes
function base64URLEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Connect to a social platform
export async function connectPlatform(
  platform: SocialPlatform,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = oauthConfigs[platform];
    if (!config || !config.clientId) {
      return { success: false, error: `${platform} OAuth not configured` };
    }

    // Generate PKCE for Twitter (OAuth 2.0 with PKCE)
    const pkce = platform === 'twitter' ? await generatePKCE() : null;

    // Build authorization URL
    const authUrl = new URL(config.authorizationEndpoint);
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', config.scopes.join(' '));
    authUrl.searchParams.set('state', `${platform}-${organizationId}-${Date.now()}`);

    if (pkce) {
      authUrl.searchParams.set('code_challenge', pkce.codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
    }

    // Open browser for OAuth
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl.toString(),
      config.redirectUri
    );

    if (result.type === 'success' && result.url) {
      // Parse the callback URL
      const callbackUrl = new URL(result.url);
      const code = callbackUrl.searchParams.get('code');
      const state = callbackUrl.searchParams.get('state');
      const error = callbackUrl.searchParams.get('error');

      if (error) {
        return { success: false, error: `OAuth error: ${error}` };
      }

      if (!code) {
        return { success: false, error: 'No authorization code received' };
      }

      // Exchange code for tokens via Supabase Edge Function
      const { data, error: exchangeError } = await supabase.functions.invoke('social-oauth-callback', {
        body: {
          platform,
          code,
          state,
          redirectUri: config.redirectUri,
          codeVerifier: pkce?.codeVerifier,
          organizationId,
        },
      });

      if (exchangeError) {
        return { success: false, error: exchangeError.message };
      }

      return { success: true };
    }

    if (result.type === 'cancel') {
      return { success: false, error: 'Authentication cancelled' };
    }

    return { success: false, error: 'Authentication failed' };
  } catch (error) {
    console.error('OAuth error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Disconnect a social account
export async function disconnectPlatform(accountId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase
      .from('social_accounts') as any)
      .update({ is_active: false })
      .eq('id', accountId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Refresh access token for a platform
export async function refreshAccessToken(accountId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('social-refresh-token', {
      body: { accountId },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Check if a platform is connected
export async function isPlatformConnected(
  platform: SocialPlatform,
  organizationId: string
): Promise<boolean> {
  try {
    const { data, error } = await (supabase
      .from('social_accounts') as any)
      .select('id')
      .eq('organization_id', organizationId)
      .eq('platform', platform)
      .eq('is_active', true)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}

// Get OAuth redirect URI for a platform
export function getRedirectUri(platform: SocialPlatform): string {
  return oauthConfigs[platform]?.redirectUri || '';
}

// Get all supported platforms
export function getSupportedPlatforms(): SocialPlatform[] {
  return ['twitter', 'linkedin', 'facebook', 'instagram'];
}

// Platform display info
export const platformInfo: Record<string, { name: string; icon: string; color: string; description: string }> = {
  twitter: {
    name: 'Twitter / X',
    icon: 'logo-twitter',
    color: '#1DA1F2',
    description: 'Post tweets and threads',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'logo-linkedin',
    color: '#0A66C2',
    description: 'Share professional updates',
  },
  facebook: {
    name: 'Facebook',
    icon: 'logo-facebook',
    color: '#1877F2',
    description: 'Post to pages and profiles',
  },
  instagram: {
    name: 'Instagram',
    icon: 'logo-instagram',
    color: '#E4405F',
    description: 'Share photos and stories',
  },
  tiktok: {
    name: 'TikTok',
    icon: 'logo-tiktok',
    color: '#000000',
    description: 'Share short videos',
  },
  youtube: {
    name: 'YouTube',
    icon: 'logo-youtube',
    color: '#FF0000',
    description: 'Upload videos',
  },
};
