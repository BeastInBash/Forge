import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Radius, Spacing, Temper } from '@/constants/theme';
import { useClay, useTheme } from '@/hooks/use-theme';
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
 * Cast-iron summary of the week: a band with one segment per day in its split's tempering
 * colour (rest days hollow, today marked), then sessions, sets and estimated time.
 */
export function WeekOverview({ days, today, rangeLabel }: Props) {
  const theme = useTheme();
  const clay = useClay();
  const plans = days.flatMap((d) => (d.plan ? [d.plan] : []));
  const sets = plans.reduce((sum, plan) => sum + plan.exercises.reduce((s, e) => s + e.sets, 0), 0);

  return (
    <View style={[styles.card, { backgroundColor: theme.iron }, clay.iron]}>
      <View style={styles.header}>
        <Text variant="label" style={{ color: theme.ironTextSecondary }}>
          This week · {rangeLabel}
        </Text>
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
                plan
                  ? [{ backgroundColor: Temper[plan.split] }, styles.filled]
                  : clay.ironSunken,
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
          value={`${7 - plans.length}`}
          unit={7 - plans.length === 1 ? 'rest day' : 'rest days'}
        />
        <Stat value={`${sets}`} unit={sets === 1 ? 'working set' : 'working sets'} />
        <Stat value={formatDuration(sets * MINUTES_PER_SET)} unit="est. time" />
      </View>
    </View>
  );
}

function Stat({ value, unit }: { value: string; unit: string }) {
  const theme = useTheme();
  return (
    <View style={styles.stat}>
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
    gap: Spacing.one,
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
    height: 12,
    borderRadius: Radius.pill,
  },
  /** Moulds a filled segment like a small clay bead. */
  filled: {
    boxShadow:
      'inset 1px 2px 2px rgba(255, 255, 255, 0.45), inset -1px -2px 3px rgba(0, 0, 0, 0.3)',
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
    gap: Spacing.half,
  },
});
