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
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';

import { resetPassword } from '../../lib/supabase';
import { useUIStore } from '../../stores/uiStore';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { showToast } = useUIStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);

    try {
      const { error } = await resetPassword(data.email);

      if (error) {
        showToast('error', error.message);
      } else {
        setIsSuccess(true);
      }
    } catch (error) {
      showToast('error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <View flex={1} backgroundColor="$background" justifyContent="center" padding="$6">
        <YStack space="$6" maxWidth={400} width="100%" alignSelf="center" alignItems="center">
          <View
            backgroundColor="$success"
            padding="$4"
            borderRadius={100}
            opacity={0.2}
          >
            <CheckCircle size={48} color="#10b981" />
          </View>

          <YStack space="$2" alignItems="center">
            <Text fontSize="$7" fontWeight="bold" color="$color" textAlign="center">
              Check your email
            </Text>
            <Text fontSize="$4" color="$colorHover" textAlign="center">
              We've sent password reset instructions to{' '}
              <Text fontWeight="600">{getValues('email')}</Text>
            </Text>
          </YStack>

          <YStack space="$4" width="100%">
            <Button
              size="$5"
              backgroundColor="$primary"
              color="white"
              fontWeight="600"
              onPress={() => router.replace('/(auth)/login')}
            >
              Back to Sign In
            </Button>

            <Button
              size="$4"
              chromeless
              onPress={() => {
                setIsSuccess(false);
                onSubmit({ email: getValues('email') });
              }}
            >
              <Text color="$colorHover">Didn't receive the email? Resend</Text>
            </Button>
          </YStack>
        </YStack>
      </View>
    );
  }

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
              Forgot Password?
            </Text>
            <Text fontSize="$4" color="$colorHover">
              No worries, we'll send you reset instructions.
            </Text>
          </YStack>

          {/* Form */}
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
              {isLoading ? 'Sending...' : 'Reset Password'}
            </Button>
          </YStack>

          {/* Sign In Link */}
          <XStack justifyContent="center" space="$2">
            <Text color="$colorHover" fontSize="$3">
              Remember your password?
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
