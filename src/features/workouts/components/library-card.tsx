import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useIsAdmin } from '@/features/auth/use-is-admin';
import type { Exercise } from '@/features/exercises/api';
import { ExerciseThumb } from '@/features/exercises/components/exercise-thumb';
import { useSurface, useTheme } from '@/hooks/use-theme';

const PREVIEW_COUNT = 5;
const THUMB_SIZE = 48;

/** Entry to the exercise library: count, a strip of image thumbnails, and (for admins) a quick add. */
export function LibraryCard({ exercises, error }: { exercises?: Exercise[]; error?: string }) {
  const theme = useTheme();
  const surface = useSurface();
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
    <View style={[styles.card, { backgroundColor: theme.surface }, surface.raised]}>
      <Pressable
        onPress={() => router.push('/exercises')}
        accessibilityRole="button"
        style={({ pressed }) => [styles.top, pressed && styles.pressed]}>
        <IconBadge
          ios="books.vertical"
          material="menu_book"
          size={40}
          color={theme.text}
          background={theme.background}
          border={theme.line}
        />
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
                surface.soft,
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
                surface.sunken,
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
            pressed ? surface.sunken : surface.soft,
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
    borderWidth: 2,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  more: {
    width: THUMB_SIZE + 4,
    height: THUMB_SIZE + 4,
    marginLeft: -10,
    borderWidth: 2,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    minHeight: 48,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
