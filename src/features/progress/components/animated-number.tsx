import { useEffect } from 'react';
import { Platform, StyleSheet, TextInput, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/hooks/use-theme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

type Props = {
  value: number;
  decimals: number;
  /** False jumps straight to the value — for scrubbing, where every frame is a new value. */
  animate: boolean;
  style?: TextStyle;
};

function format(value: number, decimals: number) {
  'worklet';
  const fixed = value.toFixed(decimals);
  // Drop a trailing ".0" so whole kilos read as whole numbers.
  return decimals > 0 && fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
}

/**
 * A number that counts to its new value on the UI thread. Native draws it in a read-only
 * TextInput so the text can change without a React render per frame; web shows it plainly.
 */
export function AnimatedNumber({ value, decimals, animate, style }: Props) {
  const theme = useTheme();
  const shown = useSharedValue(value);

  useEffect(() => {
    shown.set(
      animate
        ? withTiming(value, { duration: 600, easing: EASE_OUT, reduceMotion: ReduceMotion.System })
        : value
    );
  }, [value, animate, shown]);

  const animatedProps = useAnimatedProps(() => {
    const text = format(shown.get(), decimals);
    return { text, defaultValue: text } as object;
  });

  if (Platform.OS === 'web') {
    return <Text style={style}>{format(value, decimals)}</Text>;
  }

  return (
    <AnimatedTextInput
      editable={false}
      underlineColorAndroid="transparent"
      defaultValue={format(value, decimals)}
      animatedProps={animatedProps}
      importantForAccessibility="no"
      style={[styles.input, { color: theme.text }, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 0,
    margin: 0,
    includeFontPadding: false,
  },
});
