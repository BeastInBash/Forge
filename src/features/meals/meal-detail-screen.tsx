import * as Haptics from 'expo-haptics';
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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { errorMessage } from '@/features/auth/validation';
import { useClay, useTheme } from '@/hooks/use-theme';

import { deleteMeal, type MealItem, type NutritionReport } from './api';
import { MacroBar, MACRO_COLORS } from './components/macro-bar';
import { removeMealLocally } from './meals-store';
import { dailyPercent, formatAmount, mealTimeInfo, nutrientLabel, NUTRIENT_INFO } from './nutrients';
import { useMeal } from './use-meals';

const when = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

/** Below this the AI wasn't sure what the food was or how much of it there was. */
const LOW_CONFIDENCE = 0.5;

const macrosOf = (report: NutritionReport) => ({
  protein: report.macros.protein ?? 0,
  carbs: report.macros.carbs ?? 0,
  fat: report.macros.fat ?? 0,
});

/** One logged meal: its totals, each food's estimate, and every nutrient with its Daily Value. */
export function MealDetailScreen() {
  const theme = useTheme();
  const clay = useClay();
  const router = useRouter();
  const { mealId, ignored } = useLocalSearchParams<{ mealId: string; ignored?: string }>();
  const { meal, summary, error, loading, refreshing, refresh } = useMeal(mealId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

  const header = meal ?? summary;
  const info = header ? mealTimeInfo(header.mealTime) : undefined;
  const units = meal?.units ?? {};

  async function remove() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      Haptics.selectionAsync();
      return;
    }
    setDeleting(true);
    setDeleteError(undefined);
    try {
      await deleteMeal(mealId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      removeMealLocally(mealId);
      router.back();
    } catch (e) {
      setDeleteError(errorMessage(e));
      setDeleting(false);
    }
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.textSecondary} />
      }>
      <Stack.Screen options={{ title: info?.label ?? 'Meal' }} />

      {header && (
        <View style={[styles.hero, { backgroundColor: theme.iron }, clay.iron]}>
          <Text variant="label" style={{ color: theme.ironTextSecondary }}>
            {when.format(new Date(header.eatenAt))}
          </Text>
          <View style={styles.heroTotal}>
            <Text variant="hero" style={{ color: theme.ironText }}>
              {meal ? (meal.total.energy.calories ?? 0) : summary?.total.calories}
            </Text>
            <Text variant="label" style={{ color: theme.ironTextSecondary }}>
              kcal
            </Text>
          </View>
          <MacroBar macros={meal ? macrosOf(meal.total) : summary!.total} onIron />
        </View>
      )}

      {ignored ? (
        <View style={[styles.notice, { backgroundColor: theme.surface }, clay.soft]}>
          <Icon ios="info.circle" material="info" size={18} color={theme.textSecondary} />
          <Text variant="label" color="textSecondary" style={styles.flex}>
            Left out, not food or drink: {ignored}
          </Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
      ) : error || !meal ? (
        <View style={[styles.card, { backgroundColor: theme.surface }, clay.raised]}>
          <Text variant="bodyStrong">Couldn’t load this meal</Text>
          <Text variant="label" color="textSecondary">
            {error}
          </Text>
          <Pressable onPress={refresh} accessibilityRole="button">
            <Text variant="label">Try again</Text>
          </Pressable>
        </View>
      ) : (
        <Animated.View entering={FadeIn.duration(200)} style={styles.sections}>
          <View style={styles.section}>
            <SectionTitle>{`FOODS · ${meal.items.length}`}</SectionTitle>
            {meal.items.map((item, index) => (
              <Animated.View
                key={`${item.food}-${index}`}
                entering={index < 8 ? FadeInDown.delay(index * 40).duration(260) : undefined}>
                <FoodCard item={item} units={units} />
              </Animated.View>
            ))}
          </View>

          <NutrientSection
            title="MACROS"
            values={meal.total.macros}
            keys={['protein', 'carbs', 'fat', 'fiber', 'sugar', 'saturatedFat', 'cholesterol']}
            units={units}
          />
          <NutrientSection title="VITAMINS" values={meal.total.vitamins} units={units} />
          <NutrientSection title="MINERALS" values={meal.total.minerals} units={units} />

          <Text variant="caption" color="textSecondary" style={styles.disclaimer}>
            {meal.disclaimer} % Daily Value is based on a 2,000 kcal diet.
          </Text>

          {deleteError && (
            <Text variant="label" color="danger" accessibilityRole="alert">
              {deleteError}
            </Text>
          )}
          <Pressable
            onPress={remove}
            disabled={deleting}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.delete,
              { backgroundColor: confirmDelete ? theme.danger : theme.surface },
              pressed ? clay.sunken : clay.soft,
            ]}>
            {deleting ? (
              <ActivityIndicator color={theme.surface} />
            ) : (
              <>
                <Icon
                  ios="trash"
                  material="delete"
                  size={18}
                  color={confirmDelete ? theme.surface : theme.danger}
                />
                <Text
                  variant="bodyStrong"
                  style={{ color: confirmDelete ? theme.surface : theme.danger }}>
                  {confirmDelete ? 'Tap again to delete' : 'Delete meal'}
                </Text>
              </>
            )}
          </Pressable>
        </Animated.View>
      )}
    </ScrollView>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text variant="label" color="textSecondary" style={styles.sectionTitle}>
      {children}
    </Text>
  );
}

/** One food's estimate; opens to show its own vitamins and minerals. */
function FoodCard({ item, units }: { item: MealItem; units: Record<string, string> }) {
  const theme = useTheme();
  const clay = useClay();
  const [open, setOpen] = useState(false);
  const unsure = item.confidence < LOW_CONFIDENCE;
  const { macros } = item.nutrition;

  return (
    <Pressable
      onPress={() => setOpen((o) => !o)}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityHint="Shows this food's vitamins and minerals"
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface },
        pressed ? clay.sunken : clay.raised,
      ]}>
      <View style={styles.foodHeader}>
        <View style={styles.flex}>
          <Text variant="bodyStrong">{item.name}</Text>
          <Text variant="caption" color="textSecondary">
            {[
              // What the user typed, when the AI read it as something more specific
              item.food.toLowerCase() !== item.name.toLowerCase() && item.food,
              item.amount,
              `≈${item.grams} g${item.state ? ` ${item.state}` : ''}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
        <View style={styles.foodKcal}>
          <Text variant="title">{item.nutrition.energy.calories ?? 0}</Text>
          <Text variant="caption" color="textSecondary">
            kcal
          </Text>
        </View>
      </View>

      <View style={styles.foodMacros}>
        {(['protein', 'carbs', 'fat'] as const).map((key) => (
          <View key={key} style={[styles.chip, { backgroundColor: theme.background }, clay.sunken]}>
            <View style={[styles.dot, { backgroundColor: MACRO_COLORS[key] }]} />
            <Text variant="caption">
              {nutrientLabel(key)} {formatAmount(macros[key] ?? 0)} g
            </Text>
          </View>
        ))}
      </View>

      {item.assumption && (
        <Text variant="caption" color="textSecondary">
          {item.assumption}
        </Text>
      )}
      {unsure && (
        <View style={styles.unsure}>
          <Icon
            ios="exclamationmark.triangle"
            material="warning"
            size={14}
            color={theme.danger}
          />
          <Text variant="caption" color="danger">
            Low confidence — check the food name and amount.
          </Text>
        </View>
      )}

      {open && (
        <Animated.View entering={FadeIn.duration(180)} style={styles.foodDetail}>
          {(['macros', 'vitamins', 'minerals'] as const).map((group) => (
            <View key={group} style={styles.foodGroup}>
              {Object.entries(item.nutrition[group])
                .filter(([key, value]) => value > 0 && !['protein', 'carbs', 'fat'].includes(key))
                .map(([key, value]) => (
                  <View key={key} style={styles.foodRow}>
                    <Text variant="caption" color="textSecondary" style={styles.flex}>
                      {nutrientLabel(key)}
                    </Text>
                    <Text variant="caption">
                      {formatAmount(value)} {units[key]}
                    </Text>
                  </View>
                ))}
            </View>
          ))}
        </Animated.View>
      )}
      <View style={styles.chevron}>
        <Icon
          ios={open ? 'chevron.up' : 'chevron.down'}
          material={open ? 'expand_less' : 'expand_more'}
          size={16}
          color={theme.textSecondary}
        />
      </View>
    </Pressable>
  );
}

/** A nutrition-facts style list: amount, unit and share of the Daily Value per nutrient. */
function NutrientSection({
  title,
  values,
  keys,
  units,
}: {
  title: string;
  values: Record<string, number>;
  keys?: string[];
  units: Record<string, string>;
}) {
  const theme = useTheme();
  const clay = useClay();
  const rows = (keys ?? Object.keys(values)).filter((key) => key in values);

  return (
    <View style={styles.section}>
      <SectionTitle>{title}</SectionTitle>
      <View style={[styles.card, styles.facts, { backgroundColor: theme.surface }, clay.raised]}>
        {rows.map((key, index) => {
          const value = values[key] ?? 0;
          const percent = dailyPercent(key, value);
          const limit = NUTRIENT_INFO[key]?.limit;
          return (
            <View
              key={key}
              style={[
                styles.fact,
                index > 0 && { borderTopColor: theme.line, borderTopWidth: StyleSheet.hairlineWidth },
              ]}
              accessible
              accessibilityLabel={`${nutrientLabel(key)}: ${formatAmount(value)} ${units[key] ?? ''}${percent !== undefined ? `, ${percent}% of daily value` : ''}`}>
              <View style={styles.factText}>
                <Text variant="label" style={styles.flex}>
                  {nutrientLabel(key)}
                </Text>
                <Text variant="label" color="textSecondary">
                  {formatAmount(value)} {units[key]}
                </Text>
                <Text variant="label" style={styles.percent}>
                  {percent !== undefined ? `${percent}%` : '—'}
                </Text>
              </View>
              {percent !== undefined && (
                <View style={[styles.factTrack, { backgroundColor: theme.background }]}>
                  <View
                    style={[
                      styles.factFill,
                      {
                        width: `${Math.min(100, percent)}%`,
                        backgroundColor:
                          limit && percent >= 50 ? theme.danger : percent >= 100 ? theme.up : theme.text,
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>
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
    paddingBottom: Spacing.six,
    gap: Spacing.four,
  },
  flex: {
    flex: 1,
  },
  hero: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heroTotal: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
    marginTop: -Spacing.two,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  loading: {
    paddingVertical: Spacing.five,
  },
  sections: {
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.three,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.one,
    letterSpacing: 1.2,
    fontSize: 12,
  },
  card: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  foodHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  foodKcal: {
    alignItems: 'flex-end',
  },
  foodMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    height: 28,
    borderRadius: Radius.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.pill,
  },
  unsure: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  foodDetail: {
    gap: Spacing.two,
    paddingTop: Spacing.one,
  },
  foodGroup: {
    gap: Spacing.half,
  },
  foodRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chevron: {
    alignItems: 'center',
    marginBottom: -Spacing.one,
  },
  facts: {
    paddingVertical: Spacing.one,
    gap: 0,
  },
  fact: {
    paddingVertical: Spacing.two,
    gap: Spacing.one,
  },
  factText: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  percent: {
    minWidth: 44,
    textAlign: 'right',
  },
  factTrack: {
    height: 4,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  factFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  disclaimer: {
    paddingHorizontal: Spacing.one,
  },
  delete: {
    minHeight: 52,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
