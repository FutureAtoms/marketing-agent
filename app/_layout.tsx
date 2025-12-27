import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TamaguiProvider, Theme } from 'tamagui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import config from '../tamagui.config';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import { ToastProvider } from '../components/ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const { colorScheme } = useUIStore();
  const { initialize } = useAuthStore();

  // Determine actual theme
  const resolvedTheme =
    colorScheme === 'system'
      ? systemColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : colorScheme;

  useEffect(() => {
    // Initialize auth state on app load
    initialize();
  }, [initialize]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <TamaguiProvider config={config}>
            <Theme name={resolvedTheme}>
              <ToastProvider>
                <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                  }}
                >
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(main)" options={{ headerShown: false }} />
                </Stack>
              </ToastProvider>
            </Theme>
          </TamaguiProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
