import { useState } from 'react';
import { ScrollView as RNScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  YStack,
  XStack,
  Card,
  H2,
  H3,
  Button,
  Switch,
  Avatar,
  Separator,
  useTheme,
} from 'tamagui';
import {
  User,
  Building2,
  Users,
  CreditCard,
  Bell,
  Moon,
  Globe,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Mail,
  Key,
  Palette,
} from 'lucide-react-native';

import { useAuthStore } from '../../../stores/authStore';
import { useUIStore } from '../../../stores/uiStore';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { user, logout } = useAuthStore();
  const { colorScheme, setColorScheme } = useUIStore();
  const [notifications, setNotifications] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Extract theme colors for use with non-Tamagui components (e.g., Lucide icons)
  const primaryColor = theme.primary.val;
  const textMutedColor = theme.textMuted.val;
  const errorColor = theme.error.val;

  const showMessage = (message: string) => {
    setActionMessage(message);
    setTimeout(() => setActionMessage(null), 2000);
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const userName = user?.user_metadata?.full_name || 'User';
  const userEmail = user?.email || '';
  const userInitials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase();

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Profile',
          description: 'Manage your personal information',
          onPress: () => showMessage('Opening profile settings...'),
        },
        {
          icon: Mail,
          label: 'Email',
          description: userEmail,
          onPress: () => showMessage('Opening email settings...'),
        },
        {
          icon: Key,
          label: 'Password & Security',
          description: 'Update password and 2FA settings',
          onPress: () => showMessage('Opening security settings...'),
        },
      ],
    },
    {
      title: 'Organization',
      items: [
        {
          icon: Building2,
          label: 'Organization Settings',
          description: 'Company name, logo, and branding',
          onPress: () => showMessage('Opening organization settings...'),
        },
        {
          icon: Users,
          label: 'Team Members',
          description: 'Manage team access and roles',
          onPress: () => showMessage('Opening team management...'),
        },
        {
          icon: CreditCard,
          label: 'Billing & Plans',
          description: 'Current plan: Pro',
          onPress: () => showMessage('Opening billing settings...'),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: Bell,
          label: 'Notifications',
          description: 'Email and push notification settings',
          toggle: true,
          value: notifications,
          onToggle: (value: boolean) => {
            setNotifications(value);
            showMessage(value ? 'Notifications enabled' : 'Notifications disabled');
          },
        },
        {
          icon: Moon,
          label: 'Dark Mode',
          description: colorScheme === 'dark' ? 'On' : colorScheme === 'system' ? 'System' : 'Off',
          toggle: true,
          value: colorScheme === 'dark',
          onToggle: (value: boolean) => {
            setColorScheme(value ? 'dark' : 'light');
            showMessage(value ? 'Dark mode enabled' : 'Light mode enabled');
          },
        },
        {
          icon: Globe,
          label: 'Language',
          description: 'English (US)',
          onPress: () => showMessage('Opening language settings...'),
        },
      ],
    },
    {
      title: 'Integrations',
      items: [
        {
          icon: Shield,
          label: 'API Keys',
          description: 'Manage API access tokens',
          onPress: () => showMessage('Opening API key management...'),
        },
        {
          icon: Palette,
          label: 'Connected Apps',
          description: 'Social media, email providers, etc.',
          onPress: () => showMessage('Opening connected apps...'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help & Documentation',
          description: 'FAQs, guides, and tutorials',
          onPress: () => showMessage('Opening help center...'),
        },
      ],
    },
  ];

  return (
    <View flex={1} backgroundColor="$background">
      <RNScrollView
        contentContainerStyle={{
          padding: 16,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
        }}
      >
        <YStack space="$6">
          {/* Header */}
          <XStack alignItems="center" space="$2">
            <H2 color="$color">Settings</H2>
            {actionMessage && (
              <Text color="$success" fontSize="$2">
                {actionMessage}
              </Text>
            )}
          </XStack>

          {/* Profile Card */}
          <Card backgroundColor="$backgroundHover" padding="$4" borderRadius="$4">
            <XStack space="$4" alignItems="center">
              <Avatar circular size="$6" backgroundColor="$primary">
                <Avatar.Fallback>
                  <Text color="white" fontWeight="bold" fontSize="$5">
                    {userInitials}
                  </Text>
                </Avatar.Fallback>
              </Avatar>
              <YStack flex={1}>
                <Text color="$color" fontWeight="600" fontSize="$5">
                  {userName}
                </Text>
                <Text color="$colorHover" fontSize="$3">
                  {userEmail}
                </Text>
              </YStack>
              <Button size="$3" backgroundColor="$background" borderRadius="$3" onPress={() => showMessage('Opening profile editor...')}>
                <Text color="$primary" fontSize="$3">
                  Edit
                </Text>
              </Button>
            </XStack>
          </Card>

          {/* Settings Sections */}
          {settingsSections.map((section, sectionIndex) => (
            <YStack key={sectionIndex} space="$3">
              <H3 color="$color" fontSize="$4">
                {section.title}
              </H3>
              <Card backgroundColor="$backgroundHover" borderRadius="$4" overflow="hidden">
                {section.items.map((item, itemIndex) => (
                  <View key={itemIndex}>
                    <XStack
                      padding="$4"
                      alignItems="center"
                      pressStyle={{ opacity: 0.7 }}
                      onPress={item.onPress}
                    >
                      <View
                        backgroundColor="$primary"
                        padding="$2"
                        borderRadius="$2"
                        opacity={0.1}
                      >
                        <item.icon size={20} color={primaryColor} />
                      </View>
                      <YStack flex={1} marginLeft="$3">
                        <Text color="$color" fontWeight="500">
                          {item.label}
                        </Text>
                        <Text color="$colorHover" fontSize="$2">
                          {item.description}
                        </Text>
                      </YStack>
                      {item.toggle ? (
                        <Switch
                          size="$3"
                          checked={item.value}
                          onCheckedChange={item.onToggle}
                        />
                      ) : (
                        <ChevronRight size={20} color={textMutedColor} />
                      )}
                    </XStack>
                    {itemIndex < section.items.length - 1 && (
                      <Separator marginHorizontal="$4" />
                    )}
                  </View>
                ))}
              </Card>
            </YStack>
          ))}

          {/* Sign Out */}
          <Button
            size="$5"
            backgroundColor={`${errorColor}15`}
            borderRadius="$4"
            onPress={handleLogout}
          >
            <LogOut size={20} color={errorColor} />
            <Text color={errorColor} fontWeight="600" marginLeft="$2">
              Sign Out
            </Text>
          </Button>

          {/* App Version */}
          <Text color="$colorHover" fontSize="$2" textAlign="center">
            Marketing Hub v1.0.0
          </Text>
        </YStack>
      </RNScrollView>
    </View>
  );
}
