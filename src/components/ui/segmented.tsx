import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useClay, useTheme } from '@/hooks/use-theme';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

/** Pill segments with a thumb that slides to the selected one. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: Props<T>) {
  const theme = useTheme();
  const clay = useClay();
  const [layouts, setLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const selected = layouts[value];

  // The thumb is absolutely positioned and childless, so animating its width re-lays-out nothing.
  const thumbStyle = useAnimatedStyle(() => ({
    opacity: selected ? 1 : 0,
    width: withTiming(selected?.width ?? 0, { duration: 200, easing: EASE_OUT }),
    transform: [{ translateX: withTiming(selected?.x ?? 0, { duration: 200, easing: EASE_OUT }) }],
  }));

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, { backgroundColor: theme.background }, clay.sunken]}>
      <Animated.View style={[styles.thumb, { backgroundColor: theme.accent }, clay.accent, thumbStyle]} />
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            onLayout={(event) => {
              const { x, width } = event.nativeEvent.layout;
              setLayouts((current) => ({ ...current, [option.value]: { x, width } }));
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            hitSlop={{ top: 6, bottom: 6 }}
            style={styles.segment}>
            <Text
              variant="label"
              numberOfLines={1}
              style={{ color: active ? theme.onAccent : theme.textSecondary }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: Spacing.one,
    borderRadius: Radius.pill,
  },
  thumb: {
    position: 'absolute',
    top: Spacing.one,
    bottom: Spacing.one,
    left: 0,
    borderRadius: Radius.pill,
  },
  segment: {
    flex: 1,
    height: 34,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
