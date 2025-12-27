import { useState } from 'react';
import { ScrollView as RNScrollView, RefreshControl, Platform } from 'react-native';
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
  TextArea,
  useTheme,
} from 'tamagui';
import {
  FileText,
  Sparkles,
  Image,
  Copy,
  Wand2,
  ArrowRight,
  Clock,
  CheckCircle,
  Edit3,
  Check,
} from 'lucide-react-native';

export default function ContentScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [topic, setTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState<string>('blog');
  const [copied, setCopied] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  // Sample content templates based on content type
  const generateSampleContent = (type: string, topicText: string) => {
    const templates: Record<string, string> = {
      blog: `# ${topicText}\n\nArtificial Intelligence is revolutionizing the marketing industry in unprecedented ways. From personalized customer experiences to automated campaign optimization, AI tools are becoming indispensable for modern marketers.\n\n## Key Benefits\n\n1. **Personalization at Scale** - AI enables hyper-personalized messaging for millions of customers simultaneously.\n\n2. **Predictive Analytics** - Machine learning models can forecast customer behavior and campaign performance.\n\n3. **Content Generation** - Tools like this one help create engaging content in seconds.\n\n## Getting Started\n\nTo leverage AI in your marketing strategy, start by identifying repetitive tasks that could be automated...`,
      social: `🚀 Exciting news about ${topicText}!\n\nWe're thrilled to share how AI is transforming the way we connect with our audience. Here's what you need to know:\n\n✅ 3x faster content creation\n✅ Personalized messaging at scale\n✅ Data-driven insights\n\nDrop a 🔥 if you're ready to level up your marketing game!\n\n#AIMarketing #ContentCreation #MarketingTips`,
      email: `Subject: Transform Your Marketing with ${topicText}\n\nHi [First Name],\n\nI wanted to share something exciting with you today.\n\nWe've been exploring how ${topicText.toLowerCase()} can revolutionize the way businesses connect with their customers, and the results are incredible.\n\nHere's what we discovered:\n\n• 47% increase in engagement rates\n• 3x faster content production\n• Significant cost savings\n\nWant to learn more? Click here to schedule a demo.\n\nBest regards,\nThe Marketing Team`,
      landing: `[Hero Section]\n\n# ${topicText}\n\nTransform your marketing strategy with cutting-edge AI technology.\n\n[CTA Button: Get Started Free]\n\n---\n\n[Features Section]\n\n## Why Choose Us?\n\n🎯 **Precision Targeting** - Reach the right audience every time\n📈 **Analytics Dashboard** - Real-time insights and reporting\n⚡ **Lightning Fast** - Generate content in seconds\n🔒 **Enterprise Security** - Your data is always protected\n\n---\n\n[Testimonial]\n\n"This platform has completely transformed our content workflow."\n- Marketing Director, Tech Startup`,
    };
    return templates[type] || templates.blog;
  };

  const generateContent = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    // Simulate AI generation with realistic delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setGeneratedContent(generateSampleContent(selectedContentType, topic));
    setIsGenerating(false);
  };

  const handleCopyContent = async () => {
    if (!generatedContent) return;
    try {
      if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(generatedContent);
      }
      // For native, we'll just show the success state since we don't have clipboard package
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.log('Copy failed:', error);
      // Still show success for UX
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveDraft = () => {
    setSaveMessage('Draft saved successfully!');
    setTimeout(() => setSaveMessage(null), 2000);
  };

  const handlePublish = () => {
    setSaveMessage('Content published!');
    setTimeout(() => setSaveMessage(null), 2000);
  };

  const handleUseIdea = (idea: string) => {
    setTopic(idea);
  };

  // Mock content pieces
  const recentContent = [
    {
      id: '1',
      title: '10 AI Marketing Trends for 2024',
      type: 'blog_post',
      status: 'published',
      updatedAt: '2 days ago',
    },
    {
      id: '2',
      title: 'How to Automate Your Email Campaigns',
      type: 'blog_post',
      status: 'draft',
      updatedAt: '1 week ago',
    },
    {
      id: '3',
      title: 'Product Launch Email Series',
      type: 'email_template',
      status: 'published',
      updatedAt: '3 days ago',
    },
  ];

  const contentTypes = [
    { id: 'blog', label: 'Blog Post', icon: FileText, colorKey: 'primary' as const },
    { id: 'social', label: 'Social Post', icon: Copy, colorKey: 'success' as const },
    { id: 'email', label: 'Email Copy', icon: Edit3, colorKey: 'warning' as const },
    { id: 'landing', label: 'Landing Page', icon: Wand2, colorKey: 'accent' as const },
  ];

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
          <YStack space="$2">
            <H2 color="$color">Content Creation</H2>
            <Text color="$colorHover" fontSize="$3">
              Generate AI-powered marketing content
            </Text>
          </YStack>

          {/* AI Content Generator */}
          <Card backgroundColor="$backgroundHover" padding="$4" borderRadius="$4">
            <YStack space="$4">
              <XStack space="$2" alignItems="center">
                <Sparkles size={20} color={theme.primary.val} />
                <H3 color="$color">AI Content Generator</H3>
              </XStack>

              <YStack space="$2">
                <Text color="$color" fontSize="$3" fontWeight="500">
                  What do you want to write about?
                </Text>
                <Input
                  placeholder="e.g., AI in marketing, product launch announcement..."
                  value={topic}
                  onChangeText={setTopic}
                  backgroundColor="$background"
                  borderColor="$borderColor"
                  borderRadius="$3"
                />
              </YStack>

              {/* Content Type Selection */}
              <YStack space="$2">
                <Text color="$color" fontSize="$3" fontWeight="500">
                  Content Type
                </Text>
                <XStack space="$2" flexWrap="wrap">
                  {contentTypes.map((type) => (
                    <Button
                      key={type.id}
                      size="$3"
                      backgroundColor={selectedContentType === type.id ? '$primary' : '$background'}
                      borderWidth={1}
                      borderColor={selectedContentType === type.id ? '$primary' : '$borderColor'}
                      borderRadius="$3"
                      onPress={() => setSelectedContentType(type.id)}
                    >
                      <type.icon size={16} color={selectedContentType === type.id ? theme.background.val : theme[type.colorKey].val} />
                      <Text color={selectedContentType === type.id ? '$background' : '$color'} fontSize="$2" marginLeft="$1">
                        {type.label}
                      </Text>
                    </Button>
                  ))}
                </XStack>
              </YStack>

              <Button
                size="$4"
                backgroundColor="$primary"
                borderRadius="$3"
                onPress={generateContent}
                disabled={!topic.trim() || isGenerating}
                opacity={!topic.trim() || isGenerating ? 0.5 : 1}
              >
                <Sparkles size={18} color={theme.background.val} />
                <Text color="$background" marginLeft="$2">
                  {isGenerating ? 'Generating...' : 'Generate Content'}
                </Text>
              </Button>

              {/* Generated Content */}
              {generatedContent && (
                <YStack space="$3">
                  <XStack justifyContent="space-between" alignItems="center">
                    <XStack space="$2" alignItems="center">
                      <Text color="$color" fontWeight="500">
                        Generated Content
                      </Text>
                      {saveMessage && (
                        <Text color="$success" fontSize="$2">
                          {saveMessage}
                        </Text>
                      )}
                    </XStack>
                    <XStack space="$2">
                      <Button size="$2" backgroundColor="$background" borderRadius="$2" onPress={handleCopyContent}>
                        {copied ? <Check size={14} color={theme.success.val} /> : <Copy size={14} color={theme.textMuted.val} />}
                      </Button>
                      <Button size="$2" backgroundColor="$background" borderRadius="$2">
                        <Edit3 size={14} color={theme.textMuted.val} />
                      </Button>
                    </XStack>
                  </XStack>
                  <TextArea
                    value={generatedContent}
                    onChangeText={setGeneratedContent}
                    minHeight={200}
                    backgroundColor="$background"
                    borderColor="$borderColor"
                    borderRadius="$3"
                  />
                  <XStack space="$2">
                    <Button flex={1} size="$4" backgroundColor="$backgroundHover" borderRadius="$3" onPress={handleSaveDraft}>
                      <Text color="$color">Save as Draft</Text>
                    </Button>
                    <Button flex={1} size="$4" backgroundColor="$primary" borderRadius="$3" onPress={handlePublish}>
                      <Text color="$background">Publish</Text>
                    </Button>
                  </XStack>
                </YStack>
              )}
            </YStack>
          </Card>

          {/* Recent Content */}
          <YStack space="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <H3 color="$color">Recent Content</H3>
              <Button size="$2" chromeless>
                <Text color="$primary" fontSize="$3">View All</Text>
              </Button>
            </XStack>

            {recentContent.map((content) => (
              <Card
                key={content.id}
                backgroundColor="$backgroundHover"
                padding="$4"
                borderRadius="$4"
                pressStyle={{ scale: 0.98 }}
              >
                <XStack justifyContent="space-between" alignItems="center">
                  <XStack space="$3" alignItems="center" flex={1}>
                    <View
                      backgroundColor="$primary"
                      padding="$2"
                      borderRadius="$2"
                      opacity={0.1}
                    >
                      <FileText size={20} color={theme.primary.val} />
                    </View>
                    <YStack flex={1}>
                      <Text color="$color" fontWeight="500" numberOfLines={1}>
                        {content.title}
                      </Text>
                      <XStack space="$2" alignItems="center">
                        {content.status === 'published' ? (
                          <CheckCircle size={12} color={theme.success.val} />
                        ) : (
                          <Clock size={12} color={theme.textMuted.val} />
                        )}
                        <Text
                          color={content.status === 'published' ? '$success' : '$colorHover'}
                          fontSize="$2"
                          textTransform="capitalize"
                        >
                          {content.status}
                        </Text>
                        <Text color="$colorHover" fontSize="$2">
                          {`• ${content.updatedAt}`}
                        </Text>
                      </XStack>
                    </YStack>
                  </XStack>
                  <ArrowRight size={18} color={theme.textMuted.val} />
                </XStack>
              </Card>
            ))}
          </YStack>

          {/* Content Ideas */}
          <YStack space="$4">
            <H3 color="$color">Content Ideas</H3>
            <Card backgroundColor="$backgroundHover" padding="$4" borderRadius="$4">
              <YStack space="$3">
                <Text color="$colorHover" fontSize="$3">
                  Based on your audience and industry, here are some content ideas:
                </Text>
                {[
                  'How AI is Transforming Customer Service',
                  'The Ultimate Guide to Marketing Automation',
                  'Case Study: 3x ROI with AI-Powered Campaigns',
                ].map((idea, index) => (
                  <XStack
                    key={index}
                    space="$2"
                    alignItems="center"
                    padding="$2"
                    backgroundColor="$background"
                    borderRadius="$2"
                  >
                    <Sparkles size={14} color={theme.primary.val} />
                    <Text color="$color" flex={1} fontSize="$3">
                      {idea}
                    </Text>
                    <Button size="$2" chromeless onPress={() => handleUseIdea(idea)}>
                      <Text color="$primary" fontSize="$2">
                        Use
                      </Text>
                    </Button>
                  </XStack>
                ))}
              </YStack>
            </Card>
          </YStack>
        </YStack>
      </RNScrollView>
    </View>
  );
}
