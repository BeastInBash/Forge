import { Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { Radius } from '@/constants/theme';
import { useSurface, useTheme } from '@/hooks/use-theme';

type Props = {
  checked: boolean;
  onToggle: () => void;
  label: string;
  size?: number;
  disabled?: boolean;
};

/** A flat square box that fills straw when ticked. */
export function CheckBox({ checked, onToggle, label, size = 30, disabled }: Props) {
  const theme = useTheme();
  const surface = useSurface();
  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      style={({ pressed }) => [pressed && styles.pressed, disabled && styles.disabled]}>
      <Animated.View
        style={[
          styles.box,
          {
            width: size,
            height: size,
            borderRadius: Radius.small,
            backgroundColor: checked ? theme.accent : theme.background,
            transitionProperty: 'backgroundColor',
            transitionDuration: 150,
          },
          checked ? surface.accent : surface.sunken,
        ]}>
        {checked && (
          <Animated.View entering={FadeIn.duration(120)}>
            <Icon ios="checkmark" material="check" size={size * 0.55} color={theme.onAccent} />
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.92 }],
  },
  disabled: {
    opacity: 0.4,
  },
});
