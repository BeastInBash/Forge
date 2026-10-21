import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { PressScale } from '@/components/ui/press-scale';
import { Text } from '@/components/ui/text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import type { Exercise } from '@/features/exercises/api';
import { ExerciseThumb } from '@/features/exercises/components/exercise-thumb';
import { MuscleTags } from '@/features/exercises/components/muscle-tags';
import { targetsOf } from '@/features/exercises/muscles';
import { searchExercises } from '@/features/exercises/search';
import { useExercises } from '@/features/exercises/use-exercises';
import { useSurface, useTheme } from '@/hooks/use-theme';

type Props = {
  visible: boolean;
  /** Exercise ids already in the plan; shown checked. */
  selectedIds: Set<string>;
  onToggle: (exercise: Exercise) => void;
  onClose: () => void;
};

/**
 * Sheet listing the exercise catalog with search. Tapping an exercise adds it to the plan, or
 * removes it if it's already there; the sheet stays open so several can be picked in a row.
 */
export function ExercisePicker({ visible, selectedIds, onToggle, onClose }: Props) {
  const theme = useTheme();
  const surface = useSurface();
  const insets = useSafeAreaInsets();
  const { exercises, error, loading, refresh } = useExercises();
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const filtered = searchExercises(exercises ?? [], needle);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View
        style={[styles.sheet, { backgroundColor: theme.background, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text variant="title" style={styles.title}>
            Add exercises
          </Text>
          <PressScale
            onPress={onClose}
            accessibilityRole="button"
            hitSlop={8}
            style={[styles.done, { backgroundColor: theme.accent }, surface.accent]}
            pressedStyle={{ opacity: 0.85 }}>
            <Text variant="bodyStrong" style={{ color: theme.onAccent }}>
              Done{selectedIds.size ? ` · ${selectedIds.size}` : ''}
            </Text>
          </PressScale>
        </View>

        <View style={[styles.search, { backgroundColor: theme.background }, surface.sunken]}>
          <Icon ios="magnifyingglass" material="search" size={18} color={theme.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or muscle"
            placeholderTextColor={theme.textSecondary}
            autoCorrect={false}
            clearButtonMode="while-editing"
            accessibilityLabel="Search exercises"
            style={[styles.searchInput, { color: theme.text }]}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={theme.textSecondary} style={styles.empty} />
            ) : (
              <View style={styles.empty}>
                <Text variant="label" color="textSecondary">
                  {error ??
                    (needle ? `No exercise matches “${query.trim()}”.` : 'The library is empty.')}
                </Text>
                {error && (
                  <Pressable onPress={refresh} accessibilityRole="button">
                    <Text variant="label">Try again</Text>
                  </Pressable>
                )}
              </View>
            )
          }
          renderItem={({ item }) => {
            const selected = selectedIds.has(item.id);
            return (
              <Pressable
                onPress={() => onToggle(item)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: theme.surface,
                    borderColor: selected ? theme.accent : 'transparent',
                  },
                  pressed ? surface.sunken : surface.raised,
                ]}>
                <ExerciseThumb url={item.exercise_icon} size={52} />
                <View style={styles.name}>
                  <Text variant="bodyStrong" numberOfLines={2}>
                    {item.exercise_name}
                  </Text>
                  <MuscleTags targets={targetsOf(item)} max={3} />
                </View>
                <View
                  style={[
                    styles.check,
                    selected
                      ? [{ backgroundColor: theme.accent }, surface.accent]
                      : [{ backgroundColor: theme.background }, surface.sunken],
                  ]}>
                  {selected && (
                    <Icon ios="checkmark" material="check" size={16} color={theme.onAccent} />
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  title: {
    flex: 1,
  },
  done: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginHorizontal: Spacing.three,
    paddingHorizontal: Spacing.three,
    height: 46,
    borderRadius: Radius.medium,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    fontFamily: FontFamily.body,
    fontSize: 16,
  },
  list: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    paddingRight: Spacing.three,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    borderWidth: 2,
  },
  name: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.one + Spacing.half,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    paddingVertical: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
  },
});
