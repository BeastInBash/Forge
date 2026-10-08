import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PressScale } from '@/components/ui/press-scale';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useSession } from '../session';
import { errorMessage } from '../validation';

type Props = {
  /** True while the email form is submitting, so the two can't run at once. */
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  onError: (message: string) => void;
};

/**
 * "or" divider plus the Google button. Google's button guidelines ask for the full-colour G on a
 * neutral outlined button, so this uses the surface/line pair instead of the straw accent.
 */
export function GoogleSignIn({ disabled, onBusyChange, onError }: Props) {
  const theme = useTheme();
  const { signInWithGoogle } = useSession();
  const [loading, setLoading] = useState(false);

  async function press() {
    setLoading(true);
    onBusyChange(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      onError(errorMessage(error));
      setLoading(false);
      onBusyChange(false);
    }
  }

  return (
    <>
      <View
        style={styles.divider}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        <View style={[styles.rule, { backgroundColor: theme.line }]} />
        <Text variant="caption" color="textSecondary" style={styles.or}>
          OR
        </Text>
        <View style={[styles.rule, { backgroundColor: theme.line }]} />
      </View>

      <PressScale
        onPress={press}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        accessibilityState={{ busy: loading, disabled: disabled || loading }}
        style={[
          styles.button,
          { backgroundColor: theme.surface, borderColor: theme.line },
          disabled && !loading && styles.disabled,
        ]}>
        {loading ? (
          <ActivityIndicator color={theme.text} />
        ) : (
          <>
            <Image source={require('@/assets/images/google-g.png')} style={styles.logo} />
            <Text variant="bodyStrong">Continue with Google</Text>
          </>
        )}
      </PressScale>
    </>
  );
}

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  or: {
    letterSpacing: 1.2,
  },
  button: {
    minHeight: 54,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: 20,
    height: 20,
  },
  disabled: {
    opacity: 0.5,
  },
});
