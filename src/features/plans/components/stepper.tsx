import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useClay, useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

/** A labelled −/value/+ control for small whole numbers like sets and reps. */
export function Stepper({ label, value, min, max, onChange }: Props) {
  const theme = useTheme();
  const clay = useClay();

  const button = (icon: 'minus' | 'plus', next: number, disabled: boolean) => (
    <Pressable
      onPress={() => onChange(next)}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`${icon === 'minus' ? 'Fewer' : 'More'} ${label.toLowerCase()}`}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.surface },
        pressed ? clay.sunken : clay.soft,
        disabled && styles.disabled,
      ]}>
      <Icon
        ios={icon}
        material={icon === 'minus' ? 'remove' : 'add'}
        size={16}
        color={theme.text}
      />
    </Pressable>
  );

  return (
    <View style={styles.wrap}>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <View
        style={styles.row}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'increment' && value < max) onChange(value + 1);
          if (event.nativeEvent.actionName === 'decrement' && value > min) onChange(value - 1);
        }}>
        {button('minus', value - 1, value <= min)}
        <Text variant="title" style={styles.value}>
          {value}
        </Text>
        {button('plus', value + 1, value >= max)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  button: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.35,
  },
  value: {
    minWidth: 30,
    textAlign: 'center',
    fontSize: 22,
  },
});
