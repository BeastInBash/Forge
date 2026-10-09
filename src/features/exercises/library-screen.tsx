import { Link, Stack } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useIsAdmin } from '@/features/auth/use-is-admin';
import { useClay, useTheme } from '@/hooks/use-theme';

import { ExerciseThumb } from './components/exercise-thumb';
import { useExercises } from './use-exercises';

const THUMB_SIZE = 56;

/** The whole exercise catalog with images; for admins, the header button opens the add form. */
export function ExerciseLibraryScreen() {
  const theme = useTheme();
  const clay = useClay();
  const isAdmin = useIsAdmin();
  const { exercises, error, loading, refreshing, refresh } = useExercises();

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: isAdmin
            ? () => (
                <Link href="/add-exercise" asChild>
                  <Pressable accessibilityRole="button" accessibilityLabel="Add exercise" hitSlop={8} style={styles.headerButton}>
                    <Icon ios="plus" material="add" size={24} color={theme.text} />
                  </Pressable>
                </Link>
              )
            : undefined,
        }}
      />
      <FlatList
        data={exercises ?? []}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.textSecondary} />}
        ListHeaderComponent={
          exercises && exercises.length > 0 ? (
            <Text variant="label" color="textSecondary" style={styles.count}>
              {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
          ) : error ? (
            <EmptyState title="Couldn’t load exercises" detail={error} actionLabel="Try again" onAction={refresh} />
          ) : (
            <EmptyState
              title="No exercises yet"
              detail={isAdmin ? 'Add the first one with its image.' : 'Check back soon.'}
            />
          )
        }
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.row,
              { backgroundColor: theme.surface },
              clay.soft,
            ]}>
            <ExerciseThumb url={item.exercise_icon} size={THUMB_SIZE} />
            <Text variant="bodyStrong" numberOfLines={2} style={styles.name}>
              {item.exercise_name}
            </Text>
          </View>
        )}
      />
    </>
  );
}

function EmptyState({
  title,
  detail,
  actionLabel,
  onAction,
}: {
  title: string;
  detail: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  const clay = useClay();
  return (
    <View style={[styles.empty, { backgroundColor: theme.surface }, clay.raised]}>
      <Text variant="bodyStrong">{title}</Text>
      <Text variant="label" color="textSecondary">
        {detail}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.retry,
            { backgroundColor: theme.surface },
            pressed ? clay.sunken : clay.soft,
          ]}>
          <Text variant="label">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  headerButton: {
    padding: Spacing.one,
  },
  count: {
    paddingHorizontal: Spacing.one,
    paddingBottom: Spacing.two,
  },
  loading: {
    paddingVertical: Spacing.five,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
  },
  name: {
    flex: 1,
    minWidth: 0,
  },
  empty: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  retry: {
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
    minHeight: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    justifyContent: 'center',
  },
});
