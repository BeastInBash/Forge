import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { ExerciseThumb } from '@/features/exercises/components/exercise-thumb';
import { useTheme } from '@/hooks/use-theme';

import { Stepper } from './stepper';

export type DraftExercise = {
  exerciseId: string;
  name: string;
  icon: string | null;
  sets: number;
  repetition: number;
  /** Barbell or dumbbell load in kg; null when not set. */
  weight: number | null;
};

type Props = {
  item: DraftExercise;
  index: number;
  count: number;
  onChange: (item: DraftExercise) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
};

export function formatWeight(weight: number | null) {
  return weight === null ? '' : String(weight);
}

/** "62.5" → 62.5, "" → null (not set), anything unparseable → undefined (ignored). */
export function parseWeight(text: string): number | null | undefined {
  const clean = text.replace(',', '.').trim();
  if (!clean) return null;
  const value = Number(clean);
  if (!Number.isFinite(value) || value < 0 || value > 1000) return undefined;
  return Math.round(value * 100) / 100;
}

/** One exercise in the plan being edited: order controls, sets, reps and working weight. */
export function PlanExerciseCard({ item, index, count, onChange, onMove, onRemove }: Props) {
  const theme = useTheme();
  // The text is kept separately so "62." can be typed on the way to "62.5".
  const [weightText, setWeightText] = useState(formatWeight(item.weight));

  const iconButton = (
    ios: 'chevron.up' | 'chevron.down' | 'xmark',
    material: 'expand_less' | 'expand_more' | 'close',
    label: string,
    onPress: () => void,
    disabled = false
  ) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.iconButton,
        pressed && { backgroundColor: theme.line },
        disabled && styles.disabled,
      ]}>
      <Icon ios={ios} material={material} size={18} color={theme.textSecondary} />
    </Pressable>
  );

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <Text variant="label" color="textSecondary" style={styles.order}>
          {index + 1}
        </Text>
        <ExerciseThumb url={item.icon} size={44} />
        <Text variant="bodyStrong" numberOfLines={2} style={styles.name}>
          {item.name}
        </Text>
        {iconButton(
          'chevron.up',
          'expand_less',
          `Move ${item.name} up`,
          () => onMove(-1),
          index === 0
        )}
        {iconButton(
          'chevron.down',
          'expand_more',
          `Move ${item.name} down`,
          () => onMove(1),
          index === count - 1
        )}
        {iconButton('xmark', 'close', `Remove ${item.name}`, onRemove)}
      </View>

      <View style={[styles.controls, { borderTopColor: theme.line }]}>
        <Stepper
          label="Sets"
          value={item.sets}
          min={1}
          max={20}
          onChange={(sets) => onChange({ ...item, sets })}
        />
        <Stepper
          label="Reps"
          value={item.repetition}
          min={1}
          max={100}
          onChange={(repetition) => onChange({ ...item, repetition })}
        />
        <View style={styles.weight}>
          <Text variant="caption" color="textSecondary">
            Weight
          </Text>
          <View style={[styles.weightBox, { backgroundColor: theme.background }]}>
            <TextInput
              value={weightText}
              onChangeText={(text) => {
                setWeightText(text);
                const weight = parseWeight(text);
                if (weight !== undefined) onChange({ ...item, weight });
              }}
              onBlur={() => setWeightText(formatWeight(item.weight))}
              placeholder="–"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              inputMode="decimal"
              maxLength={6}
              selectTextOnFocus
              accessibilityLabel={`${item.name} weight in kilograms`}
              style={[styles.weightInput, { color: theme.text }]}
            />
            <Text variant="caption" color="textSecondary">
              kg
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  order: {
    width: 14,
    textAlign: 'center',
  },
  name: {
    flex: 1,
    minWidth: 0,
    marginLeft: Spacing.one,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.3,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.three,
    columnGap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
  },
  weight: {
    gap: Spacing.one,
  },
  weightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.small,
    gap: Spacing.one,
  },
  // Same face and size as the sets/reps values. Android insets TextInput text with font padding
  // and doesn't centre it vertically, so both are set explicitly against a fixed height.
  weightInput: {
    width: 56,
    minWidth: 0,
    height: '100%',
    paddingVertical: 0,
    paddingHorizontal: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
    fontFamily: FontFamily.displayBold,
    fontSize: 22,
    textAlign: 'right',
  },
});
