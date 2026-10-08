import { useCallback } from 'react';
import {
  Easing,
  FadeInDown,
  Keyframe,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { EASE_OUT } from '@/constants/motion';

/**
 * Entrance for the auth screen's blocks: a short rise from 12pt below, staggered by `index`.
 * Layout animations default to ReduceMotion.System, so these are skipped under reduced motion.
 */
export function rise(index: number) {
  return FadeInDown.duration(300)
    .delay(80 + index * 50)
    .easing(EASE_OUT)
    .withInitialValues({ opacity: 0, transform: [{ translateY: 12 }] });
}

/** The brand panel settles in from a hair under full size — never from nothing. */
export const settle = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.96 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: EASE_OUT },
}).duration(400);

const SHAKE = { duration: 45, easing: Easing.inOut(Easing.quad) };

/**
 * A short sideways shake for a rejected submit. Reduced motion skips straight to rest, so the
 * error message and haptic carry the feedback alone.
 */
export function useShake() {
  const x = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }],
  }));
  const shake = useCallback(() => {
    x.set(
      withSequence(
        ReduceMotion.System,
        withTiming(-8, SHAKE),
        withTiming(8, SHAKE),
        withTiming(-6, SHAKE),
        withTiming(6, SHAKE),
        withTiming(-3, SHAKE),
        withTiming(0, { duration: 80, easing: EASE_OUT })
      )
    );
  }, [x]);
  return { style, shake };
}
