import { Link, Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { EASE_OUT } from '@/constants/motion';
import { FontFamily, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useIsAdmin } from '@/features/auth/use-is-admin';
import { useSurface, useTheme } from '@/hooks/use-theme';

import { ExerciseThumb } from './components/exercise-thumb';
import { MuscleTags } from './components/muscle-tags';
import { targetsOf } from './muscles';
import { searchExercises } from './search';
import { useExercises } from './use-exercises';

const THUMB_SIZE = 56;

/**
 * The whole exercise catalog with images, searchable by name; for admins, the header button opens
 * the add form, and a search with no match offers to add that name.
 */
export function ExerciseLibraryScreen() {
  const theme = useTheme();
  const surface = useSurface();
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const { exercises, error, loading, refreshing, refresh } = useExercises();
  const [query, setQuery] = useState('');
  const searching = query.trim().length > 0;
  const shown = exercises && searching ? searchExercises(exercises, query) : (exercises ?? []);

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
        data={shown}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.textSecondary} />}
        ListHeaderComponent={
          exercises && exercises.length > 0 ? (
            <View style={styles.header}>
              <View style={[styles.search, { backgroundColor: theme.surface }, surface.soft]}>
                <Icon ios="magnifyingglass" material="search" size={18} color={theme.textSecondary} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search by name or muscle"
                  placeholderTextColor={theme.textSecondary}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                  clearButtonMode="never"
                  accessibilityLabel="Search exercises"
                  style={[styles.searchInput, { color: theme.text }]}
                />
                {searching && (
                  <Animated.View entering={FadeIn.duration(150).easing(EASE_OUT)}>
                    <Pressable
                      onPress={() => setQuery('')}
                      accessibilityRole="button"
                      accessibilityLabel="Clear search"
                      hitSlop={10}
                      style={({ pressed }) => pressed && styles.pressed}>
                      <Icon ios="xmark.circle.fill" material="cancel" size={18} color={theme.textSecondary} />
                    </Pressable>
                  </Animated.View>
                )}
              </View>
              <Text variant="label" color="textSecondary" style={styles.count}>
                {searching
                  ? `${shown.length} of ${exercises.length} exercises`
                  : `${exercises.length} ${exercises.length === 1 ? 'exercise' : 'exercises'}`}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          searching && exercises ? (
            <EmptyState
              title={`No exercise matches “${query.trim()}”`}
              detail={isAdmin ? 'It isn’t in the library yet.' : 'Try another name.'}
              actionLabel={isAdmin ? `Add “${query.trim()}”` : undefined}
              onAction={
                isAdmin
                  ? () => router.push({ pathname: '/add-exercise', params: { name: query.trim() } })
                  : undefined
              }
            />
          ) : loading ? (
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
        renderItem={({ item }) => {
          const row = (
            <>
              <ExerciseThumb url={item.exercise_icon} size={THUMB_SIZE} />
              <View style={styles.info}>
                <Text variant="bodyStrong" numberOfLines={2}>
                  {item.exercise_name}
                </Text>
                <MuscleTags targets={targetsOf(item)} max={4} />
              </View>
            </>
          );
          // Admins tap a row to edit its name and muscles; everyone else just reads it.
          return isAdmin ? (
            <Pressable
              onPress={() => router.push({ pathname: '/edit-exercise', params: { id: item.id } })}
              accessibilityRole="button"
              accessibilityHint="Edits the exercise"
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: theme.surface },
                pressed ? surface.sunken : surface.raised,
              ]}>
              {row}
              <Icon ios="chevron.right" material="chevron_right" size={16} color={theme.textSecondary} />
            </Pressable>
          ) : (
            <View style={[styles.row, { backgroundColor: theme.surface }, surface.raised]}>{row}</View>
          );
        }}
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
  const surface = useSurface();
  return (
    <View style={[styles.empty, { backgroundColor: theme.surface }, surface.raised]}>
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
            pressed ? surface.sunken : surface.soft,
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
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  headerButton: {
    padding: Spacing.one,
  },
  header: {
    gap: Spacing.three,
    paddingBottom: Spacing.two,
  },
  search: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    paddingVertical: 0,
    fontFamily: FontFamily.body,
    // 16 keeps iOS Safari from zooming in on focus
    fontSize: 16,
  },
  pressed: {
    opacity: 0.5,
  },
  count: {
    paddingHorizontal: Spacing.one,
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
  info: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.one + Spacing.half,
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
