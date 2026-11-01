import { useRouter } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { PressScale } from '@/components/ui/press-scale';
import { IconBadge } from '@/components/ui/icon-badge';
import { SectionLabel } from '@/components/ui/section-label';
import { Text } from '@/components/ui/text';
import { enter } from '@/constants/motion';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useSurface, useTheme } from '@/hooks/use-theme';
import { startOfWeek } from '@/lib/week';

import { LiftSummaryCard } from './components/lift-summary-card';
import { useLiftSummaries } from './use-lifts';

/** Every exercise the user has logged, most recently trained first, with its trend. */
export function ProgressScreen() {
  const theme = useTheme();
  const surface = useSurface();
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
      <Animated.View
        entering={enter(0)}
        style={[styles.hero, { backgroundColor: theme.surface }, surface.raised]}>
        <View style={styles.eyebrow}>
          <IconBadge
            ios="chart.line.uptrend.xyaxis"
            material="show_chart"
            color={theme.text}
            background={theme.background}
            border={theme.line}
          />
          <Text variant="caption" style={[styles.caps, { color: theme.textSecondary }]}>
            Track every set
          </Text>
        </View>
        <Text variant="hero" style={{ color: theme.text }}>
          Your lifts
        </Text>
        <View style={styles.heroStats}>
          <HeroStat
            icon={{ ios: 'dumbbell', material: 'fitness_center' }}
            value={summaries?.length ?? 0}
            unit="exercises"
          />
          <HeroStat
            icon={{ ios: 'checkmark.circle', material: 'task_alt' }}
            value={totalSessions}
            unit="logged"
          />
          <HeroStat
            icon={{ ios: 'calendar', material: 'calendar_month' }}
            value={trainedThisWeek}
            unit="this week"
          />
        </View>
        <PressScale
          onPress={() => router.push('/log-lift')}
          accessibilityRole="button"
          style={[styles.primary, { backgroundColor: theme.accent }, surface.accent]}
          pressedStyle={styles.pressed}>
          <Icon ios="plus" material="add" size={18} color={theme.onAccent} />
          <Text variant="bodyStrong" style={{ color: theme.onAccent }}>
            Log a lift
          </Text>
        </PressScale>
      </Animated.View>

      <Animated.View entering={enter(1)} style={styles.section}>
        <SectionLabel icon={{ ios: 'dumbbell', material: 'fitness_center' }}>
          Tracked lifts
        </SectionLabel>
        {loading ? (
          <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
        ) : error ? (
          <View style={[styles.message, { backgroundColor: theme.surface }, surface.raised]}>
            <Text variant="bodyStrong">Couldn’t load your lifts</Text>
            <Text variant="label" color="textSecondary">
              {error}
            </Text>
            <Pressable
              onPress={refresh}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.retry,
                { backgroundColor: theme.surface },
                pressed ? surface.sunken : surface.soft,
              ]}>
              <Text variant="label">Try again</Text>
            </Pressable>
          </View>
        ) : summaries?.length ? (
          summaries.map((summary, index) => (
            <Animated.View
              key={summary.exercise.id}
              entering={index < 8 ? enter(index + 2) : undefined}>
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
          <View style={[styles.message, { backgroundColor: theme.surface }, surface.raised]}>
            <IconBadge
              ios="chart.line.uptrend.xyaxis"
              material="show_chart"
              size={44}
              color={theme.up}
              background={theme.mint}
            />
            <Text variant="bodyStrong">No lifts yet</Text>
            <Text variant="label" color="textSecondary">
              Log the weight and reps of each set after you train. Forge charts every exercise so
              you can see it climb.
            </Text>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

function HeroStat({
  icon,
  value,
  unit,
}: {
  icon: Pick<ComponentProps<typeof Icon>, 'ios' | 'material'>;
  value: number;
  unit: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.heroStat}>
      <View style={styles.heroStatIcon}>
        <Icon {...icon} size={15} color={theme.textSecondary} />
      </View>
      <Text variant="title" style={{ color: theme.text }}>
        {value}
      </Text>
      <Text variant="caption" style={{ color: theme.textSecondary }}>
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
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.five,
  },
  hero: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + Spacing.half,
    marginBottom: Spacing.one,
  },
  caps: {
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
  heroStatIcon: {
    alignSelf: 'center',
  },
  primary: {
    marginTop: Spacing.three,
    height: 52,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.85,
  },
  section: {
    gap: Spacing.three,
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
    justifyContent: 'center',
  },
});
