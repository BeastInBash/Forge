import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientText } from '@/components/ui/gradient-text';
import { Text } from '@/components/ui/text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  /** Small line above the heading, like the date on the home screen. */
  eyebrow: string;
  heading: string;
  children: ReactNode;
  footer: ReactNode;
};

/**
 * Shared frame for the sign-in and sign-up screens: the logo and wordmark, a heading in the
 * same label-over-title shape as the home intro, then the form.
 */
export function AuthScreen({ eyebrow, heading, children, footer }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.fill, { backgroundColor: theme.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.five },
        ]}>
        <View style={styles.hero}>
          <Image
            source={require('@/assets/images/splash-icon.png')}
            style={styles.logo}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.brand}>
            <Text variant="display">FORGE</Text>
            <GradientText variant="label" colors={[theme.textSecondary, theme.accent]}>
              Plan it. Lift it. Log it.
            </GradientText>
          </View>
        </View>

        <View style={styles.intro}>
          <Text variant="label" color="textSecondary">
            {eyebrow}
          </Text>
          <Text variant="title">{heading}</Text>
        </View>

        <View style={styles.form}>{children}</View>

        <View style={styles.footer}>{footer}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.four,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: 128,
    height: 128,
  },
  brand: {
    alignItems: 'center',
    gap: Spacing.half,
  },
  intro: {
    alignItems: 'center',
    gap: Spacing.half,
  },
  form: {
    gap: Spacing.three,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
