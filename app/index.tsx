import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, Text, YStack, Spinner } from 'tamagui';

import { useAuthStore } from '../stores/authStore';

export default function Index() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <View flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <YStack space="$4" alignItems="center">
          <Spinner size="large" color="$primary" />
          <Text color="$color" fontSize="$4">
            Loading...
          </Text>
        </YStack>
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(main)/(tabs)/dashboard" />;
  }

  return <Redirect href="/(auth)/login" />;
}
