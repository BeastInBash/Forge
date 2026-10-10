import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { Text } from '@/components/ui/text';
import { Radius, Spacing, Temper } from '@/constants/theme';
import { useSurface, useTheme } from '@/hooks/use-theme';
import { plural } from '@/lib/plural';
import type { Weekday, WorkoutPlan } from '@/types/training';

/** Same estimate as the session card: about three minutes per working set, rest included. */
const MINUTES_PER_SET = 3;

type Props = {
  days: { day: Weekday; plan?: WorkoutPlan }[];
  today: Weekday;
  /** e.g. "Oct 5 – 11". */
  rangeLabel: string;
};

/** 225 → "3h 45m", 45 → "45m". */
function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

/**
 * Iron summary of the week: a band with one segment per day in its split's tempering
 * colour (rest days hollow, today marked), then sessions, sets and estimated time.
 */
export function WeekOverview({ days, today, rangeLabel }: Props) {
  const theme = useTheme();
  const surface = useSurface();
  const plans = days.flatMap((d) => (d.plan ? [d.plan] : []));
  const sets = plans.reduce((sum, plan) => sum + plan.exercises.reduce((s, e) => s + e.sets, 0), 0);

  return (
    <View style={[styles.card, { backgroundColor: theme.iron }, surface.iron]}>
      <View style={styles.header}>
        <View style={styles.eyebrow}>
          <IconBadge
            ios="calendar"
            material="calendar_month"
            color={theme.accent}
            background={theme.ironLine}
          />
          <Text variant="caption" style={[styles.eyebrowText, { color: theme.ironTextSecondary }]}>
            This week · {rangeLabel}
          </Text>
        </View>
        <Text variant="hero" style={{ color: theme.ironText }}>
          {plans.length ? plural(plans.length, 'session') : 'No sessions yet'}
        </Text>
      </View>

      <View
        style={styles.band}
        accessible
        accessibilityLabel={`${plural(plans.length, 'training day')}, ${plural(7 - plans.length, 'rest day')}`}>
        {days.map(({ day, plan }) => (
          <View key={day} style={styles.segmentColumn}>
            <View
              style={[
                styles.segment,
                plan ? { backgroundColor: Temper[plan.split] } : surface.ironSunken,
              ]}
            />
            <Text
              variant="caption"
              style={{
                color: day === today ? theme.ironText : theme.ironTextSecondary,
                fontWeight: day === today ? '700' : '400',
              }}>
              {day.charAt(0)}
            </Text>
            {day === today && <View style={[styles.todayDot, { backgroundColor: theme.accent }]} />}
          </View>
        ))}
      </View>

      <View style={[styles.stats, { borderTopColor: theme.ironLine }]}>
        <Stat
          icon={{ ios: 'bed.double', material: 'bedtime' }}
          value={`${7 - plans.length}`}
          unit={7 - plans.length === 1 ? 'rest day' : 'rest days'}
        />
        <Stat
          icon={{ ios: 'square.stack.3d.up', material: 'layers' }}
          value={`${sets}`}
          unit={sets === 1 ? 'working set' : 'working sets'}
        />
        <Stat
          icon={{ ios: 'clock', material: 'schedule' }}
          value={formatDuration(sets * MINUTES_PER_SET)}
          unit="est. time"
        />
      </View>
    </View>
  );
}

function Stat({
  icon,
  value,
  unit,
}: {
  icon: Pick<ComponentProps<typeof Icon>, 'ios' | 'material'>;
  value: string;
  unit: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.stat}>
      <Icon {...icon} size={16} color={theme.ironTextSecondary} />
      <Text variant="title" style={{ color: theme.ironText }}>
        {value}
      </Text>
      <Text variant="caption" style={{ color: theme.ironTextSecondary }}>
        {unit}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.two,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + Spacing.half,
  },
  eyebrowText: {
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  band: {
    flexDirection: 'row',
    gap: Spacing.one + Spacing.half,
  },
  segmentColumn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
  },
  segment: {
    alignSelf: 'stretch',
    height: 10,
    borderRadius: 2,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: -Spacing.half,
  },
  stats: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
  },
  stat: {
    flex: 1,
    gap: Spacing.one,
  },
});
