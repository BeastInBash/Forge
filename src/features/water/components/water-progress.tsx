import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { CSS_EASE_OUT } from '@/constants/motion';
import { useTheme } from '@/hooks/use-theme';

import { formatWater } from '../format';

/** A flat water-blue bar of how much of the goal has been drunk; green once reached. */
export function WaterProgress({
  consumedMl,
  goalMl,
  height = 8,
}: {
  consumedMl: number;
  goalMl: number;
  height?: number;
}) {
  const theme = useTheme();
  const share = goalMl > 0 ? Math.min(1, consumedMl / goalMl) : 0;
  return (
    <View
      accessible
      accessibilityLabel={`${formatWater(consumedMl)} of ${formatWater(goalMl)} drunk`}
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: theme.line }]}>
      {/* A childless fill in a clipped track, so easing its width re-lays out nothing else. */}
      <Animated.View
        style={[
          styles.fill,
          {
            width: `${share * 100}%`,
            backgroundColor: share >= 1 ? theme.up : theme.water,
            transitionProperty: 'width',
            transitionDuration: 400,
            transitionTimingFunction: CSS_EASE_OUT,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
