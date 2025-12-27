import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Platform, Pressable, useColorScheme } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Text, XStack, YStack, useTheme } from 'tamagui';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, timing } from '../../lib/design-tokens';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastContextType {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast icon and haptic configuration (colors are provided via theme)
const toastIconConfig = {
  success: {
    icon: 'checkmark-circle' as const,
    haptic: Haptics.NotificationFeedbackType.Success,
  },
  error: {
    icon: 'close-circle' as const,
    haptic: Haptics.NotificationFeedbackType.Error,
  },
  warning: {
    icon: 'warning' as const,
    haptic: Haptics.NotificationFeedbackType.Warning,
  },
  info: {
    icon: 'information-circle' as const,
    haptic: Haptics.NotificationFeedbackType.Success,
  },
};

function ToastItemComponent({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const iconConfig = toastIconConfig[toast.type];
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Get theme-aware colors for toast types
  const themeColors = useMemo(() => ({
    success: theme.success?.val || (isDark ? '#4CAF50' : '#107C10'),
    error: theme.error?.val || (isDark ? '#EF5350' : '#C42B1C'),
    warning: theme.warning?.val || (isDark ? '#FFCA28' : '#C19C00'),
    info: theme.info?.val || theme.primary?.val || (isDark ? '#4BA0E8' : '#0F6CBD'),
    background: theme.background?.val || (isDark ? '#141414' : '#FFFFFF'),
    card: theme.card?.val || (isDark ? '#1F1F1F' : '#FFFFFF'),
    color: theme.color?.val || (isDark ? '#FFFFFF' : '#1A1A1A'),
    colorMuted: theme.colorMuted?.val || (isDark ? '#9E9E9E' : '#6B6B6B'),
    borderColor: theme.borderColor?.val || (isDark ? '#3D3D3D' : '#E0E0E0'),
    dismissIcon: isDark ? '#9E9E9E' : '#BDBDBD',
  }), [theme, isDark]);

  // Get the color for the current toast type
  const toastColor = themeColors[toast.type];

  const content = (
    <XStack alignItems="flex-start" gap="$3" flex={1}>
      <View style={[styles.iconContainer, { backgroundColor: `${toastColor}15` }]}>
        <Ionicons name={iconConfig.icon} size={20} color={toastColor} />
      </View>
      <YStack flex={1} gap="$1">
        <Text color="$color" fontWeight="600" fontSize="$3">
          {toast.title}
        </Text>
        {toast.message && (
          <Text color="$colorMuted" fontSize="$2">
            {toast.message}
          </Text>
        )}
      </YStack>
      {toast.action && (
        <Pressable onPress={toast.action.onPress}>
          <Text color={toastColor} fontWeight="600" fontSize="$2">
            {toast.action.label}
          </Text>
        </Pressable>
      )}
      <Pressable onPress={onDismiss} hitSlop={8}>
        <Ionicons name="close" size={18} color={themeColors.dismissIcon} />
      </Pressable>
    </XStack>
  );

  // Dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    blur: {
      padding: 16,
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)',
      borderRadius: borderRadius.xl,
    },
    webToast: {
      padding: 16,
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      backgroundColor: isDark ? 'rgba(31, 31, 31, 0.98)' : 'rgba(255, 255, 255, 0.98)',
      borderWidth: 1,
      borderColor: themeColors.borderColor,
      borderRadius: borderRadius.xl,
    },
  }), [isDark, themeColors.borderColor]);

  return (
    <MotiView
      from={{
        opacity: 0,
        translateY: -20,
        scale: 0.9,
      }}
      animate={{
        opacity: 1,
        translateY: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        translateY: -20,
        scale: 0.9,
      }}
      transition={{
        type: 'spring',
        damping: timing.professional.damping,
        stiffness: timing.professional.stiffness,
      }}
      style={styles.toastContainer}
    >
      {Platform.OS !== 'web' ? (
        <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={dynamicStyles.blur}>
          {content}
        </BlurView>
      ) : (
        <View style={dynamicStyles.webToast}>{content}</View>
      )}
    </MotiView>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    // Haptic feedback
    if (Platform.OS !== 'web') {
      const config = toastIconConfig[toast.type];
      Haptics.notificationAsync(config.haptic);
    }

    // Auto dismiss
    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <View style={[styles.container, { pointerEvents: 'box-none' }]}>
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItemComponent
              key={toast.id}
              toast={toast}
              onDismiss={() => hideToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </View>
    </ToastContext.Provider>
  );
}

// Convenience functions
export function toast(options: Omit<ToastItem, 'id' | 'type'> & { type?: ToastType }) {
  // This is a placeholder - in real usage, you'd access the context
  console.log('Toast:', options);
}

toast.success = (title: string, message?: string) => {
  console.log('Success toast:', { title, message });
};

toast.error = (title: string, message?: string) => {
  console.log('Error toast:', { title, message });
};

toast.warning = (title: string, message?: string) => {
  console.log('Warning toast:', { title, message });
};

toast.info = (title: string, message?: string) => {
  console.log('Info toast:', { title, message });
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  toastContainer: {
    marginBottom: 8,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    // Shadow is applied via platform-specific properties
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
