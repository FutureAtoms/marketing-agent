import { useState } from 'react';
import { ScrollView as RNScrollView, RefreshControl, Alert, Platform } from 'react-native';
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
  Progress,
  useTheme,
} from 'tamagui';
import {
  Mail,
  Send,
  Users,
  BarChart3,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react-native';

export default function EmailScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const showMessage = (message: string) => {
    setActionMessage(message);
    setTimeout(() => setActionMessage(null), 2000);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleNewCampaign = () => {
    showMessage('Opening campaign editor...');
  };

  const handleViewAll = () => {
    showMessage('Viewing all campaigns');
  };

  const handleCampaignPress = (campaignName: string) => {
    showMessage(`Opening "${campaignName}"`);
  };

  const handleTemplates = () => {
    showMessage('Loading email templates...');
  };

  const handleSegments = () => {
    showMessage('Opening subscriber segments...');
  };

  const handleAnalytics = () => {
    showMessage('Loading email analytics...');
  };

  // Mock email stats
  const emailStats = {
    totalSubscribers: 3241,
    openRate: 42.5,
    clickRate: 12.3,
    bounceRate: 1.2,
  };

  // Mock campaigns
  const campaigns = [
    {
      id: '1',
      name: 'Product Launch Newsletter',
      status: 'sent',
      sentTo: 2847,
      openRate: 45.2,
      clickRate: 15.3,
      sentAt: '2 days ago',
    },
    {
      id: '2',
      name: 'Weekly Digest - Issue #42',
      status: 'sent',
      sentTo: 3102,
      openRate: 38.7,
      clickRate: 10.1,
      sentAt: '1 week ago',
    },
    {
      id: '3',
      name: 'Holiday Promotion',
      status: 'scheduled',
      scheduledFor: 'Dec 20, 9:00 AM',
      recipients: 3241,
    },
    {
      id: '4',
      name: 'Feature Update Announcement',
      status: 'draft',
      lastEdited: 'Yesterday',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle size={16} color={theme.success.val} />;
      case 'scheduled':
        return <Clock size={16} color={theme.warning.val} />;
      case 'draft':
        return <FileText size={16} color={theme.textMuted.val} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return '$success';
      case 'scheduled':
        return '$warning';
      case 'draft':
        return '$colorHover';
      default:
        return '$color';
    }
  };

  return (
    <View flex={1} backgroundColor="$background">
      <RNScrollView
        contentContainerStyle={{
          padding: 16,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <YStack space="$6">
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center">
            <YStack space="$2">
              <XStack space="$2" alignItems="center">
                <H2 color="$color">Email Marketing</H2>
                {actionMessage && (
                  <Text color="$success" fontSize="$2">
                    {actionMessage}
                  </Text>
                )}
              </XStack>
              <Text color="$colorHover" fontSize="$3">
                Create and manage email campaigns
              </Text>
            </YStack>
            <Button
              size="$4"
              backgroundColor="$primary"
              borderRadius="$3"
              onPress={handleNewCampaign}
            >
              <Plus size={18} color={theme.background.val} />
              <Text color="$background" marginLeft="$2">
                New Campaign
              </Text>
            </Button>
          </XStack>

          {/* Stats Grid */}
          <XStack flexWrap="wrap" gap="$4">
            <Card
              flex={1}
              minWidth={150}
              padding="$4"
              backgroundColor="$backgroundHover"
              borderRadius="$4"
            >
              <YStack space="$2">
                <XStack space="$2" alignItems="center">
                  <Users size={18} color={theme.primary.val} />
                  <Text color="$colorHover" fontSize="$2">
                    Subscribers
                  </Text>
                </XStack>
                <Text fontSize="$7" fontWeight="bold" color="$color">
                  {emailStats.totalSubscribers.toLocaleString()}
                </Text>
              </YStack>
            </Card>

            <Card
              flex={1}
              minWidth={150}
              padding="$4"
              backgroundColor="$backgroundHover"
              borderRadius="$4"
            >
              <YStack space="$2">
                <XStack space="$2" alignItems="center">
                  <Mail size={18} color={theme.success.val} />
                  <Text color="$colorHover" fontSize="$2">
                    Open Rate
                  </Text>
                </XStack>
                <Text fontSize="$7" fontWeight="bold" color="$color">
                  {emailStats.openRate}%
                </Text>
              </YStack>
            </Card>

            <Card
              flex={1}
              minWidth={150}
              padding="$4"
              backgroundColor="$backgroundHover"
              borderRadius="$4"
            >
              <YStack space="$2">
                <XStack space="$2" alignItems="center">
                  <BarChart3 size={18} color={theme.warning.val} />
                  <Text color="$colorHover" fontSize="$2">
                    Click Rate
                  </Text>
                </XStack>
                <Text fontSize="$7" fontWeight="bold" color="$color">
                  {emailStats.clickRate}%
                </Text>
              </YStack>
            </Card>
          </XStack>

          {/* Campaigns */}
          <YStack space="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <H3 color="$color">Campaigns</H3>
              <Button size="$2" chromeless onPress={handleViewAll}>
                <Text color="$primary" fontSize="$3">View All</Text>
              </Button>
            </XStack>

            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                backgroundColor="$backgroundHover"
                padding="$4"
                borderRadius="$4"
                pressStyle={{ scale: 0.98 }}
                onPress={() => handleCampaignPress(campaign.name)}
              >
                <YStack space="$3">
                  <XStack justifyContent="space-between" alignItems="flex-start">
                    <YStack space="$1" flex={1}>
                      <Text color="$color" fontWeight="600" fontSize="$4">
                        {campaign.name}
                      </Text>
                      <XStack space="$2" alignItems="center">
                        {getStatusIcon(campaign.status)}
                        <Text
                          color={getStatusColor(campaign.status)}
                          fontSize="$2"
                          textTransform="capitalize"
                        >
                          {campaign.status}
                        </Text>
                      </XStack>
                    </YStack>
                  </XStack>

                  {campaign.status === 'sent' && (
                    <YStack space="$2">
                      <XStack justifyContent="space-between">
                        <Text color="$colorHover" fontSize="$2">
                          Sent to {campaign.sentTo?.toLocaleString()} subscribers
                        </Text>
                        <Text color="$colorHover" fontSize="$2">
                          {campaign.sentAt}
                        </Text>
                      </XStack>
                      <XStack space="$4">
                        <YStack flex={1} space="$1">
                          <XStack justifyContent="space-between">
                            <Text color="$colorHover" fontSize="$2">
                              Opens
                            </Text>
                            <Text color="$color" fontSize="$2" fontWeight="500">
                              {campaign.openRate}%
                            </Text>
                          </XStack>
                          <Progress value={campaign.openRate} max={100}>
                            <Progress.Indicator
                              animation="bouncy"
                              backgroundColor="$success"
                            />
                          </Progress>
                        </YStack>
                        <YStack flex={1} space="$1">
                          <XStack justifyContent="space-between">
                            <Text color="$colorHover" fontSize="$2">
                              Clicks
                            </Text>
                            <Text color="$color" fontSize="$2" fontWeight="500">
                              {campaign.clickRate}%
                            </Text>
                          </XStack>
                          <Progress value={campaign.clickRate} max={100}>
                            <Progress.Indicator
                              animation="bouncy"
                              backgroundColor="$primary"
                            />
                          </Progress>
                        </YStack>
                      </XStack>
                    </YStack>
                  )}

                  {campaign.status === 'scheduled' && (
                    <XStack space="$2" alignItems="center">
                      <Clock size={14} color={theme.warning.val} />
                      <Text color="$colorHover" fontSize="$2">
                        Scheduled for {campaign.scheduledFor} ({campaign.recipients?.toLocaleString()} recipients)
                      </Text>
                    </XStack>
                  )}

                  {campaign.status === 'draft' && (
                    <Text color="$colorHover" fontSize="$2">
                      Last edited {campaign.lastEdited}
                    </Text>
                  )}
                </YStack>
              </Card>
            ))}
          </YStack>

          {/* Quick Actions */}
          <YStack space="$4">
            <H3 color="$color">Quick Actions</H3>
            <XStack space="$3" flexWrap="wrap">
              <Button
                flex={1}
                minWidth={100}
                size="$4"
                backgroundColor="$backgroundHover"
                borderRadius="$3"
                onPress={handleTemplates}
              >
                <FileText size={18} color={theme.textMuted.val} />
                <Text color="$color" marginLeft="$2">
                  Templates
                </Text>
              </Button>
              <Button
                flex={1}
                minWidth={100}
                size="$4"
                backgroundColor="$backgroundHover"
                borderRadius="$3"
                onPress={handleSegments}
              >
                <Users size={18} color={theme.textMuted.val} />
                <Text color="$color" marginLeft="$2">
                  Segments
                </Text>
              </Button>
              <Button
                flex={1}
                minWidth={100}
                size="$4"
                backgroundColor="$backgroundHover"
                borderRadius="$3"
                onPress={handleAnalytics}
              >
                <BarChart3 size={18} color={theme.textMuted.val} />
                <Text color="$color" marginLeft="$2">
                  Analytics
                </Text>
              </Button>
            </XStack>
          </YStack>
        </YStack>
      </RNScrollView>
    </View>
  );
}
