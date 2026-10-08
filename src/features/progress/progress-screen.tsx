import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { startOfWeek } from '@/lib/week';

import { LiftSummaryCard } from './components/lift-summary-card';
import { useLiftSummaries } from './use-lifts';

/** Every exercise the user has logged, most recently trained first, with its trend. */
export function ProgressScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { summaries, error, loading, refreshing, refresh } = useLiftSummaries();
  const [weekStart] = useState(() => startOfWeek(new Date()).getTime());

  const trainedThisWeek =
    summaries?.filter((s) => new Date(s.last.performedAt).getTime() >= weekStart).length ?? 0;
  const totalSessions = summaries?.reduce((sum, s) => sum + s.sessions, 0) ?? 0;

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
      <View style={[styles.hero, { backgroundColor: theme.iron }]}>
        <Text variant="label" style={{ color: theme.ironTextSecondary }}>
          Track every set
        </Text>
        <Text variant="hero" style={{ color: theme.ironText }}>
          Your lifts
        </Text>
        <View style={styles.heroStats}>
          <HeroStat value={summaries?.length ?? 0} unit="exercises" />
          <HeroStat value={totalSessions} unit="logged" />
          <HeroStat value={trainedThisWeek} unit="this week" />
        </View>
        <Pressable
          onPress={() => router.push('/log-lift')}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.primary,
            { backgroundColor: theme.accent },
            pressed && styles.pressed,
          ]}>
          <Icon ios="plus" material="add" size={18} color={theme.onAccent} />
          <Text variant="bodyStrong" style={{ color: theme.onAccent }}>
            Log a lift
          </Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text variant="label" color="textSecondary" style={styles.sectionTitle}>
          TRACKED LIFTS
        </Text>
        {loading ? (
          <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
        ) : error ? (
          <View style={[styles.message, { backgroundColor: theme.surface }]}>
            <Text variant="bodyStrong">Couldn’t load your lifts</Text>
            <Text variant="label" color="textSecondary">
              {error}
            </Text>
            <Pressable
              onPress={refresh}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.retry,
                { borderColor: theme.line },
                pressed && { backgroundColor: theme.line },
              ]}>
              <Text variant="label">Try again</Text>
            </Pressable>
          </View>
        ) : summaries?.length ? (
          summaries.map((summary, index) => (
            <Animated.View
              key={summary.exercise.id}
              entering={index < 8 ? FadeInDown.delay(index * 50).duration(300) : undefined}>
              <LiftSummaryCard
                summary={summary}
                index={index}
                onPress={() =>
                  router.push({
                    pathname: '/lift/[exerciseId]',
                    params: { exerciseId: summary.exercise.id },
                  })
                }
              />
            </Animated.View>
          ))
        ) : (
          <View style={[styles.message, { backgroundColor: theme.surface }]}>
            <Icon
              ios="chart.line.uptrend.xyaxis"
              material="show_chart"
              size={28}
              color={theme.textSecondary}
            />
            <Text variant="bodyStrong">No lifts yet</Text>
            <Text variant="label" color="textSecondary">
              Log the weight and reps of each set after you train. Forge charts every exercise so
              you can see it climb.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function HeroStat({ value, unit }: { value: number; unit: string }) {
  const theme = useTheme();
  return (
    <View style={styles.heroStat}>
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
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  hero: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  heroStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: Spacing.four,
    rowGap: Spacing.one,
    marginTop: Spacing.one,
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
  },
  primary: {
    marginTop: Spacing.three,
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
  },
  sectionTitle: {
    paddingHorizontal: Spacing.one,
    letterSpacing: 1.2,
    fontSize: 12,
  },
  loading: {
    paddingVertical: Spacing.five,
  },
  message: {
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
    borderWidth: 1,
    justifyContent: 'center',
  },
});
