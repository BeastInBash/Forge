import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { CSS_EASE_OUT } from '@/constants/motion';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * One segment per step, filled up to the current one. Each fill is absolutely positioned and
 * childless, so animating its width re-lays-out nothing and keeps the ends crisp.
 */
export function StepProgress({ step, total }: { step: number; total: number }) {
  const theme = useTheme();
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel="Onboarding progress"
      accessibilityValue={{
        min: 1,
        max: total,
        now: step + 1,
        text: `Step ${step + 1} of ${total}`,
      }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.track, { backgroundColor: theme.line }]}>
          <Animated.View
            style={[
              styles.fill,
              {
                backgroundColor: theme.accent,
                width: i <= step ? '100%' : '0%',
                transitionProperty: 'width',
                transitionDuration: 300,
                transitionTimingFunction: CSS_EASE_OUT,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.one + Spacing.half,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
});
