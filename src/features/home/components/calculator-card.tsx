import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { PressScale } from '@/components/ui/press-scale';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useClay, useTheme } from '@/hooks/use-theme';

/** Entry to the BMI and maintenance calorie calculator. */
export function CalculatorCard({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  const clay = useClay();
  return (
    <PressScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint="Opens the BMI and maintenance calorie calculator"
      style={[styles.card, { backgroundColor: theme.surface }, clay.raised]}
      pressedStyle={clay.sunken}>
      <View style={[styles.iconTile, { backgroundColor: theme.accent }, clay.accent]}>
        <Icon ios="scalemass.fill" material="monitor_weight" size={22} color={theme.onAccent} />
      </View>
      <View style={styles.text}>
        <Text variant="bodyStrong">Calculate BMI & Maintenance Calories</Text>
        <Text variant="caption" color="textSecondary">
          See where you stand and how much to eat for your goal
        </Text>
      </View>
      <Icon ios="chevron.right" material="chevron_right" size={20} color={theme.textSecondary} />
    </PressScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
});
