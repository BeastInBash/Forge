import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { Text } from '@/components/ui/text';
import { CSS_EASE_OUT } from '@/constants/motion';
import { Radius, Spacing } from '@/constants/theme';
import { useSurface, useTheme } from '@/hooks/use-theme';

import type { MealDay } from '../api';
import { formatAmount, nutrientLabel } from '../nutrients';
import { remaining, type Target } from '../targets';

const GROUPS = [
  { title: 'More macros', keys: ['fiber', 'sugar', 'saturatedFat', 'cholesterol'] },
  {
    title: 'Vitamins',
    keys: [
      'vitaminA',
      'vitaminB1',
      'vitaminB2',
      'vitaminB3',
      'vitaminB6',
      'vitaminB12',
      'folate',
      'vitaminC',
      'vitaminD',
      'vitaminE',
      'vitaminK',
    ],
  },
  {
    title: 'Minerals',
    keys: ['calcium', 'iron', 'magnesium', 'phosphorus', 'potassium', 'sodium', 'zinc'],
  },
];

/**
 * Today's fiber, vitamins and minerals against the daily targets. The extra macros show at
 * once; vitamins and minerals open on demand so the page stays short.
 */
export function NutrientTargetsCard({
  day,
  targets,
}: {
  day: MealDay;
  targets: Record<string, Target>;
}) {
  const theme = useTheme();
  const surface = useSurface();
  const [open, setOpen] = useState(false);
  const eaten: Record<string, number> = Object.assign({}, ...Object.values(day.total));
  const groups = open ? GROUPS : GROUPS.slice(0, 1);

  return (
    <View style={[styles.card, { backgroundColor: theme.surface }, surface.raised]}>
      <View style={styles.header}>
        <IconBadge
          ios="leaf"
          material="eco"
          color={theme.text}
          background={theme.background}
          border={theme.line}
        />
        <Text variant="caption" style={[styles.caps, { color: theme.textSecondary }]}>
          Daily nutrients
        </Text>
      </View>

      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text variant="caption" style={[styles.caps, { color: theme.textSecondary }]}>
            {group.title}
          </Text>
          {group.keys.map((key) =>
            targets[key] ? (
              <NutrientRow
                key={key}
                label={nutrientLabel(key)}
                unit={day.units[key] ?? ''}
                eaten={eaten[key] ?? 0}
                target={targets[key]}
              />
            ) : null
          )}
        </View>
      ))}

      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [
          styles.toggle,
          { backgroundColor: theme.surface },
          pressed ? surface.sunken : surface.soft,
        ]}>
        <Text variant="label">{open ? 'Show less' : 'Show vitamins & minerals'}</Text>
        <Icon
          ios={open ? 'chevron.up' : 'chevron.down'}
          material={open ? 'expand_less' : 'expand_more'}
          size={16}
          color={theme.textSecondary}
        />
      </Pressable>
    </View>
  );
}

function NutrientRow({
  label,
  unit,
  eaten,
  target,
}: {
  label: string;
  unit: string;
  eaten: number;
  target: Target;
}) {
  const theme = useTheme();
  const { left, over, share } = remaining(eaten, target);
  // A ceiling only turns red once passed; a target turns green once reached
  const status = target.limit
    ? over
      ? `${formatAmount(over)} ${unit} over`
      : `${formatAmount(left)} ${unit} to limit`
    : left
      ? `${formatAmount(left)} ${unit} left`
      : 'Reached';
  const color = target.limit
    ? over
      ? theme.danger
      : theme.textSecondary
    : left
      ? theme.textSecondary
      : theme.up;
  const fill = target.limit ? (over ? theme.danger : theme.accent) : theme.up;

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${label}: ${formatAmount(eaten)} of ${formatAmount(target.amount)} ${unit}, ${status}`}>
      <View style={styles.rowHead}>
        <Text variant="label" style={{ color: theme.text }}>
          {label}
        </Text>
        <Text variant="caption" style={[styles.amount, { color: theme.textSecondary }]}>
          {formatAmount(eaten)} / {formatAmount(target.amount)} {unit}
        </Text>
        <Text variant="caption" style={{ color }}>
          {status}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.line }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: `${Math.min(100, share * 100)}%`,
              backgroundColor: fill,
              transitionProperty: 'width',
              transitionDuration: 400,
              transitionTimingFunction: CSS_EASE_OUT,
            },
          ]}
        />
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + Spacing.half,
  },
  caps: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  group: {
    gap: Spacing.three,
  },
  row: {
    gap: Spacing.one,
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  amount: {
    flex: 1,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  toggle: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
});
