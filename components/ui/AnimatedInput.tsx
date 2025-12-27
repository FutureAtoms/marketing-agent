import React, { useState, useRef } from 'react';
import { TextInput, View, StyleSheet, Platform, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { Text, XStack, useTheme } from 'tamagui';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, timing } from '../../lib/design-tokens';

export interface AnimatedInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
}

export function AnimatedInput({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  icon,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  disabled = false,
  autoCapitalize,
  keyboardType,
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const theme = useTheme();

  // Theme-aware colors
  const primaryColor = theme.primary?.val || '#0F6CBD';
  const errorColor = theme.error?.val || '#C42B1C';
  const borderColor = theme.borderColor?.val || '#E0E0E0';
  const textMutedColor = theme.textMuted?.val || '#6B6B6B';
  const textColor = theme.color?.val || '#1A1A1A';
  const backgroundColor = theme.background?.val || '#FFFFFF';
  const backgroundHoverColor = theme.backgroundHover?.val || '#FAFAFA';

  const handleFocus = () => {
    setIsFocused(true);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const hasValue = value.length > 0;
  const showFloatingLabel = isFocused || hasValue;

  return (
    <View style={styles.container}>
      <Pressable onPress={() => inputRef.current?.focus()}>
        <MotiView
          animate={{
            borderColor: error
              ? errorColor
              : isFocused
              ? primaryColor
              : borderColor,
            scale: isFocused ? 1.01 : 1,
          }}
          transition={{
            type: 'timing',
            duration: timing.fast,
          }}
          style={[
            styles.inputContainer,
            { backgroundColor, borderColor },
            disabled && { backgroundColor: backgroundHoverColor, opacity: 0.7 },
            multiline && { minHeight: numberOfLines * 24 + 32 },
          ]}
        >
          {/* Floating label */}
          {label && (
            <MotiView
              animate={{
                translateY: showFloatingLabel ? -24 : 0,
                scale: showFloatingLabel ? 0.85 : 1,
              }}
              transition={{
                type: 'timing',
                duration: timing.fast,
              }}
              style={styles.labelContainer}
            >
              <Text
                color={error ? errorColor : isFocused ? primaryColor : textMutedColor}
                fontSize="$3"
                fontWeight={showFloatingLabel ? '500' : '400'}
              >
                {label}
              </Text>
            </MotiView>
          )}

          <XStack alignItems="center" gap="$2" flex={1}>
            {icon && (
              <MotiView
                animate={{
                  scale: isFocused ? 1.1 : 1,
                  opacity: isFocused ? 1 : 0.6,
                }}
                transition={{ type: 'timing', duration: timing.fast }}
              >
                <Ionicons
                  name={icon}
                  size={20}
                  color={isFocused ? primaryColor : textMutedColor}
                />
              </MotiView>
            )}

            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={onChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={showFloatingLabel ? placeholder : label || placeholder}
              placeholderTextColor={textMutedColor}
              secureTextEntry={secureTextEntry && !showPassword}
              multiline={multiline}
              numberOfLines={numberOfLines}
              editable={!disabled}
              autoCapitalize={autoCapitalize}
              keyboardType={keyboardType}
              style={[
                styles.input,
                { color: textColor },
                multiline && styles.multilineInput,
                label && showFloatingLabel && { marginTop: 8 },
              ]}
            />

            {secureTextEntry && (
              <Pressable onPress={togglePassword} hitSlop={8}>
                <MotiView
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring' }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color={textMutedColor}
                  />
                </MotiView>
              </Pressable>
            )}
          </XStack>

          {/* Focus indicator line */}
          <MotiView
            animate={{
              scaleX: isFocused ? 1 : 0,
              opacity: isFocused ? 1 : 0,
            }}
            transition={{
              type: 'timing',
              duration: timing.normal,
            }}
            style={[
              styles.focusLine,
              { backgroundColor: error ? errorColor : primaryColor },
            ]}
          />
        </MotiView>
      </Pressable>

      {/* Error message */}
      {error && (
        <XStack alignItems="center" gap="$1" marginTop="$1" paddingHorizontal="$1">
          <Ionicons name="alert-circle" size={14} color={errorColor} />
          <Text color={errorColor} fontSize="$2">
            {error}
          </Text>
        </XStack>
      )}
    </View>
  );
}

// Search input with animation
export function AnimatedSearchInput({
  value,
  onChangeText,
  placeholder = 'Search...',
  onSubmit,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const theme = useTheme();

  // Theme-aware colors
  const primaryColor = theme.primary?.val || '#0F6CBD';
  const textMutedColor = theme.textMuted?.val || '#6B6B6B';
  const textColor = theme.color?.val || '#1A1A1A';
  const backgroundColor = theme.background?.val || '#FFFFFF';
  const backgroundHoverColor = theme.backgroundHover?.val || '#FAFAFA';

  return (
    <MotiView
      animate={{
        backgroundColor: isFocused ? backgroundColor : backgroundHoverColor,
        scale: isFocused ? 1.02 : 1,
      }}
      transition={{ type: 'timing', duration: timing.fast }}
      style={styles.searchContainer}
    >
      <MotiView
        animate={{ rotate: isFocused ? '10deg' : '0deg' }}
        transition={{ type: 'timing', duration: 150 }}
      >
        <Ionicons
          name="search"
          size={20}
          color={isFocused ? primaryColor : textMutedColor}
        />
      </MotiView>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={textMutedColor}
        style={[styles.searchInput, { color: textColor }]}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={20} color={textMutedColor} />
        </Pressable>
      )}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  labelContainer: {
    position: 'absolute',
    left: 16,
    top: 14,
    backgroundColor: 'transparent',
    zIndex: 1,
    transformOrigin: 'left center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    minHeight: 24,
  },
  multilineInput: {
    textAlignVertical: 'top',
  },
  focusLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    transformOrigin: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: borderRadius.full,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
});
