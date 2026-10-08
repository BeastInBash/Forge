import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  ReduceMotion,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

/** Plot insets: y labels on the left, date labels underneath. */
const LEFT = 44;
const RIGHT = 12;
const TOP = 14;
const BOTTOM = 26;
const DOT = 12;

export type ChartPoint = { t: number; v: number };

type Props = {
  points: ChartPoint[];
  /**
   * Identifies the series. A new key (another range or exercise) draws the line in fresh; the same
   * key with new values (another metric) morphs the line from where it was.
   */
  seriesKey: string;
  color: string;
  formatTick: (value: number) => string;
  /** The scrubbed point's index, or null when the finger lifts. */
  onActiveChange: (index: number | null) => void;
  height?: number;
};

const shortDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const monthYear = new Intl.DateTimeFormat(undefined, { month: 'short', year: '2-digit' });

/** About three round-numbered gridlines covering [min, max]. */
function scaleFor(values: number[]) {
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    const pad = Math.max(1, Math.abs(min) * 0.1);
    min -= pad;
    max += pad;
  }
  const pad = (max - min) * 0.15;
  min = Math.min(...values) >= 0 ? Math.max(0, min - pad) : min - pad;
  max += pad;

  const raw = (max - min) / 3;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? raw;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let tick = lo; tick <= hi + step / 2; tick += step) ticks.push(tick);
  return { lo, hi, ticks };
}

/** Smooth path through the points that never overshoots them (monotone cubic, Fritsch–Carlson). */
function linePath(xs: number[], ys: number[]) {
  'worklet';
  const n = xs.length;
  if (n === 0) return '';
  if (n === 1) return `M${xs[0]},${ys[0]}`;

  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = xs[i + 1] - xs[i];
    slopes.push(dx > 0 ? (ys[i + 1] - ys[i]) / dx : 0);
  }
  const tangents: number[] = [slopes[0]];
  for (let i = 1; i < n - 1; i++) {
    tangents.push(slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2);
  }
  tangents.push(slopes[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / slopes[i];
    const b = tangents[i + 1] / slopes[i];
    const s = a * a + b * b;
    if (s > 9) {
      const tau = 3 / Math.sqrt(s);
      tangents[i] = tau * a * slopes[i];
      tangents[i + 1] = tau * b * slopes[i];
    }
  }

  let d = `M${xs[0]},${ys[0]}`;
  for (let i = 0; i < n - 1; i++) {
    const third = (xs[i + 1] - xs[i]) / 3;
    d += `C${xs[i] + third},${ys[i] + tangents[i] * third},${xs[i + 1] - third},${
      ys[i + 1] - tangents[i + 1] * third
    },${xs[i + 1]},${ys[i + 1]}`;
  }
  return d;
}

function nearestIndex(xs: number[], x: number) {
  'worklet';
  let best = 0;
  for (let i = 1; i < xs.length; i++) {
    if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i;
  }
  return best;
}

/**
 * A lift's progress over time: a smooth line with a soft fill, drawn in from the floor left to
 * right when a series appears and morphed in place when the metric changes. Drag or tap to
 * scrub; the chart reports the point under the finger and ticks a haptic per point.
 */
export function LiftChart(props: Props) {
  const [width, setWidth] = useState(0);
  return (
    <View
      style={{ height: props.height ?? 220 }}
      onLayout={(event) => setWidth(Math.round(event.nativeEvent.layout.width))}>
      {width > 0 && <Plot {...props} width={width} />}
    </View>
  );
}

function Plot({
  points,
  seriesKey,
  color,
  formatTick,
  onActiveChange,
  height = 220,
  width,
}: Props & { width: number }) {
  const theme = useTheme();
  const plotWidth = width - LEFT - RIGHT;
  const plotHeight = height - TOP - BOTTOM;
  const floor = TOP + plotHeight;

  const { lo, hi, ticks } = scaleFor(points.map((p) => p.v));
  const t0 = points[0]?.t ?? 0;
  const span = (points[points.length - 1]?.t ?? 0) - t0;
  const xFor = (t: number) => LEFT + (span > 0 ? ((t - t0) / span) * plotWidth : plotWidth / 2);
  const yFor = (v: number) => TOP + (1 - (v - lo) / (hi - lo)) * plotHeight;
  const xs = points.map((p) => xFor(p.t));
  const ys = points.map((p) => yFor(p.v));

  // What the line animates between, and how far along it is.
  const xsValue = useSharedValue<number[]>(xs);
  const fromYs = useSharedValue<number[]>(xs.map(() => floor));
  const toYs = useSharedValue<number[]>(ys);
  const progress = useSharedValue(0);
  /** Above 0 the points rise one after another, left to right. */
  const stagger = useSharedValue(0.6);
  const drawn = useRef<{ key: string; ys: number[] } | undefined>(undefined);

  const xsKey = xs.join(',');
  const ysKey = ys.join(',');
  useEffect(() => {
    const previous = drawn.current;
    const morph = previous?.key === seriesKey && previous.ys.length === ys.length;
    drawn.current = { key: seriesKey, ys };

    xsValue.set(xs);
    fromYs.set(morph ? previous.ys : xs.map(() => floor));
    toYs.set(ys);
    stagger.set(morph ? 0 : 0.6);
    progress.set(0);
    progress.set(
      withTiming(1, {
        duration: morph ? 450 : 900,
        easing: morph ? EASE_IN_OUT : EASE_OUT,
        reduceMotion: ReduceMotion.System,
      })
    );
    // xsKey/ysKey stand in for the arrays, which are new on every render.
  }, [seriesKey, xsKey, ysKey, floor]);

  const currentYs = useDerivedValue(() => {
    const from = fromYs.get();
    const to = toYs.get();
    const p = progress.get();
    const s = stagger.get();
    const last = Math.max(1, to.length - 1);
    return to.map((y, i) => {
      const local = s > 0 ? Math.min(1, Math.max(0, p * (1 + s) - (i / last) * s)) : p;
      return (from[i] ?? y) + (y - (from[i] ?? y)) * local;
    });
  });

  const lineProps = useAnimatedProps(() => ({ d: linePath(xsValue.get(), currentYs.get()) }));
  const areaProps = useAnimatedProps(() => {
    const xsNow = xsValue.get();
    if (xsNow.length < 2) return { d: '' };
    return {
      d: `${linePath(xsNow, currentYs.get())}L${xsNow[xsNow.length - 1]},${floor}L${xsNow[0]},${floor}Z`,
    };
  });
  const lastDotProps = useAnimatedProps(() => {
    const xsNow = xsValue.get();
    const ysNow = currentYs.get();
    const n = xsNow.length;
    const appearing = stagger.get() > 0;
    return {
      cx: n ? xsNow[n - 1] : 0,
      cy: n ? ysNow[n - 1] : 0,
      r: appearing ? interpolate(progress.get(), [0.75, 1], [0, 5], 'clamp') : 5,
    };
  });

  // Scrubbing.
  const scrubX = useSharedValue(0);
  const scrubOpacity = useSharedValue(0);
  const activeIndex = useDerivedValue(() =>
    xsValue.get().length ? nearestIndex(xsValue.get(), scrubX.get()) : 0
  );

  function report(index: number, previous: number) {
    onActiveChange(index < 0 ? null : index);
    if (index >= 0 && index !== previous) Haptics.selectionAsync();
  }

  useAnimatedReaction(
    () => (scrubOpacity.get() > 0.01 ? activeIndex.get() : -1),
    (index, previous) => {
      if (index !== previous) scheduleOnRN(report, index, previous ?? -1);
    }
  );

  const pan = Gesture.Pan()
    .activeOffsetX([-4, 4])
    .failOffsetY([-12, 12])
    .onStart((event) => {
      scrubX.set(event.x);
      scrubOpacity.set(withTiming(1, { duration: 120 }));
    })
    .onUpdate((event) => {
      scrubX.set(event.x);
    })
    .onFinalize(() => {
      scrubOpacity.set(withTiming(0, { duration: 200 }));
    });
  const tap = Gesture.Tap().onEnd((event) => {
    scrubX.set(event.x);
    scrubOpacity.set(
      withSequence(
        withTiming(1, { duration: 120 }),
        withDelay(1800, withTiming(0, { duration: 200 }))
      )
    );
  });

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: scrubOpacity.get(),
    transform: [{ translateX: xsValue.get()[activeIndex.get()] ?? 0 }],
  }));
  const cursorDotStyle = useAnimatedStyle(() => ({
    opacity: scrubOpacity.get(),
    transform: [
      { translateX: (xsValue.get()[activeIndex.get()] ?? 0) - DOT / 2 },
      { translateY: (toYs.get()[activeIndex.get()] ?? 0) - DOT / 2 },
      { scale: interpolate(scrubOpacity.get(), [0, 1], [0.6, 1]) },
    ],
  }));

  const gradientId = `lift-fill-${color.replace('#', '')}`;
  const longRange = span > 300 * 24 * 3600 * 1000;
  const dateLabel = (t: number) => (longRange ? monthYear : shortDate).format(new Date(t));
  const showMiddle = points.length > 2 && plotWidth > 260;

  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <View
        style={StyleSheet.absoluteFill}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Chart of ${points.length} sessions, from ${formatTick(
          points[0]?.v ?? 0
        )} to ${formatTick(points[points.length - 1]?.v ?? 0)}`}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.32} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {ticks.map((tick) => (
            <Line
              key={tick}
              x1={LEFT}
              x2={width - RIGHT}
              y1={yFor(tick)}
              y2={yFor(tick)}
              stroke={theme.line}
              strokeWidth={1}
              strokeDasharray="3 5"
            />
          ))}
          <AnimatedPath animatedProps={areaProps} fill={`url(#${gradientId})`} />
          <AnimatedPath
            animatedProps={lineProps}
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <AnimatedCircle
            animatedProps={lastDotProps}
            fill={color}
            stroke={theme.surface}
            strokeWidth={3}
          />
        </Svg>

        {ticks.map((tick) => (
          <Animated.View
            key={`${seriesKey}-${tick}-${formatTick(tick)}`}
            entering={FadeIn.duration(250)}
            style={[styles.yLabel, { top: yFor(tick) - 8 }]}>
            <Text variant="caption" color="textSecondary" numberOfLines={1}>
              {formatTick(tick)}
            </Text>
          </Animated.View>
        ))}

        {points.length > 0 && (
          <View style={[styles.xLabels, { left: LEFT, right: RIGHT }]}>
            <Text variant="caption" color="textSecondary">
              {dateLabel(points[0].t)}
            </Text>
            {showMiddle && (
              <Text variant="caption" color="textSecondary">
                {dateLabel(t0 + span / 2)}
              </Text>
            )}
            {points.length > 1 && (
              <Text variant="caption" color="textSecondary">
                {dateLabel(points[points.length - 1].t)}
              </Text>
            )}
          </View>
        )}

        <Animated.View
          style={[
            styles.cursor,
            { top: TOP, height: plotHeight, backgroundColor: theme.textSecondary },
            cursorStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.cursorDot,
            { backgroundColor: color, borderColor: theme.surface },
            cursorDotStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  yLabel: {
    position: 'absolute',
    pointerEvents: 'none',
    left: 0,
    width: LEFT - 8,
    alignItems: 'flex-end',
  },
  xLabels: {
    position: 'absolute',
    pointerEvents: 'none',
    bottom: 0,
    height: BOTTOM - 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cursor: {
    position: 'absolute',
    pointerEvents: 'none',
    left: 0,
    width: 1,
  },
  cursorDot: {
    position: 'absolute',
    pointerEvents: 'none',
    left: 0,
    top: 0,
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
  },
});
