import { ActivityIndicator, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { PressScale } from '@/components/ui/press-scale';
import { Text } from '@/components/ui/text';
import { CSS_EASE_OUT } from '@/constants/motion';
import { Radius, Spacing } from '@/constants/theme';
import { useClay, useTheme } from '@/hooks/use-theme';

const FADE = {
  transitionProperty: 'opacity',
  transitionDuration: 150,
  transitionTimingFunction: CSS_EASE_OUT,
} as const;

/**
 * The straw primary action, same shape as "Start workout" on the session card. The label and
 * spinner are both always mounted and crossfade, so the button never changes size mid-submit.
 */
export function SubmitButton({
  label,
  loading,
  disabled = false,
  onPress,
}: {
  label: string;
  loading: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const clay = useClay();
  return (
    <PressScale
      onPress={onPress}
      disabled={loading || disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: loading, disabled: loading || disabled }}
      style={[
        styles.button,
        { backgroundColor: theme.accent },
        clay.accent,
        disabled && !loading && styles.disabled,
      ]}
      pressedStyle={clay.sunken}>
      <Animated.View style={[FADE, { opacity: loading ? 0 : 1 }]}>
        <Text variant="bodyStrong" style={{ color: theme.onAccent }}>
          {label}
        </Text>
      </Animated.View>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.center, FADE, { opacity: loading ? 1 : 0 }]}>
        {loading && <ActivityIndicator color={theme.onAccent} />}
      </Animated.View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: Spacing.one,
    minHeight: 54,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    pointerEvents: 'none',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
