import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type AccessibilityActionEvent,
} from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Text } from '@/components/ui/text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useClay, useTheme } from '@/hooks/use-theme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

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
 * A large readout over a horizontal ruler you scroll under a fixed needle. The platform scroll
 * view supplies the momentum and the snapping; a worklet watches which tick is under the needle.
 * The readout is drawn from that worklet on the UI thread, so it keeps up with the ruler however
 * fast it moves; each new value is also reported to `onChange` with a selection haptic — the
 * detent you feel on a native picker.
 */
export function RulerPicker({ min, max, step, majorEvery, value, onChange, label, unit }: Props) {
  const theme = useTheme();
  const clay = useClay();
  const ref = useAnimatedRef<Animated.ScrollView>();
  const [width, setWidth] = useState(0);
  const count = Math.round((max - min) / step) + 1;
  const decimals = step < 1 ? 1 : 0;
  const indexOf = (v: number) => Math.round((v - min) / step);

  const start = indexOf(value) * TICK;
  const offset = useSharedValue(start);
  // The scroll view can report x = 0 before it reaches the starting value, so its events only
  // count once it has reported landing there, the user has started a drag, or a screen reader
  // stepped it. Relying on the landing alone wasn't enough: when that event never came, every
  // drag was ignored and the value stood still. (Web has no drag events for wheel scrolling, but
  // there the landing is reported reliably.)
  const armed = useSharedValue(false);
  const index = useDerivedValue(() =>
    Math.min(count - 1, Math.max(0, Math.round(offset.get() / TICK)))
  );

  const onScroll = useAnimatedScrollHandler({
    onBeginDrag: () => {
      armed.set(true);
    },
    onScroll: (event) => {
      const x = event.contentOffset.x;
      if (!armed.get()) {
        if (Math.abs(x - start) > 1) return;
        armed.set(true);
      }
      offset.set(x);
    },
  });

  const readoutProps = useAnimatedProps(() => {
    const text = formatValue(min + index.get() * step, decimals);
    return { text, defaultValue: text } as object;
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
    armed.set(true);
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
      style={styles.picker}>
      <View style={styles.readout}>
        {Platform.OS === 'web' ? (
          // Web can't set a text input's text from a worklet; there the reported value is drawn.
          <Text style={[styles.readoutValue, { color: theme.text }]}>
            {formatValue(value, decimals)}
          </Text>
        ) : (
          <AnimatedTextInput
            editable={false}
            underlineColorAndroid="transparent"
            defaultValue={formatValue(value, decimals)}
            animatedProps={readoutProps}
            importantForAccessibility="no"
            style={[styles.readoutValue, styles.readoutInput, { color: theme.text }]}
          />
        )}
        <Text variant="title" color="textSecondary">
          {unit}
        </Text>
      </View>

      <View
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
            <Ticks
              min={min}
              count={count}
              step={step}
              majorEvery={majorEvery}
              majorColor={theme.text}
              minorColor={theme.textSecondary}
            />
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
        <View style={[styles.needle, { backgroundColor: theme.accent }, clay.accent]} />
      </View>
    </View>
  );
}

/**
 * The printed rule. Up to a few hundred views, and nothing in it depends on the value, so it is
 * memoised: a new value re-renders the readout's parent, not every tick.
 */
const Ticks = memo(function Ticks({
  min,
  count,
  step,
  majorEvery,
  majorColor,
  minorColor,
}: {
  min: number;
  count: number;
  step: number;
  majorEvery: number;
  majorColor: string;
  minorColor: string;
}) {
  return Array.from({ length: count }, (_, i) => {
    const tickValue = round(min + i * step);
    const major = isMultiple(tickValue, majorEvery * step);
    const mid = !major && majorEvery % 2 === 0 && isMultiple(tickValue, (majorEvery / 2) * step);
    return (
      <View key={i} style={styles.slot}>
        {/* Every tick rises from the same baseline, like a printed rule. */}
        <View style={styles.tickBox}>
          <View
            style={[
              styles.tick,
              major ? styles.major : mid ? styles.mid : styles.minor,
              { backgroundColor: major ? majorColor : minorColor },
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
  });
});

/** "70" or "70.5": whole steps show no decimals, half steps always show one. */
function formatValue(value: number, decimals: number) {
  'worklet';
  return (Math.round(value * 10) / 10).toFixed(decimals);
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
  picker: {
    gap: Spacing.four,
  },
  readout: {
    alignItems: 'center',
    gap: Spacing.half,
  },
  readoutValue: {
    fontFamily: FontFamily.display,
    fontSize: 64,
    lineHeight: 72,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  readoutInput: {
    alignSelf: 'stretch',
    padding: 0,
    margin: 0,
    includeFontPadding: false,
  },
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
    width: 6,
    height: 52,
    borderRadius: 3,
    pointerEvents: 'none',
  },
});
