import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useSurface, useTheme } from '@/hooks/use-theme';

import type { WaterGoal } from '../api';
import { formatLitres, reminderSummary } from '../format';

/** The daily water goal as a row that opens the goal ruler; invites setting one when unset. */
export function WaterGoalCard({
  goal,
  onPress,
}: {
  /** Undefined while loading. */
  goal: WaterGoal | null | undefined;
  onPress: () => void;
}) {
  const theme = useTheme();
  const surface = useSurface();
  return (
    <Pressable
      onPress={onPress}
      disabled={goal === undefined}
      accessibilityRole="button"
      accessibilityHint="Opens the daily water goal"
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: pressed ? theme.background : theme.surface },
        pressed ? surface.sunken : surface.raised,
      ]}>
      <IconBadge
        ios="drop.fill"
        material="water_drop"
        color={theme.water}
        background={theme.waterSoft}
      />
      <View style={styles.body}>
        <Text variant="caption" color="textSecondary" style={styles.caps}>
          Daily water
        </Text>
        {goal ? (
          <>
            <Text variant="bodyStrong">{formatLitres(goal.dailyGoalMl)} a day</Text>
            <Text variant="caption" color="textSecondary">
              {goal.remindersEnabled ? reminderSummary(goal) : 'Reminders off'}
            </Text>
          </>
        ) : (
          <Text variant="bodyStrong">{goal === null ? 'Set a daily goal' : ' '}</Text>
        )}
      </View>
      <Icon ios="chevron.right" material="chevron_right" size={16} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
  },
  body: {
    flex: 1,
    gap: Spacing.half,
  },
  caps: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
