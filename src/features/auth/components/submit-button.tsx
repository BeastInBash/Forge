import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** The straw primary action, same shape as "Start workout" on the session card. */
export function SubmitButton({
  label,
  loading,
  disabled = false,
  onPress,
}: {
  label: string;
  loading: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      accessibilityRole="button"
      accessibilityState={{ busy: loading, disabled: loading || disabled }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.accent },
        pressed && styles.pressed,
        disabled && !loading && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={theme.onAccent} />
      ) : (
        <Text variant="bodyStrong" style={{ color: theme.onAccent }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: Spacing.two,
    height: 52,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
