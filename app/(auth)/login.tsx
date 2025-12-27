import { useState } from 'react';
import { Platform, KeyboardAvoidingView } from 'react-native';
import { Link, router } from 'expo-router';
import {
  View,
  Text,
  YStack,
  XStack,
  Input,
  Button,
  Separator,
  ScrollView,
} from 'tamagui';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginWithOAuth, isLoading, error, clearError } = useAuthStore();
  const { showToast } = useUIStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    const result = await login(data.email, data.password);

    if (result.success) {
      router.replace('/(main)/(tabs)/dashboard');
    } else {
      showToast('error', result.error || 'Login failed');
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    const result = await loginWithOAuth(provider);
    if (!result.success) {
      showToast('error', result.error || 'OAuth login failed');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        flex={1}
        backgroundColor="$background"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <YStack space="$6" maxWidth={400} width="100%" alignSelf="center">
          {/* Header */}
          <YStack space="$2" alignItems="center">
            <Text fontSize="$9" fontWeight="bold" color="$color">
              Marketing Hub
            </Text>
            <Text fontSize="$4" color="$colorHover">
              Sign in to your account
            </Text>
          </YStack>

          {/* Error Message */}
          {error && (
            <View
              backgroundColor="$error"
              padding="$3"
              borderRadius="$4"
              opacity={0.9}
            >
              <Text color="white" textAlign="center">
                {error}
              </Text>
            </View>
          )}

          {/* Login Form */}
          <YStack space="$4">
            {/* Email Input */}
            <YStack space="$2">
              <Text fontSize="$3" color="$color" fontWeight="500">
                Email
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <XStack
                    alignItems="center"
                    borderWidth={1}
                    borderColor={errors.email ? '$error' : '$borderColor'}
                    borderRadius="$4"
                    paddingHorizontal="$3"
                    backgroundColor="$backgroundHover"
                  >
                    <Mail size={20} color="#64748b" />
                    <Input
                      flex={1}
                      placeholder="you@example.com"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      borderWidth={0}
                      backgroundColor="transparent"
                    />
                  </XStack>
                )}
              />
              {errors.email && (
                <Text fontSize="$2" color="$error">
                  {errors.email.message}
                </Text>
              )}
            </YStack>

            {/* Password Input */}
            <YStack space="$2">
              <Text fontSize="$3" color="$color" fontWeight="500">
                Password
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <XStack
                    alignItems="center"
                    borderWidth={1}
                    borderColor={errors.password ? '$error' : '$borderColor'}
                    borderRadius="$4"
                    paddingHorizontal="$3"
                    backgroundColor="$backgroundHover"
                  >
                    <Lock size={20} color="#64748b" />
                    <Input
                      flex={1}
                      placeholder="Enter your password"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showPassword}
                      borderWidth={0}
                      backgroundColor="transparent"
                    />
                    <Button
                      size="$2"
                      chromeless
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#64748b" />
                      ) : (
                        <Eye size={20} color="#64748b" />
                      )}
                    </Button>
                  </XStack>
                )}
              />
              {errors.password && (
                <Text fontSize="$2" color="$error">
                  {errors.password.message}
                </Text>
              )}
            </YStack>

            {/* Forgot Password */}
            <XStack justifyContent="flex-end">
              <Link href="/(auth)/forgot-password" asChild>
                <Text fontSize="$3" color="$primary" fontWeight="500">
                  Forgot password?
                </Text>
              </Link>
            </XStack>

            {/* Submit Button */}
            <Button
              size="$5"
              backgroundColor="$primary"
              color="white"
              fontWeight="600"
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              opacity={isLoading ? 0.7 : 1}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </YStack>

          {/* Divider */}
          <XStack alignItems="center" space="$4">
            <Separator flex={1} />
            <Text color="$colorHover" fontSize="$3">
              or continue with
            </Text>
            <Separator flex={1} />
          </XStack>

          {/* OAuth Buttons */}
          <XStack space="$4">
            <Button
              flex={1}
              size="$5"
              variant="outlined"
              borderColor="$borderColor"
              onPress={() => handleOAuthLogin('google')}
              disabled={isLoading}
            >
              <Text>Google</Text>
            </Button>
            <Button
              flex={1}
              size="$5"
              variant="outlined"
              borderColor="$borderColor"
              onPress={() => handleOAuthLogin('github')}
              disabled={isLoading}
            >
              <Text>GitHub</Text>
            </Button>
          </XStack>

          {/* Sign Up Link */}
          <XStack justifyContent="center" space="$2">
            <Text color="$colorHover" fontSize="$3">
              Don't have an account?
            </Text>
            <Link href="/(auth)/register" asChild>
              <Text color="$primary" fontSize="$3" fontWeight="600">
                Sign up
              </Text>
            </Link>
          </XStack>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
