import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, View, type AccessibilityActionEvent } from 'react-native';
import Animated, {
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Distance between ticks. Wide enough to land on a value with a thumb. */
const TICK = 12;

type Props = {
  min: number;
  max: number;
  /** Value per tick. */
  step: number;
  /** Ticks between labelled majors; majors fall on round values, not on `min`. */
  majorEvery: number;
  value: number;
  onChange: (value: number) => void;
  /** Read by screen readers along with the value, e.g. "Height". */
  label: string;
  unit: string;
};

/**
 * A horizontal ruler you scroll under a fixed needle. The platform scroll view supplies the
 * momentum and the snapping; a worklet watches which tick is under the needle and reports each
 * new one once, with a selection haptic — the detent you feel on a native picker.
 */
export function RulerPicker({ min, max, step, majorEvery, value, onChange, label, unit }: Props) {
  const theme = useTheme();
  const ref = useAnimatedRef<Animated.ScrollView>();
  const [width, setWidth] = useState(0);
  const count = Math.round((max - min) / step) + 1;
  const indexOf = (v: number) => Math.round((v - min) / step);

  const start = indexOf(value) * TICK;
  const offset = useSharedValue(start);
  // A scroll view can report x = 0 before it reaches the starting value; until it arrives,
  // events are ignored so the minimum is never reported as a choice.
  const arrived = useSharedValue(false);
  const index = useDerivedValue(() =>
    Math.min(count - 1, Math.max(0, Math.round(offset.get() / TICK)))
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const x = event.contentOffset.x;
      if (!arrived.get()) {
        if (Math.abs(x - start) > 1) return;
        arrived.set(true);
      }
      offset.set(x);
    },
  });

  function report(i: number) {
    Haptics.selectionAsync();
    onChange(round(min + i * step));
  }

  useAnimatedReaction(
    () => index.get(),
    (i, previous) => {
      // `previous` is null on the first run, which is the initial value — not a user change.
      if (previous !== null && i !== previous) scheduleOnRN(report, i);
    }
  );

  function scrollToIndex(i: number, animated: boolean) {
    ref.current?.scrollTo({ x: Math.min(count - 1, Math.max(0, i)) * TICK, animated });
  }

  // Screen readers can't scrub a ruler, so it acts as an adjustable control instead.
  function onAccessibilityAction(event: AccessibilityActionEvent) {
    const current = indexOf(value);
    if (event.nativeEvent.actionName === 'increment') scrollToIndex(current + 1, true);
    if (event.nativeEvent.actionName === 'decrement') scrollToIndex(current - 1, true);
  }

  const fade = `${theme.background}00`;

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: `${value} ${unit}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={onAccessibilityAction}
      style={styles.frame}
      onLayout={(event) => {
        const next = event.nativeEvent.layout.width;
        if (next === width) return;
        setWidth(next);
      }}>
      {width > 0 && (
        <Animated.ScrollView
          ref={ref}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TICK}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={onScroll}
          // Lands on the starting value before the first frame is drawn.
          onContentSizeChange={() => scrollToIndex(indexOf(value), false)}
          contentContainerStyle={{ paddingHorizontal: width / 2 - TICK / 2 }}>
          {Array.from({ length: count }, (_, i) => {
            const tickValue = round(min + i * step);
            const major = isMultiple(tickValue, majorEvery * step);
            const mid =
              !major && majorEvery % 2 === 0 && isMultiple(tickValue, (majorEvery / 2) * step);
            return (
              <View key={i} style={styles.slot}>
                {/* Every tick rises from the same baseline, like a printed rule. */}
                <View style={styles.tickBox}>
                  <View
                    style={[
                      styles.tick,
                      major ? styles.major : mid ? styles.mid : styles.minor,
                      { backgroundColor: major ? theme.text : theme.textSecondary },
                    ]}
                  />
                </View>
                {major && (
                  <Text variant="caption" color="textSecondary" style={styles.tickLabel}>
                    {tickValue}
                  </Text>
                )}
              </View>
            );
          })}
        </Animated.ScrollView>
      )}

      <LinearGradient
        colors={[theme.background, fade]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.edge, styles.left]}
      />
      <LinearGradient
        colors={[fade, theme.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.edge, styles.right]}
      />
      <View style={[styles.needle, { backgroundColor: theme.accent }]} />
    </View>
  );
}

function isMultiple(value: number, of: number) {
  const remainder = Math.abs(value % of);
  return remainder < 1e-6 || of - remainder < 1e-6;
}

/** Steps like 0.5 accumulate float error; one decimal is all any of these values need. */
function round(value: number) {
  return Math.round(value * 10) / 10;
}

const styles = StyleSheet.create({
  frame: {
    height: 88,
  },
  slot: {
    width: TICK,
    height: 88,
    alignItems: 'center',
  },
  tickBox: {
    height: 52,
    justifyContent: 'flex-end',
  },
  tick: {
    width: 2,
    borderRadius: 1,
  },
  major: {
    height: 34,
  },
  mid: {
    height: 24,
    opacity: 0.7,
  },
  minor: {
    height: 14,
    opacity: 0.45,
  },
  tickLabel: {
    marginTop: Spacing.two,
    width: 48,
    textAlign: 'center',
  },
  edge: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 56,
    pointerEvents: 'none',
  },
  left: {
    left: 0,
  },
  right: {
    right: 0,
  },
  needle: {
    position: 'absolute',
    alignSelf: 'center',
    top: 8,
    width: 3,
    height: 48,
    borderRadius: 2,
    pointerEvents: 'none',
  },
});
