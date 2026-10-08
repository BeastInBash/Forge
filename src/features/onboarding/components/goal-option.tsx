import type { SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { PressScale } from '@/components/ui/press-scale';
import { Text } from '@/components/ui/text';
import { CSS_EASE_OUT } from '@/constants/motion';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  title: string;
  description: string;
  ios: Extract<SymbolViewProps['name'], string>;
  material: NonNullable<Exclude<SymbolViewProps['name'], string>['android']>;
  /** The tempering colour this goal wears. */
  tint: string;
  selected: boolean;
  onSelect: () => void;
};

const CHANGE = { transitionDuration: 150, transitionTimingFunction: CSS_EASE_OUT } as const;

/** One radio card in the goal step. Selection changes colour only; nothing moves or resizes. */
export function GoalOption({ title, description, ios, material, tint, selected, onSelect }: Props) {
  const theme = useTheme();
  return (
    <PressScale
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={title}
      accessibilityHint={description}>
      {/* PressScale owns the transform transition, so the colour change lives one level in. */}
      <Animated.View
        style={[
          styles.card,
          CHANGE,
          {
            backgroundColor: selected ? `${theme.accent}14` : theme.surface,
            borderColor: selected ? theme.accent : theme.line,
            transitionProperty: ['backgroundColor', 'borderColor'],
          },
        ]}>
        <View style={[styles.badge, { backgroundColor: `${tint}26` }]}>
          <Icon ios={ios} material={material} size={22} color={tint} />
        </View>
        <View style={styles.copy}>
          <Text variant="bodyStrong">{title}</Text>
          <Text variant="label" color="textSecondary">
            {description}
          </Text>
        </View>
        <Animated.View
          style={[
            styles.check,
            CHANGE,
            {
              backgroundColor: selected ? theme.accent : 'transparent',
              borderColor: selected ? theme.accent : theme.line,
              transitionProperty: ['backgroundColor', 'borderColor'],
            },
          ]}>
          {selected && (
            <Animated.View entering={FadeIn.duration(120)}>
              <Icon ios="checkmark" material="check" size={14} color={theme.onAccent} />
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    borderWidth: 1.5,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: Radius.small + 4,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: Spacing.half,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
