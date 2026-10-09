import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { CSS_EASE_OUT } from '@/constants/motion';
import { FontFamily, MaxContentWidth, Radius, Spacing, Temper } from '@/constants/theme';
import { TextField } from '@/features/auth/components/text-field';
import { GoalOption } from '@/features/onboarding/components/goal-option';
import { useProfile } from '@/features/profile/use-profile';
import { AnimatedNumber } from '@/features/progress/components/animated-number';
import { useClay, useTheme } from '@/hooks/use-theme';

import {
  ACTIVITY,
  BMI_BANDS,
  GOAL_TARGETS,
  LIMITS,
  bmi,
  bmiBand,
  bmr,
  healthyWeightRange,
  maintenance,
  parseNumber,
  roundCalories,
  type ActivityLevel,
  type BmiBand,
  type Sex,
} from './metrics';

const numberFormat = new Intl.NumberFormat();

/** The BMI scale the gauge draws; values outside it pin to the ends. */
const GAUGE_MIN = 15;
const GAUGE_MAX = 40;
const MARKER = 18;

/** Each band's share of the gauge, from the band below it up to its own limit. */
const ZONES = BMI_BANDS.map(({ band, upTo }, i) => {
  const from = i === 0 ? GAUGE_MIN : BMI_BANDS[i - 1].upTo;
  return { band, flex: Math.min(upTo, GAUGE_MAX) - from };
});

const ACTIVITY_ICONS = {
  sedentary: { ios: 'sofa.fill', material: 'chair', tint: Temper.lower },
  light: { ios: 'figure.walk', material: 'directions_walk', tint: Temper.upper },
  moderate: { ios: 'figure.run', material: 'directions_run', tint: Temper.legs },
  active: { ios: 'dumbbell.fill', material: 'fitness_center', tint: Temper.pull },
  veryActive: { ios: 'bolt.fill', material: 'bolt', tint: Temper.push },
} as const;

/** "72" for 72.0, "72.5" otherwise — how a stored measurement prefills its field. */
function prefill(value: number | null | undefined) {
  return value == null ? '' : String(Math.round(value * 10) / 10);
}

/** The parsed value, or the message to show under the field. Empty is neither. */
function check(text: string, limits: { min: number; max: number }, name: string) {
  if (!text.trim()) return {};
  const value = parseNumber(text);
  if (value === undefined) return { error: 'Enter a number.' };
  if (value < limits.min || value > limits.max) {
    return { error: `Enter ${name} between ${limits.min} and ${limits.max}.` };
  }
  return { value };
}

/**
 * BMI and maintenance calories. Age, height and weight start from the onboarding answers when
 * there are any; results update as the fields change, so there's no submit step.
 */
export function CalculatorScreen() {
  const theme = useTheme();
  const { profile } = useProfile();
  // Undefined until the user types, so the profile's answers show through once they load.
  const [ageText, setAgeText] = useState<string>();
  const [heightText, setHeightText] = useState<string>();
  const [weightText, setWeightText] = useState<string>();
  const [sex, setSex] = useState<Sex>();
  const [activity, setActivity] = useState<ActivityLevel>('moderate');

  const age = check(ageText ?? prefill(profile?.age), LIMITS.age, 'an age');
  const height = check(heightText ?? prefill(profile?.heightCm), LIMITS.heightCm, 'a height');
  const weight = check(weightText ?? prefill(profile?.weightKg), LIMITS.weightKg, 'a weight');

  const bodyMass =
    height.value !== undefined && weight.value !== undefined
      ? bmi(weight.value, height.value)
      : undefined;

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.fill, { backgroundColor: theme.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}>
        <Section title="About you">
          <SexPicker value={sex} onChange={setSex} />
          <TextField
            label="Age"
            value={ageText ?? prefill(profile?.age)}
            onChangeText={setAgeText}
            error={age.error}
            placeholder="e.g. 28"
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={3}
          />
          <View style={styles.pair}>
            <View style={styles.flex}>
              <TextField
                label="Height (cm)"
                value={heightText ?? prefill(profile?.heightCm)}
                onChangeText={setHeightText}
                error={height.error}
                placeholder="e.g. 178"
                keyboardType="decimal-pad"
                inputMode="decimal"
                maxLength={5}
              />
            </View>
            <View style={styles.flex}>
              <TextField
                label="Weight (kg)"
                value={weightText ?? prefill(profile?.weightKg)}
                onChangeText={setWeightText}
                error={weight.error}
                placeholder="e.g. 75"
                keyboardType="decimal-pad"
                inputMode="decimal"
                maxLength={5}
              />
            </View>
          </View>
        </Section>

        <Section title="Activity">
          {(Object.keys(ACTIVITY) as ActivityLevel[]).map((level) => (
            <GoalOption
              key={level}
              title={ACTIVITY[level].label}
              description={ACTIVITY[level].detail}
              ios={ACTIVITY_ICONS[level].ios}
              material={ACTIVITY_ICONS[level].material}
              tint={ACTIVITY_ICONS[level].tint}
              selected={activity === level}
              onSelect={() => setActivity(level)}
            />
          ))}
        </Section>

        <Section title="Your results">
          {bodyMass === undefined || height.value === undefined ? (
            <Placeholder text="Enter your height and weight to see your BMI." />
          ) : (
            <Animated.View entering={FadeInDown.duration(300)}>
              <BmiCard value={bodyMass} heightCm={height.value} />
            </Animated.View>
          )}

          {weight.value !== undefined &&
          height.value !== undefined &&
          age.value !== undefined &&
          sex ? (
            <Animated.View entering={FadeInDown.duration(300)}>
              <CaloriesCard
                basal={bmr(sex, weight.value, height.value, age.value)}
                activity={activity}
                goal={profile?.goal ?? undefined}
              />
            </Animated.View>
          ) : (
            <Placeholder
              text={`Add your ${[!sex && 'sex', age.value === undefined && 'age', bodyMass === undefined && 'height and weight'].filter(Boolean).join(', ')} to estimate your maintenance calories.`}
            />
          )}

          <Text variant="caption" color="textSecondary" style={styles.disclaimer}>
            Estimates from the Mifflin-St Jeor equation and the WHO BMI bands for adults. BMI
            doesn’t tell muscle from fat, so it reads high for heavily muscled lifters. Not medical
            advice.
          </Text>
        </Section>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="label" color="textSecondary" style={styles.sectionTitle}>
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function SexPicker({ value, onChange }: { value?: Sex; onChange: (sex: Sex) => void }) {
  const theme = useTheme();
  const clay = useClay();
  return (
    <View style={styles.field}>
      <Text variant="label" color="textSecondary">
        Sex
      </Text>
      <View style={styles.pair} accessibilityRole="radiogroup">
        {(['male', 'female'] as const).map((option) => {
          const selected = value === option;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={({ pressed }) => [
                styles.chip,
                { backgroundColor: selected ? theme.accent : theme.surface },
                pressed ? [styles.pressed, clay.sunken] : selected ? clay.accent : clay.soft,
              ]}>
              <Text
                variant="bodyStrong"
                style={{ color: selected ? theme.onAccent : theme.text }}>
                {option === 'male' ? 'Male' : 'Female'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function BmiCard({ value, heightCm }: { value: number; heightCm: number }) {
  const theme = useTheme();
  const clay = useClay();
  const band = bmiBand(value);
  const healthy = healthyWeightRange(heightCm);
  const color = bandColor(band.band, theme);

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }, clay.raised]}>
      <Text variant="label" color="textSecondary">
        Body mass index
      </Text>
      <View style={styles.valueRow}>
        <AnimatedNumber value={value} decimals={1} animate style={styles.value} />
        <View style={[styles.bandPill, { backgroundColor: color }, styles.bead]}>
          <Text variant="label" style={styles.bandText}>
            {band.label}
          </Text>
        </View>
      </View>
      <Gauge value={value} />
      <Text variant="label" color="textSecondary">
        A healthy weight for your height is{' '}
        <Text variant="label">
          {Math.round(healthy.min)}–{Math.round(healthy.max)} kg
        </Text>
        .
      </Text>
    </View>
  );
}

/** The four BMI bands as a clay track, with a bead at this BMI. */
function Gauge({ value }: { value: number }) {
  const theme = useTheme();
  const clay = useClay();
  const [width, setWidth] = useState(0);
  const span = GAUGE_MAX - GAUGE_MIN;
  const position = Math.min(Math.max((value - GAUGE_MIN) / span, 0), 1);

  return (
    <View
      accessible
      accessibilityLabel={`BMI ${value.toFixed(1)}, ${bmiBand(value).label.toLowerCase()}`}>
      <View
        style={[styles.track, { backgroundColor: theme.background }, clay.sunken]}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}>
        {ZONES.map(({ band, flex }) => (
          <View
            key={band}
            style={[styles.zone, { flex, backgroundColor: bandColor(band, theme) }]}
          />
        ))}
        {width > 0 && (
          <Animated.View
            style={[
              styles.marker,
              { backgroundColor: theme.surface, borderColor: theme.text },
              clay.soft,
              {
                transform: [{ translateX: position * (width - MARKER) }],
                transitionProperty: 'transform',
                transitionDuration: 400,
                transitionTimingFunction: CSS_EASE_OUT,
              },
            ]}
          />
        )}
      </View>
      <View style={styles.scale}>
        {[18.5, 25, 30].map((mark) => (
          <Text
            key={mark}
            variant="caption"
            color="textSecondary"
            style={[styles.tick, { left: `${((mark - GAUGE_MIN) / span) * 100}%` }]}>
            {mark}
          </Text>
        ))}
      </View>
    </View>
  );
}

function CaloriesCard({
  basal,
  activity,
  goal,
}: {
  basal: number;
  activity: ActivityLevel;
  goal?: string;
}) {
  const theme = useTheme();
  const clay = useClay();
  const daily = roundCalories(maintenance(basal, activity));

  return (
    <View style={[styles.card, { backgroundColor: theme.iron }, clay.iron]}>
      <Text variant="label" style={{ color: theme.ironTextSecondary }}>
        Maintenance calories
      </Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: theme.ironText }]}>{numberFormat.format(daily)}</Text>
        <Text variant="title" style={{ color: theme.ironTextSecondary }}>
          kcal / day
        </Text>
      </View>
      <Text variant="caption" style={{ color: theme.ironTextSecondary }}>
        {numberFormat.format(roundCalories(basal))} kcal at rest × {ACTIVITY[activity].factor} for{' '}
        {ACTIVITY[activity].label.toLowerCase()}
      </Text>

      <View style={[styles.targets, { borderTopColor: theme.ironLine }]}>
        {GOAL_TARGETS.map((target) => {
          const yours = target.goal === goal;
          return (
            <View
              key={target.goal}
              style={[styles.target, yours && [{ backgroundColor: theme.iron }, clay.ironSunken]]}>
              <View style={styles.flex}>
                <View style={styles.targetTitle}>
                  <Text variant="bodyStrong" style={{ color: theme.ironText }}>
                    {target.label}
                  </Text>
                  {yours && (
                    <View style={[styles.yours, { backgroundColor: theme.accent }, clay.accent]}>
                      <Text variant="caption" style={{ color: theme.onAccent }}>
                        Your goal
                      </Text>
                    </View>
                  )}
                </View>
                <Text variant="caption" style={{ color: theme.ironTextSecondary }}>
                  {target.detail}
                </Text>
              </View>
              <Text variant="bodyStrong" style={{ color: yours ? theme.accent : theme.ironText }}>
                {numberFormat.format(daily + target.offset)} kcal
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Placeholder({ text }: { text: string }) {
  const theme = useTheme();
  const clay = useClay();
  return (
    <View style={[styles.placeholder, { backgroundColor: theme.background }, clay.sunken]}>
      <Text variant="label" color="textSecondary">
        {text}
      </Text>
    </View>
  );
}

function bandColor(band: BmiBand, theme: ReturnType<typeof useTheme>) {
  switch (band) {
    case 'underweight':
      return Temper.lower;
    case 'healthy':
      return theme.up;
    case 'overweight':
      return Temper.push;
    case 'obese':
      return theme.danger;
  }
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.five,
  },
  section: {
    gap: Spacing.three,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.one,
    letterSpacing: 1.2,
    fontSize: 12,
  },
  field: {
    gap: Spacing.one + Spacing.half,
  },
  pair: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  chip: {
    flex: 1,
    height: 48,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  card: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  value: {
    fontFamily: FontFamily.display,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -1,
    minWidth: 48,
  },
  bandPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  bandText: {
    color: '#FFFFFF',
  },
  /** Moulds a coloured fill like a small clay bead. */
  bead: {
    boxShadow:
      'inset 2px 2px 4px rgba(255, 255, 255, 0.4), inset -2px -3px 5px rgba(0, 0, 0, 0.25)',
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
    marginTop: Spacing.two,
    padding: 5,
    gap: 3,
    borderRadius: Radius.pill,
  },
  zone: {
    height: '100%',
    borderRadius: Radius.pill,
    opacity: 0.85,
  },
  marker: {
    position: 'absolute',
    left: 0,
    top: 2,
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    borderWidth: 3,
  },
  scale: {
    height: 18,
    marginTop: Spacing.one,
    marginHorizontal: 5,
  },
  tick: {
    position: 'absolute',
    width: 32,
    marginLeft: -16,
    textAlign: 'center',
  },
  targets: {
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
  },
  target: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    marginHorizontal: -Spacing.three,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  targetTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  yours: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
  placeholder: {
    padding: Spacing.four,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
  },
  disclaimer: {
    paddingHorizontal: Spacing.one,
  },
});
