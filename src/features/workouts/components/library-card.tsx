import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useIsAdmin } from '@/features/auth/use-is-admin';
import type { Exercise } from '@/features/exercises/api';
import { ExerciseThumb } from '@/features/exercises/components/exercise-thumb';
import { useClay, useTheme } from '@/hooks/use-theme';

const PREVIEW_COUNT = 5;
const THUMB_SIZE = 48;

/** Entry to the exercise library: count, a strip of image thumbnails, and (for admins) a quick add. */
export function LibraryCard({ exercises, error }: { exercises?: Exercise[]; error?: string }) {
  const theme = useTheme();
  const clay = useClay();
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const preview = exercises?.slice(0, PREVIEW_COUNT) ?? [];
  const more = (exercises?.length ?? 0) - preview.length;

  const detail = error
    ? 'Couldn’t load the library'
    : exercises
      ? `${exercises.length} ${exercises.length === 1 ? 'exercise' : 'exercises'} with images`
      : 'Loading…';

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }, clay.raised]}>
      <Pressable
        onPress={() => router.push('/exercises')}
        accessibilityRole="button"
        style={({ pressed }) => [styles.top, pressed && styles.pressed]}>
        <View style={styles.text}>
          <Text variant="title">Exercise library</Text>
          <Text variant="label" color="textSecondary">
            {detail}
          </Text>
        </View>
        <Icon ios="chevron.right" material="chevron_right" size={20} color={theme.textSecondary} />
      </Pressable>

      {preview.length > 0 && (
        <Pressable
          onPress={() => router.push('/exercises')}
          accessibilityRole="button"
          accessibilityLabel="Open exercise library"
          style={styles.thumbs}>
          {preview.map((exercise, i) => (
            <View
              key={exercise.id}
              style={[
                styles.thumbFrame,
                clay.soft,
                {
                  borderColor: theme.surface,
                  marginLeft: i === 0 ? 0 : -10,
                  zIndex: PREVIEW_COUNT - i,
                },
              ]}>
              <ExerciseThumb url={exercise.exercise_icon} size={THUMB_SIZE} />
            </View>
          ))}
          {more > 0 && (
            <View
              style={[
                styles.more,
                clay.sunken,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.surface,
                },
              ]}>
              <Text variant="label">+{more}</Text>
            </View>
          )}
        </Pressable>
      )}

      {isAdmin && (
        <Pressable
          onPress={() => router.push('/add-exercise')}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.add,
            { backgroundColor: theme.surface },
            pressed ? clay.sunken : clay.soft,
          ]}>
          <Icon ios="plus" material="add" size={18} color={theme.text} />
          <Text variant="bodyStrong">Add exercise</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.85,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  thumbs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbFrame: {
    borderWidth: 3,
    borderRadius: Radius.small + 7,
    borderCurve: 'continuous',
  },
  more: {
    width: THUMB_SIZE + 6,
    height: THUMB_SIZE + 6,
    marginLeft: -10,
    borderWidth: 3,
    borderRadius: Radius.small + 7,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    minHeight: 48,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
