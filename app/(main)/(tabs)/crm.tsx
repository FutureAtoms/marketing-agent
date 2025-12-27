import { useState } from 'react';
import { ScrollView as RNScrollView, RefreshControl } from 'react-native';
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
  Input,
  Avatar,
  useTheme,
} from 'tamagui';
import {
  Users,
  Plus,
  Search,
  Filter,
  Star,
  Mail,
  Phone,
  Building2,
  ArrowRight,
  TrendingUp,
  DollarSign,
} from 'lucide-react-native';

export default function CRMScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'contacts' | 'deals'>('contacts');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const showMessage = (message: string) => {
    setActionMessage(message);
    setTimeout(() => setActionMessage(null), 2000);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
    showMessage('Contacts refreshed');
  };

  const handleAddContact = () => {
    showMessage('Opening new contact form...');
  };

  const handleFilter = () => {
    setShowFilters(!showFilters);
    showMessage(showFilters ? 'Filters hidden' : 'Filters shown');
  };

  const handleContactPress = (contactName: string) => {
    showMessage(`Viewing ${contactName}'s profile`);
  };

  const handleDealPress = (dealTitle: string) => {
    showMessage(`Opening deal: ${dealTitle}`);
  };

  // Mock contacts
  const contacts = [
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@acmecorp.com',
      company: 'Acme Corp',
      status: 'customer',
      leadScore: 85,
      avatar: null,
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael@techstart.io',
      company: 'TechStart',
      status: 'qualified',
      leadScore: 72,
      avatar: null,
    },
    {
      id: '3',
      name: 'Emily Davis',
      email: 'emily@innovate.co',
      company: 'Innovate Co',
      status: 'lead',
      leadScore: 45,
      avatar: null,
    },
    {
      id: '4',
      name: 'James Wilson',
      email: 'james@enterprise.com',
      company: 'Enterprise Inc',
      status: 'customer',
      leadScore: 92,
      avatar: null,
    },
  ];

  // Mock deals
  const deals = [
    {
      id: '1',
      title: 'Enterprise License',
      company: 'Acme Corp',
      value: 50000,
      stage: 'negotiation',
      probability: 75,
    },
    {
      id: '2',
      title: 'Annual Subscription',
      company: 'TechStart',
      value: 12000,
      stage: 'proposal',
      probability: 50,
    },
    {
      id: '3',
      title: 'Team Plan Upgrade',
      company: 'Innovate Co',
      value: 8500,
      stage: 'qualified',
      probability: 30,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'customer':
        return theme.success.val;
      case 'qualified':
        return theme.warning.val;
      case 'lead':
        return theme.primary.val;
      default:
        return theme.textMuted.val;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'negotiation':
        return theme.success.val;
      case 'proposal':
        return theme.warning.val;
      case 'qualified':
        return theme.primary.val;
      default:
        return theme.textMuted.val;
    }
  };

  const pipelineValue = deals.reduce((sum, deal) => sum + deal.value, 0);

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
                <H2 color="$color">CRM</H2>
                {actionMessage && (
                  <Text color="$success" fontSize="$2">
                    {actionMessage}
                  </Text>
                )}
              </XStack>
              <Text color="$colorHover" fontSize="$3">
                Manage contacts and deals
              </Text>
            </YStack>
            <Button size="$4" backgroundColor="$primary" borderRadius="$3" onPress={handleAddContact}>
              <Plus size={18} color={theme.background.val} />
              <Text color="$background" marginLeft="$2">
                Add Contact
              </Text>
            </Button>
          </XStack>

          {/* Stats */}
          <XStack space="$4">
            <Card
              flex={1}
              padding="$4"
              backgroundColor="$backgroundHover"
              borderRadius="$4"
            >
              <YStack space="$2">
                <XStack space="$2" alignItems="center">
                  <Users size={18} color={theme.primary.val} />
                  <Text color="$colorHover" fontSize="$2">
                    Total Contacts
                  </Text>
                </XStack>
                <Text fontSize="$7" fontWeight="bold" color="$color">
                  {contacts.length}
                </Text>
              </YStack>
            </Card>
            <Card
              flex={1}
              padding="$4"
              backgroundColor="$backgroundHover"
              borderRadius="$4"
            >
              <YStack space="$2">
                <XStack space="$2" alignItems="center">
                  <DollarSign size={18} color={theme.success.val} />
                  <Text color="$colorHover" fontSize="$2">
                    Pipeline Value
                  </Text>
                </XStack>
                <Text fontSize="$7" fontWeight="bold" color="$color">
                  ${(pipelineValue / 1000).toFixed(0)}K
                </Text>
              </YStack>
            </Card>
          </XStack>

          {/* Search and Filter */}
          <XStack space="$3">
            <XStack
              flex={1}
              alignItems="center"
              backgroundColor="$backgroundHover"
              borderRadius="$3"
              paddingHorizontal="$3"
            >
              <Search size={18} color={theme.textMuted.val} />
              <Input
                flex={1}
                placeholder="Search contacts..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                borderWidth={0}
                backgroundColor="transparent"
              />
            </XStack>
            <Button size="$4" backgroundColor={showFilters ? '$primary' : '$backgroundHover'} borderRadius="$3" onPress={handleFilter}>
              <Filter size={18} color={showFilters ? theme.background.val : theme.textMuted.val} />
            </Button>
          </XStack>

          {/* Tabs */}
          <XStack backgroundColor="$backgroundHover" borderRadius="$4" padding="$1">
            <Button
              flex={1}
              size="$4"
              backgroundColor={activeTab === 'contacts' ? '$background' : 'transparent'}
              borderRadius="$3"
              onPress={() => setActiveTab('contacts')}
            >
              <Users size={18} color={activeTab === 'contacts' ? theme.primary.val : theme.textMuted.val} />
              <Text
                color={activeTab === 'contacts' ? '$color' : '$colorHover'}
                marginLeft="$2"
              >
                Contacts
              </Text>
            </Button>
            <Button
              flex={1}
              size="$4"
              backgroundColor={activeTab === 'deals' ? '$background' : 'transparent'}
              borderRadius="$3"
              onPress={() => setActiveTab('deals')}
            >
              <TrendingUp size={18} color={activeTab === 'deals' ? theme.primary.val : theme.textMuted.val} />
              <Text
                color={activeTab === 'deals' ? '$color' : '$colorHover'}
                marginLeft="$2"
              >
                Deals
              </Text>
            </Button>
          </XStack>

          {/* Content */}
          {activeTab === 'contacts' ? (
            <YStack space="$3">
              {contacts.map((contact) => (
                <Card
                  key={contact.id}
                  backgroundColor="$backgroundHover"
                  padding="$4"
                  borderRadius="$4"
                  pressStyle={{ scale: 0.98 }}
                  onPress={() => handleContactPress(contact.name)}
                >
                  <XStack space="$3" alignItems="center">
                    <Avatar circular size="$5" backgroundColor="$primary">
                      <Avatar.Fallback>
                        <Text color="$background" fontWeight="bold">
                          {contact.name.split(' ').map((n) => n[0]).join('')}
                        </Text>
                      </Avatar.Fallback>
                    </Avatar>
                    <YStack flex={1} space="$1">
                      <XStack justifyContent="space-between" alignItems="center">
                        <Text color="$color" fontWeight="600">
                          {contact.name}
                        </Text>
                        <View
                          backgroundColor={getStatusColor(contact.status)}
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius="$2"
                          opacity={0.2}
                        >
                          <Text
                            color={getStatusColor(contact.status)}
                            fontSize="$1"
                            textTransform="capitalize"
                          >
                            {contact.status}
                          </Text>
                        </View>
                      </XStack>
                      <XStack space="$2" alignItems="center">
                        <Building2 size={12} color={theme.textMuted.val} />
                        <Text color="$colorHover" fontSize="$2">
                          {contact.company}
                        </Text>
                      </XStack>
                      <XStack space="$2" alignItems="center">
                        <Mail size={12} color={theme.textMuted.val} />
                        <Text color="$colorHover" fontSize="$2">
                          {contact.email}
                        </Text>
                      </XStack>
                    </YStack>
                    <YStack alignItems="center" space="$1">
                      <XStack space="$1" alignItems="center">
                        <Star size={14} color={theme.warning.val} fill={theme.warning.val} />
                        <Text color="$color" fontWeight="600" fontSize="$3">
                          {contact.leadScore}
                        </Text>
                      </XStack>
                      <Text color="$colorHover" fontSize="$1">
                        Score
                      </Text>
                    </YStack>
                  </XStack>
                </Card>
              ))}
            </YStack>
          ) : (
            <YStack space="$3">
              {deals.map((deal) => (
                <Card
                  key={deal.id}
                  backgroundColor="$backgroundHover"
                  padding="$4"
                  borderRadius="$4"
                  pressStyle={{ scale: 0.98 }}
                  onPress={() => handleDealPress(deal.title)}
                >
                  <YStack space="$3">
                    <XStack justifyContent="space-between" alignItems="flex-start">
                      <YStack space="$1" flex={1}>
                        <Text color="$color" fontWeight="600" fontSize="$4">
                          {deal.title}
                        </Text>
                        <XStack space="$2" alignItems="center">
                          <Building2 size={14} color={theme.textMuted.val} />
                          <Text color="$colorHover" fontSize="$3">
                            {deal.company}
                          </Text>
                        </XStack>
                      </YStack>
                      <Text color="$color" fontWeight="bold" fontSize="$5">
                        ${deal.value.toLocaleString()}
                      </Text>
                    </XStack>
                    <XStack justifyContent="space-between" alignItems="center">
                      <View
                        backgroundColor={getStageColor(deal.stage)}
                        paddingHorizontal="$3"
                        paddingVertical="$1"
                        borderRadius="$2"
                        opacity={0.2}
                      >
                        <Text
                          color={getStageColor(deal.stage)}
                          fontSize="$2"
                          textTransform="capitalize"
                        >
                          {deal.stage}
                        </Text>
                      </View>
                      <Text color="$colorHover" fontSize="$2">
                        {deal.probability}% probability
                      </Text>
                    </XStack>
                  </YStack>
                </Card>
              ))}
            </YStack>
          )}
        </YStack>
      </RNScrollView>
    </View>
  );
}
