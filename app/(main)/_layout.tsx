import { Redirect, Stack } from 'expo-router';
import { View, Spinner, Text, YStack } from 'tamagui';
import { Platform } from 'react-native';

import { useAuthStore } from '../../stores/authStore';

// Development mode bypass for testing
const DEV_BYPASS_AUTH = __DEV__ && Platform.OS === 'web' && typeof window !== 'undefined' && window.location.search.includes('bypass_auth=true');

export default function MainLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Allow bypass in development for testing
  if (DEV_BYPASS_AUTH) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    );
  }

  if (isLoading) {
    return (
      <View flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <YStack space="$4" alignItems="center">
          <Spinner size="large" color="$primary" />
          <Text color="$color">Loading...</Text>
        </YStack>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
