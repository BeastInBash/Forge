import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { FontFamily, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { deleteLift, type Lift } from './api';
import { AnimatedNumber } from './components/animated-number';
import { LiftChart } from './components/lift-chart';
import { Segmented } from '@/components/ui/segmented';
import { SessionRow } from './components/session-row';
import { removeLiftLocally } from './lifts-store';
import {
  bestSet,
  BODYWEIGHT_METRICS,
  formatMetric,
  formatSet,
  describeSets,
  isBodyweight,
  liftMetric,
  METRICS,
  WEIGHTED_METRICS,
  type Metric,
} from './metrics';
import { useLiftHistory } from './use-lifts';

type Range = '1M' | '3M' | '6M' | '1Y' | 'All';

const RANGES: { value: Range; label: string }[] = [
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' },
  { value: 'All', label: 'All' },
];
const RANGE_MONTHS: Record<Exclude<Range, 'All'>, number> = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 };

const longDate = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const shortDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

function inRange(lifts: Lift[], range: Range, now: Date) {
  if (range === 'All') return lifts;
  const since = new Date(now);
  since.setMonth(since.getMonth() - RANGE_MONTHS[range]);
  return lifts.filter((lift) => new Date(lift.performedAt) >= since);
}

/** The narrowest range from three months up that has enough sessions to show a trend. */
function autoRange(lifts: Lift[], now: Date): Range {
  return (
    RANGES.slice(1).find(({ value }) => inRange(lifts, value, now).length >= 8)?.value ?? 'All'
  );
}

/** Sessions that beat every session before them on the headline metric. */
function recordIds(lifts: Lift[], metric: Metric) {
  const ids = new Set<string>();
  let best = -Infinity;
  lifts.forEach((lift, i) => {
    const value = liftMetric(lift, metric);
    if (i > 0 && value > best) ids.add(lift.id);
    best = Math.max(best, value);
  });
  return ids;
}

function signed(value: number, metric: Metric) {
  const text = formatMetric(Math.abs(value), metric);
  return value > 0 ? `+${text}` : value < 0 ? `−${text}` : `±${text}`;
}

/** One exercise's progress: a chart over time, headline numbers and every logged session. */
export function LiftDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const { history, summary, error, loading, refreshing, refresh } = useLiftHistory(exerciseId);
  const [now] = useState(() => new Date());
  const [chosenRange, setRange] = useState<Range>();
  const [chosenMetric, setMetric] = useState<Metric>();
  const [active, setActive] = useState<number | null>(null);

  const name = history?.exercise.name ?? summary?.exercise.name ?? 'Lift';
  const lifts = history?.lifts ?? [];
  const bodyweight = isBodyweight(lifts);
  const metrics = bodyweight ? BODYWEIGHT_METRICS : WEIGHTED_METRICS;
  const metric = chosenMetric && metrics.includes(chosenMetric) ? chosenMetric : metrics[0];
  const range = chosenRange ?? autoRange(lifts, now);
  const shown = inRange(lifts, range, now);
  const points = shown.map((lift) => ({
    t: new Date(lift.performedAt).getTime(),
    v: liftMetric(lift, metric),
  }));
  const headline = metrics[0];
  const records = recordIds(lifts, headline);
  const allTimeBest = Math.max(0, ...lifts.map((lift) => liftMetric(lift, headline)));

  const focus = active !== null ? shown[active] : shown[shown.length - 1];
  const focusValue = active !== null ? points[active]?.v : points[points.length - 1]?.v;
  const change = points.length > 1 ? points[points.length - 1].v - points[0].v : undefined;
  const changeColor =
    change === undefined || change === 0
      ? theme.textSecondary
      : change > 0
        ? theme.up
        : theme.danger;

  const logLift = () => router.push({ pathname: '/log-lift', params: { exerciseId } });

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={theme.textSecondary}
        />
      }>
      <Stack.Screen
        options={{
          title: name,
          headerRight: () => (
            <Pressable
              onPress={logLift}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Log ${name}`}>
              <Icon ios="plus" material="add" size={24} color={theme.text} />
            </Pressable>
          ),
        }}
      />

      {loading ? (
        <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
      ) : error ? (
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text variant="bodyStrong">Couldn’t load this lift</Text>
          <Text variant="label" color="textSecondary">
            {error}
          </Text>
          <Pressable onPress={refresh} accessibilityRole="button">
            <Text variant="label">Try again</Text>
          </Pressable>
        </View>
      ) : lifts.length === 0 ? (
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text variant="bodyStrong">Nothing logged yet</Text>
          <Text variant="label" color="textSecondary">
            Log your first session of {name} to start the chart.
          </Text>
        </View>
      ) : (
        <>
          <View style={[styles.card, styles.chartCard, { backgroundColor: theme.surface }]}>
            <View style={styles.readout} accessibilityLiveRegion="polite">
              <Text variant="label" color="textSecondary">
                {active !== null && focus
                  ? longDate.format(new Date(focus.performedAt))
                  : `${METRICS[metric].label} · latest`}
              </Text>
              <View style={styles.valueRow}>
                <AnimatedNumber
                  value={focusValue ?? 0}
                  decimals={METRICS[metric].decimals}
                  animate={active === null}
                  style={styles.value}
                />
                <Text variant="title" color="textSecondary">
                  {METRICS[metric].unit}
                </Text>
              </View>
              {active !== null && focus ? (
                <Text variant="label" color="textSecondary" numberOfLines={1}>
                  {describeSets(focus.sets)}
                </Text>
              ) : change !== undefined ? (
                <Text variant="label" style={{ color: changeColor }}>
                  {signed(change, metric)} since {shortDate.format(new Date(points[0].t))}
                </Text>
              ) : (
                <Text variant="label" color="textSecondary">
                  Log another session to see the trend
                </Text>
              )}
            </View>

            {points.length ? (
              <LiftChart
                points={points}
                seriesKey={`${exerciseId}-${range}-${lifts.length}`}
                color={change !== undefined && change < 0 ? theme.danger : theme.accent}
                formatTick={(v) =>
                  Math.abs(v) >= 10000
                    ? `${Math.round(v / 1000)}k`
                    : String(Math.round(v * 10) / 10)
                }
                onActiveChange={setActive}
              />
            ) : (
              <View style={styles.noData}>
                <Text variant="label" color="textSecondary">
                  No sessions in this range.
                </Text>
              </View>
            )}

            <Segmented
              options={RANGES}
              value={range}
              onChange={(next) => {
                setActive(null);
                setRange(next);
              }}
              accessibilityLabel="Time range"
            />
          </View>

          {metrics.length > 1 && (
            <Segmented
              options={metrics.map((m) => ({ value: m, label: METRICS[m].label }))}
              value={metric}
              onChange={setMetric}
              accessibilityLabel="Metric"
            />
          )}

          <View style={styles.tiles}>
            <Tile
              label={bodyweight ? 'Most reps' : 'Best est. 1RM'}
              value={formatMetric(allTimeBest, headline)}
            />
            <Tile
              label="Last top set"
              value={formatSet(bestSet(lifts[lifts.length - 1].sets) ?? { weight: null, reps: 0 })}
            />
            <Tile label="Sessions" value={String(lifts.length)} />
          </View>

          <Pressable
            onPress={logLift}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.primary,
              { backgroundColor: theme.accent },
              pressed && styles.pressed,
            ]}>
            <Icon ios="plus" material="add" size={18} color={theme.onAccent} />
            <Text variant="bodyStrong" style={{ color: theme.onAccent }}>
              Log {name}
            </Text>
          </Pressable>

          <View style={styles.section}>
            <Text variant="label" color="textSecondary" style={styles.sectionTitle}>
              HISTORY
            </Text>
            {lifts
              .map((lift, i) => ({ lift, previous: lifts[i - 1] }))
              .reverse()
              .map(({ lift, previous }) => {
                const diff = previous
                  ? liftMetric(lift, metric) - liftMetric(previous, metric)
                  : undefined;
                return (
                  <SessionRow
                    key={lift.id}
                    lift={lift}
                    isRecord={records.has(lift.id)}
                    delta={
                      diff === undefined
                        ? undefined
                        : {
                            text: signed(diff, metric),
                            direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat',
                          }
                    }
                    onDelete={async () => {
                      await deleteLift(lift.id);
                      setActive(null);
                      removeLiftLocally(lift);
                    }}
                  />
                );
              })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: theme.surface }]}>
      <Text variant="caption" color="textSecondary" numberOfLines={1}>
        {label}
      </Text>
      <Text variant="bodyStrong" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
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
  loading: {
    paddingVertical: Spacing.six,
  },
  card: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  chartCard: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  readout: {
    paddingHorizontal: Spacing.one,
    gap: Spacing.half,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  value: {
    fontFamily: FontFamily.display,
    fontSize: 48,
    lineHeight: 52,
    minWidth: 40,
  },
  noData: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tiles: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tile: {
    flex: 1,
    minWidth: 0,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    padding: Spacing.three,
    gap: Spacing.half,
  },
  primary: {
    height: 52,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  section: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.one,
    letterSpacing: 1.2,
    fontSize: 12,
  },
});
