import { Tabs } from 'expo-router';
import { Platform, useWindowDimensions, View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, useTheme } from 'tamagui';
import {
  LayoutDashboard,
  Share2,
  Mail,
  FileText,
  Users,
  Settings,
} from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';

// Custom Sidebar component for desktop
function DesktopSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  // Theme-aware colors
  const activeColor = theme.primary?.val as string;
  const inactiveColor = theme.textMuted?.val as string;
  const backgroundColor = theme.background?.val as string;
  const borderColor = theme.borderColor?.val as string;
  const activeBackgroundColor = `${activeColor}1A`; // 10% opacity

  const tabs = [
    { name: 'dashboard', title: 'Dashboard', Icon: LayoutDashboard },
    { name: 'social', title: 'Social', Icon: Share2 },
    { name: 'email', title: 'Email', Icon: Mail },
    { name: 'content', title: 'Content', Icon: FileText },
    { name: 'crm', title: 'CRM', Icon: Users },
    { name: 'settings', title: 'Settings', Icon: Settings },
  ];

  return (
    <View style={[styles.sidebar, { backgroundColor, borderRightColor: borderColor }]}>
      {tabs.map((tab) => {
        const isActive = pathname.includes(tab.name);
        return (
          <Pressable
            key={tab.name}
            style={[
              styles.sidebarItem,
              isActive && { backgroundColor: activeBackgroundColor },
            ]}
            onPress={() => router.push(`/(main)/(tabs)/${tab.name}` as any)}
          >
            <tab.Icon size={22} color={isActive ? activeColor : inactiveColor} />
            <Text
              style={[
                styles.sidebarLabel,
                { color: isActive ? activeColor : inactiveColor },
              ]}
            >
              {tab.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const theme = useTheme();

  // Theme-aware colors
  const activeColor = theme.primary?.val as string;
  const inactiveColor = theme.textMuted?.val as string;
  const backgroundColor = theme.background?.val as string;
  const borderColor = theme.borderColor?.val as string;

  if (isDesktop) {
    // Desktop layout with custom sidebar
    return (
      <View style={styles.desktopContainer}>
        <DesktopSidebar />
        <View style={styles.desktopContent}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' },
            }}
          >
            <Tabs.Screen name="dashboard" />
            <Tabs.Screen name="social" />
            <Tabs.Screen name="email" />
            <Tabs.Screen name="content" />
            <Tabs.Screen name="crm" />
            <Tabs.Screen name="settings" />
          </Tabs>
        </View>
      </View>
    );
  }

  // Mobile layout with bottom tab bar
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor,
          borderTopColor: borderColor,
          borderTopWidth: 1,
          paddingBottom: insets.bottom || 8,
          paddingTop: 8,
          height: 60 + (insets.bottom || 8),
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ color, size }) => (
            <Share2 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="email"
        options={{
          title: 'Email',
          tabBarIcon: ({ color, size }) => (
            <Mail size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="content"
        options={{
          title: 'Content',
          tabBarIcon: ({ color, size }) => (
            <FileText size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="crm"
        options={{
          title: 'CRM',
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 80,
    borderRightWidth: 1,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  sidebarItem: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  desktopContent: {
    flex: 1,
  },
});
