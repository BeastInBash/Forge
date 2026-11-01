import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { CSS_EASE_OUT } from '@/constants/motion';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { MUSCLE_GROUPS, type Muscle, type MuscleTargets } from '../muscles';

type Role = 'primary' | 'secondary' | undefined;

/** Tapping a muscle cycles it: off → primary → secondary → off. */
function next(targets: MuscleTargets, muscle: Muscle): MuscleTargets {
  const primary = targets.primary.filter((m) => m !== muscle);
  const secondary = targets.secondary.filter((m) => m !== muscle);
  if (targets.primary.includes(muscle)) return { primary, secondary: [...secondary, muscle] };
  if (targets.secondary.includes(muscle)) return { primary, secondary };
  return { primary: [...primary, muscle], secondary };
}

/**
 * Every muscle as a chip, grouped by body region, for choosing what an exercise targets. Primary
 * chips fill mint with a check, secondary ones take a grey fill.
 */
export function MusclePicker({
  value,
  onChange,
  disabled,
}: {
  value: MuscleTargets;
  onChange: (targets: MuscleTargets) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.picker}>
      <View style={styles.legend}>
        <Text variant="label">Target muscles</Text>
        <Text variant="caption" color="textSecondary">
          Tap once for a main muscle, twice for one that assists.
        </Text>
      </View>
      {Object.entries(MUSCLE_GROUPS).map(([group, muscles]) => (
        <View key={group} style={styles.group}>
          <Text variant="caption" color="textSecondary" style={styles.groupLabel}>
            {group.toUpperCase()}
          </Text>
          <View style={styles.chips}>
            {muscles.map((muscle) => {
              const role: Role = value.primary.includes(muscle)
                ? 'primary'
                : value.secondary.includes(muscle)
                  ? 'secondary'
                  : undefined;
              return (
                <MuscleChip
                  key={muscle}
                  muscle={muscle}
                  role={role}
                  disabled={disabled}
                  onPress={() => {
                    if (process.env.EXPO_OS !== 'web') Haptics.selectionAsync();
                    onChange(next(value, muscle));
                  }}
                />
              );
            })}
          </View>
        </View>
      ))}
      <View style={styles.key}>
        <Swatch color={theme.mint} label="Main" />
        <Swatch color={theme.line} label="Assists" />
      </View>
    </View>
  );
}

function MuscleChip({
  muscle,
  role,
  disabled,
  onPress,
}: {
  muscle: Muscle;
  role: Role;
  disabled?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const fill = role === 'primary' ? theme.mint : role === 'secondary' ? theme.line : theme.surface;
  const ink = role === 'primary' ? theme.onMint : theme.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={muscle}
      accessibilityValue={{ text: role === 'primary' ? 'main' : role === 'secondary' ? 'assists' : 'not targeted' }}
      hitSlop={4}>
      {({ pressed }) => (
        <Animated.View
          style={[
            styles.chip,
            {
              backgroundColor: fill,
              borderColor: role ? 'transparent' : theme.line,
              transform: [{ scale: pressed ? 0.96 : 1 }],
              transitionProperty: ['backgroundColor', 'borderColor', 'transform'],
              transitionDuration: 150,
              transitionTimingFunction: CSS_EASE_OUT,
            },
          ]}>
          {role === 'primary' && <Icon ios="checkmark" material="check" size={12} color={ink} />}
          <Text variant="caption" style={{ color: ink }}>
            {muscle}
          </Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.swatchRow}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  picker: {
    gap: Spacing.three,
  },
  legend: {
    gap: Spacing.half,
  },
  group: {
    gap: Spacing.two,
  },
  groupLabel: {
    letterSpacing: 0.8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 34,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  key: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
