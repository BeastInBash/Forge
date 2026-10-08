import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { EASE_OUT } from '@/constants/motion';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** A server or network failure for the whole form. It leaves faster than it arrives. */
export function FormError({ message }: { message: string }) {
  const theme = useTheme();
  return (
    <Animated.View
      key={message}
      entering={FadeIn.duration(180).easing(EASE_OUT)}
      exiting={FadeOut.duration(120)}
      accessibilityRole="alert"
      style={[
        styles.banner,
        {
          backgroundColor: `${theme.danger}1A`,
          borderColor: `${theme.danger}40`,
        },
      ]}>
      <Icon ios="exclamationmark.circle.fill" material="error" size={18} color={theme.danger} />
      <Text variant="label" color="danger" style={styles.message}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.one,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  message: {
    flex: 1,
  },
});
