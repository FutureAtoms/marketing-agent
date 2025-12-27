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
  ScrollView,
} from 'tamagui';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';

import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading, error, clearError } = useAuthStore();
  const { showToast } = useUIStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    clearError();
    const result = await register(data.email, data.password, data.fullName);

    if (result.success) {
      showToast('success', 'Account created! Please check your email to verify.');
      router.replace('/(auth)/login');
    } else {
      showToast('error', result.error || 'Registration failed');
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
          {/* Back Button */}
          <Link href="/(auth)/login" asChild>
            <Button size="$3" chromeless alignSelf="flex-start">
              <ArrowLeft size={20} color="#64748b" />
              <Text color="$colorHover">Back to login</Text>
            </Button>
          </Link>

          {/* Header */}
          <YStack space="$2">
            <Text fontSize="$8" fontWeight="bold" color="$color">
              Create Account
            </Text>
            <Text fontSize="$4" color="$colorHover">
              Start your marketing journey today
            </Text>
          </YStack>

          {/* Error Message */}
          {error && (
            <View backgroundColor="$error" padding="$3" borderRadius="$4" opacity={0.9}>
              <Text color="white" textAlign="center">
                {error}
              </Text>
            </View>
          )}

          {/* Register Form */}
          <YStack space="$4">
            {/* Full Name Input */}
            <YStack space="$2">
              <Text fontSize="$3" color="$color" fontWeight="500">
                Full Name
              </Text>
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <XStack
                    alignItems="center"
                    borderWidth={1}
                    borderColor={errors.fullName ? '$error' : '$borderColor'}
                    borderRadius="$4"
                    paddingHorizontal="$3"
                    backgroundColor="$backgroundHover"
                  >
                    <User size={20} color="#64748b" />
                    <Input
                      flex={1}
                      placeholder="John Doe"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="words"
                      borderWidth={0}
                      backgroundColor="transparent"
                    />
                  </XStack>
                )}
              />
              {errors.fullName && (
                <Text fontSize="$2" color="$error">
                  {errors.fullName.message}
                </Text>
              )}
            </YStack>

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
                      placeholder="At least 8 characters"
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

            {/* Confirm Password Input */}
            <YStack space="$2">
              <Text fontSize="$3" color="$color" fontWeight="500">
                Confirm Password
              </Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <XStack
                    alignItems="center"
                    borderWidth={1}
                    borderColor={errors.confirmPassword ? '$error' : '$borderColor'}
                    borderRadius="$4"
                    paddingHorizontal="$3"
                    backgroundColor="$backgroundHover"
                  >
                    <Lock size={20} color="#64748b" />
                    <Input
                      flex={1}
                      placeholder="Confirm your password"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry={!showPassword}
                      borderWidth={0}
                      backgroundColor="transparent"
                    />
                  </XStack>
                )}
              />
              {errors.confirmPassword && (
                <Text fontSize="$2" color="$error">
                  {errors.confirmPassword.message}
                </Text>
              )}
            </YStack>

            {/* Submit Button */}
            <Button
              size="$5"
              backgroundColor="$primary"
              color="white"
              fontWeight="600"
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              opacity={isLoading ? 0.7 : 1}
              marginTop="$2"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </YStack>

          {/* Terms */}
          <Text fontSize="$2" color="$colorHover" textAlign="center">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Text>

          {/* Sign In Link */}
          <XStack justifyContent="center" space="$2">
            <Text color="$colorHover" fontSize="$3">
              Already have an account?
            </Text>
            <Link href="/(auth)/login" asChild>
              <Text color="$primary" fontSize="$3" fontWeight="600">
                Sign in
              </Text>
            </Link>
          </XStack>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
