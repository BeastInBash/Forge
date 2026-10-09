import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useClay, useTheme } from '@/hooks/use-theme';

import type { Lift } from '../api';
import { formatSet } from '../metrics';

const dateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

type Props = {
  lift: Lift;
  /** Change in the charted metric since the session before, already formatted with its sign. */
  delta?: { text: string; direction: 'up' | 'down' | 'flat' };
  isRecord: boolean;
  onDelete: () => Promise<void>;
};

/** One logged session: its date, every set, and how it compares to the one before. */
export function SessionRow({ lift, delta, isRecord, onDelete }: Props) {
  const theme = useTheme();
  const clay = useClay();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deltaColor =
    delta?.direction === 'up'
      ? theme.up
      : delta?.direction === 'down'
        ? theme.danger
        : theme.textSecondary;

  async function remove() {
    if (!confirm) {
      setConfirm(true);
      return;
    }
    setDeleting(true);
    try {
      await onDelete();
    } catch {
      setDeleting(false);
      setConfirm(false);
    }
  }

  return (
    <Animated.View
      layout={LinearTransition.duration(200)}
      style={[styles.card, { backgroundColor: theme.surface }, clay.raised]}>
      <Pressable
        onPress={() => {
          setOpen((o) => !o);
          setConfirm(false);
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.dateRow}>
            <Text variant="bodyStrong">{dateFormat.format(new Date(lift.performedAt))}</Text>
            {isRecord && (
              <View style={[styles.record, { backgroundColor: theme.accent }, clay.accent]}>
                <Icon ios="trophy.fill" material="emoji_events" size={12} color={theme.onAccent} />
                <Text variant="caption" style={[styles.recordText, { color: theme.onAccent }]}>
                  PR
                </Text>
              </View>
            )}
          </View>
          <Text variant="caption" color="textSecondary">
            {lift.sets.length} {lift.sets.length === 1 ? 'set' : 'sets'}
          </Text>
        </View>
        {delta && (
          <Text variant="label" style={{ color: deltaColor }}>
            {delta.text}
          </Text>
        )}
        <Icon
          ios={open ? 'chevron.up' : 'chevron.down'}
          material={open ? 'expand_less' : 'expand_more'}
          size={18}
          color={theme.textSecondary}
        />
      </Pressable>

      <View style={styles.sets}>
        {lift.sets.map((set, i) => (
          <View key={set.id} style={[styles.set, { backgroundColor: theme.background }, clay.sunken]}>
            <Text variant="caption" color="textSecondary">
              {i + 1}
            </Text>
            <Text variant="label">{formatSet(set)}</Text>
          </View>
        ))}
      </View>

      {open && (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          style={styles.more}>
          {lift.note ? (
            <Text variant="label" color="textSecondary">
              {lift.note}
            </Text>
          ) : null}
          <Pressable
            onPress={remove}
            disabled={deleting}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.delete,
              { backgroundColor: theme.surface, borderColor: confirm ? theme.danger : 'transparent' },
              pressed ? clay.sunken : clay.soft,
            ]}>
            {deleting ? (
              <ActivityIndicator color={theme.danger} />
            ) : (
              <>
                <Icon ios="trash" material="delete" size={16} color={theme.danger} />
                <Text variant="label" color="danger">
                  {confirm ? 'Tap again to delete' : 'Delete session'}
                </Text>
              </>
            )}
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.three,
    gap: Spacing.two + Spacing.one,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  record: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingHorizontal: Spacing.two - 2,
    paddingVertical: 1,
    borderRadius: Radius.pill,
  },
  recordText: {
    fontFamily: FontFamily.bodySemiBold,
  },
  sets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  set: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.one + Spacing.half,
    borderRadius: Radius.small,
  },
  more: {
    gap: Spacing.two,
  },
  delete: {
    minHeight: 44,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
