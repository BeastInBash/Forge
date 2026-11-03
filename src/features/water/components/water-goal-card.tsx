import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useSurface, useTheme } from '@/hooks/use-theme';

import type { WaterDay, WaterGoal } from '../api';
import { formatLitres, formatWater } from '../format';
import { drinkWater } from '../water-store';
import { WaterProgress } from './water-progress';

const GLASS_ML = 250;

/**
 * Today's water against the goal, with a one-tap glass. Opens the water screen; invites setting
 * a goal when there isn't one.
 */
export function WaterGoalCard({
  goal,
  day,
  onPress,
}: {
  /** Undefined while loading. */
  goal: WaterGoal | null | undefined;
  /** Today's drinks; undefined while loading. */
  day: WaterDay | undefined;
  onPress: () => void;
}) {
  const theme = useTheme();
  const surface = useSurface();
  const [adding, setAdding] = useState(false);
  const [failed, setFailed] = useState(false);
  const consumedMl = day?.consumedMl ?? 0;
  const goalMl = goal?.dailyGoalMl;

  async function addGlass() {
    setAdding(true);
    setFailed(false);
    try {
      await drinkWater(GLASS_ML);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFailed(true);
    } finally {
      setAdding(false);
    }
  }

  const status = failed
    ? 'Couldn’t log that glass. Try again.'
    : !goalMl
      ? 'Tap to set how much to drink a day'
      : consumedMl >= goalMl
        ? 'Goal reached'
        : `${formatWater(goalMl - consumedMl)} to go`;

  return (
    <Pressable
      onPress={onPress}
      disabled={goal === undefined}
      accessibilityRole="button"
      accessibilityHint={goal ? 'Opens today’s water' : 'Opens the daily water goal'}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: pressed ? theme.background : theme.surface },
        pressed ? surface.sunken : surface.raised,
      ]}>
      <View style={styles.header}>
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
            <Text variant="bodyStrong">
              {formatWater(consumedMl)}{' '}
              <Text variant="label" color="textSecondary">
                of {formatLitres(goal.dailyGoalMl)}
              </Text>
            </Text>
          ) : (
            <Text variant="bodyStrong">{goal === null ? 'Set a daily goal' : ' '}</Text>
          )}
        </View>
        {goal ? (
          <Pressable
            onPress={addGlass}
            disabled={adding}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Log a glass, ${GLASS_ML} millilitres`}
            style={({ pressed }) => [
              styles.add,
              { backgroundColor: theme.surface },
              pressed ? surface.sunken : surface.soft,
            ]}>
            {adding ? (
              <ActivityIndicator size="small" color={theme.textSecondary} />
            ) : (
              <>
                <Icon ios="plus" material="add" size={14} color={theme.water} />
                <Text variant="label">{GLASS_ML} ml</Text>
              </>
            )}
          </Pressable>
        ) : (
          <Icon ios="chevron.right" material="chevron_right" size={16} color={theme.textSecondary} />
        )}
      </View>
      {goalMl ? <WaterProgress consumedMl={consumedMl} goalMl={goalMl} height={6} /> : null}
      {goal !== undefined && (
        <Text
          variant="caption"
          style={{
            color: failed
              ? theme.danger
              : goalMl && consumedMl >= goalMl
                ? theme.up
                : theme.textSecondary,
          }}>
          {status}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  body: {
    flex: 1,
    gap: Spacing.half,
  },
  caps: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 36,
    minWidth: 80,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
});
