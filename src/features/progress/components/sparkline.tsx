import { useEffect } from 'react';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Polyline } from 'react-native-svg';

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const INSET = 4;

type Props = {
  values: number[];
  color: string;
  width?: number;
  height?: number;
  /** Lets a list draw its sparklines one after another. */
  delay?: number;
};

/** A small trend line that draws itself in from the left. */
export function Sparkline({ values, color, width = 84, height = 36, delay = 0 }: Props) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((v, i) => ({
    x:
      INSET +
      (values.length > 1
        ? (i / (values.length - 1)) * (width - INSET * 2)
        : (width - INSET * 2) / 2),
    y: max === min ? height / 2 : INSET + (1 - (v - min) / range) * (height - INSET * 2),
  }));
  const length = points.reduce(
    (sum, p, i) => (i === 0 ? 0 : sum + Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y)),
    0
  );

  const progress = useSharedValue(0);
  const valuesKey = values.join(',');
  useEffect(() => {
    progress.set(0);
    progress.set(
      withDelay(
        delay,
        withTiming(1, { duration: 700, easing: EASE_OUT, reduceMotion: ReduceMotion.System })
      )
    );
  }, [valuesKey, delay, progress]);

  const lineProps = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - progress.get()) }));
  const dotProps = useAnimatedProps(() => ({
    r: progress.get() > 0.9 ? ((progress.get() - 0.9) / 0.1) * 3 : 0,
  }));
  const last = points[points.length - 1];

  return (
    <Svg width={width} height={height}>
      <AnimatedPolyline
        animatedProps={lineProps}
        points={points.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={[length + 1, length + 1]}
      />
      {last && <AnimatedCircle animatedProps={dotProps} cx={last.x} cy={last.y} fill={color} />}
    </Svg>
  );
}
