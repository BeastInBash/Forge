import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { EASE_OUT, reflow } from '@/constants/motion';
import { Radius, Spacing } from '@/constants/theme';
import { useSurface, useTheme } from '@/hooks/use-theme';

import type { Exercise } from '../api';
import { findMatches, nameKey } from '../search';
import { ExerciseThumb } from './exercise-thumb';

/** How many matches to list; the count above says how many there are in all. */
const MAX_SHOWN = 5;

const fadeIn = FadeIn.duration(180).easing(EASE_OUT);
const fadeOut = FadeOut.duration(120);

/**
 * Live check of the name being typed against the exercise library, so an admin can see what is
 * already there before uploading. Shows nothing until a name is typed.
 */
export function LibraryMatches({ query, exercises }: { query: string; exercises?: Exercise[] }) {
  const theme = useTheme();
  const surface = useSurface();
  const key = nameKey(query);

  if (!key) return null;

  if (!exercises) {
    return (
      <Animated.View entering={fadeIn} exiting={fadeOut} style={styles.status}>
        <ActivityIndicator size="small" color={theme.textSecondary} />
        <Text variant="caption" color="textSecondary">
          Checking the library…
        </Text>
      </Animated.View>
    );
  }

  const matches = findMatches(exercises, query);

  if (matches.length === 0) {
    return (
      <Animated.View
        key="new"
        entering={fadeIn}
        exiting={fadeOut}
        style={[styles.status, styles.banner, { backgroundColor: theme.mint }]}>
        <Icon ios="checkmark.circle.fill" material="check_circle" size={16} color={theme.onMint} />
        <Text variant="label" style={{ color: theme.onMint }}>
          Not in the library yet
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      key="matches"
      entering={fadeIn}
      exiting={fadeOut}
      layout={reflow}
      style={[styles.card, { backgroundColor: theme.surface }, surface.raised]}>
      <View style={styles.header}>
        <Icon ios="magnifyingglass" material="search" size={14} color={theme.textSecondary} />
        <Text variant="caption" color="textSecondary" style={styles.headerText}>
          {matches.length === 1 ? '1 match in the library' : `${matches.length} matches in the library`}
        </Text>
      </View>
      {matches.slice(0, MAX_SHOWN).map((exercise) => {
        const exact = nameKey(exercise.exercise_name) === key;
        return (
          <Animated.View
            key={exercise.id}
            entering={fadeIn}
            exiting={fadeOut}
            layout={reflow}
            style={styles.row}>
            <ExerciseThumb url={exercise.exercise_icon} size={32} />
            <Text variant="label" numberOfLines={1} style={styles.name}>
              {exercise.exercise_name}
            </Text>
            {exact && (
              <View
                style={[
                  styles.chip,
                  { backgroundColor: `${theme.danger}1F`, borderColor: `${theme.danger}55` },
                ]}>
                <Text variant="caption" color="danger">
                  Already added
                </Text>
              </View>
            )}
          </Animated.View>
        );
      })}
      {matches.length > MAX_SHOWN && (
        <Text variant="caption" color="textSecondary">
          and {matches.length - MAX_SHOWN} more. Keep typing to narrow it down.
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  banner: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.half,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
  },
  card: {
    padding: Spacing.three,
    gap: Spacing.two + Spacing.half,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
  },
  headerText: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  name: {
    flex: 1,
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});
