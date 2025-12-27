import { Stack } from 'expo-router';
import { View } from 'tamagui';

export default function AuthLayout() {
  return (
    <View flex={1} backgroundColor="$background">
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
      </Stack>
    </View>
  );
}
