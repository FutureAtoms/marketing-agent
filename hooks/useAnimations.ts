import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { timing } from '../lib/design-tokens';

// Press animation hook
export function usePressAnimation() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(0.98, {
      damping: timing.professional.damping,
      stiffness: timing.professional.stiffness,
    });
    if (Platform.OS !== 'web') {
      runOnJS(Haptics.selectionAsync)();
    }
  }, [scale]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: timing.spring.damping,
      stiffness: timing.spring.stiffness,
    });
  }, [scale]);

  return { animatedStyle, onPressIn, onPressOut };
}

// Shake animation for errors
export function useShakeAnimation() {
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const shake = useCallback(() => {
    translateX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [translateX]);

  return { animatedStyle, shake };
}

// Bounce animation for success states
export function useBounceAnimation() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bounce = useCallback(() => {
    scale.value = withSequence(
      withSpring(1.2, { damping: 3, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [scale]);

  return { animatedStyle, bounce };
}

// Pulse animation for attention
export function usePulseAnimation(autoStart = false) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const pulse = useCallback(() => {
    scale.value = withSequence(
      withTiming(1.05, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );
    opacity.value = withSequence(
      withTiming(0.7, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );
  }, [scale, opacity]);

  return { animatedStyle, pulse };
}

// Entrance animations
export function useEntranceAnimation(delay = 0) {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const animate = useCallback(() => {
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 15, stiffness: 100 })
    );
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 300 })
    );
  }, [delay, translateY, opacity]);

  return { animatedStyle, animate };
}

// Stagger animation for lists
export function useStaggerAnimation(itemCount: number, baseDelay = 50) {
  const getDelay = useCallback((index: number) => index * baseDelay, [baseDelay]);

  return { getDelay };
}

// Counter animation
export function useCounterAnimation(
  targetValue: number,
  duration = 1000
) {
  const displayValue = useSharedValue(0);
  const animatedValueRef = useRef(0);

  const animatedStyle = useAnimatedStyle(() => {
    animatedValueRef.current = Math.round(displayValue.value);
    return {};
  });

  const animate = useCallback(() => {
    displayValue.value = withTiming(targetValue, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetValue, duration, displayValue]);

  return {
    animatedStyle,
    animate,
    getValue: () => animatedValueRef.current,
  };
}

// Ripple effect hook
export function useRippleAnimation() {
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  const ripple = useCallback(() => {
    rippleScale.value = 0;
    rippleOpacity.value = 0.3;

    rippleScale.value = withTiming(2.5, {
      duration: 400,
      easing: Easing.out(Easing.cubic),
    });
    rippleOpacity.value = withDelay(
      150,
      withTiming(0, { duration: 250 })
    );
  }, [rippleScale, rippleOpacity]);

  return { rippleStyle, ripple };
}

// Parallax scroll animation
export function useParallaxAnimation(scrollY: { value: number }, offset: number) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: scrollY.value * 0.5 - offset },
    ],
  }));

  return { animatedStyle };
}

// Flip animation
export function useFlipAnimation() {
  const rotateY = useSharedValue(0);
  const isFlipped = useSharedValue(false);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotateY.value}deg` },
    ],
    backfaceVisibility: 'hidden' as const,
    opacity: rotateY.value > 90 ? 0 : 1,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotateY.value + 180}deg` },
    ],
    backfaceVisibility: 'hidden' as const,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    opacity: rotateY.value > 90 ? 1 : 0,
  }));

  const flip = useCallback(() => {
    const toValue = isFlipped.value ? 0 : 180;
    rotateY.value = withSpring(toValue, {
      damping: 15,
      stiffness: 100,
    });
    isFlipped.value = !isFlipped.value;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [rotateY, isFlipped]);

  return { frontStyle, backStyle, flip };
}

// Haptic feedback hook
export function useHaptics() {
  const light = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const medium = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const heavy = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  }, []);

  const success = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const warning = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, []);

  const error = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, []);

  const selection = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, []);

  return { light, medium, heavy, success, warning, error, selection };
}
