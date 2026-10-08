import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useId, type ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { GradientText } from '@/components/ui/gradient-text';
import { Text } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing, Temper } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { rise, settle } from './motion';

/** The tempering colours in the order steel passes through them, for the panel's top edge. */
const TEMPER_RUN = [Temper.push, Temper.pull, Temper.legs, Temper.upper, Temper.lower] as const;

type Props = {
  /** Small line above the heading, like the date on the home screen. */
  eyebrow: string;
  heading: string;
  children: ReactNode;
  footer: ReactNode;
  /**
   * Stagger the blocks in on mount. Only the screen the auth flow opens on uses it: a pushed
   * screen already arrives with the native slide, and a second motion on top reads as noise.
   */
  animateIn?: boolean;
};

/**
 * Shared frame for the sign-in and sign-up screens: a cast-iron brand panel with the logo
 * glowing like work in the forge, a heading in the home intro's label-over-title shape, then
 * the form.
 */
export function AuthScreen({ eyebrow, heading, children, footer, animateIn = false }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const enter = (index: number) => (animateIn ? rise(index) : undefined);

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.fill, { backgroundColor: theme.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: insets.bottom + Spacing.five,
          },
        ]}>
        <Animated.View
          entering={animateIn ? settle : undefined}
          style={[styles.panel, { backgroundColor: theme.iron }]}>
          <LinearGradient
            colors={TEMPER_RUN}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.temper}
          />
          <Ember color={theme.accent} />
          {/* The dark-background logo: the panel is iron in both themes. */}
          <Image
            source={require('@/assets/images/splash-icon.png')}
            style={styles.logo}
            contentFit="contain"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.brand}>
            <Text variant="display" style={[styles.wordmark, { color: theme.ironText }]}>
              FORGE
            </Text>
            <GradientText variant="label" colors={[theme.ironTextSecondary, theme.accent]}>
              Plan it. Lift it. Log it.
            </GradientText>
          </View>
        </Animated.View>

        <Animated.View entering={enter(0)} style={styles.intro}>
          <Text variant="label" color="textSecondary">
            {eyebrow}
          </Text>
          <Text variant="title" style={styles.heading}>
            {heading}
          </Text>
        </Animated.View>

        <Animated.View entering={enter(1)} style={styles.form}>
          {children}
        </Animated.View>

        <Animated.View entering={enter(2)} style={styles.footer}>
          {footer}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** A still, warm glow behind the logo. Static on purpose — it is set dressing, not a signal. */
function Ember({ color }: { color: string }) {
  // Login stays mounted under signup, and on web gradient ids are document-wide.
  const id = `ember-${useId().replace(/:/g, '')}`;
  return (
    <Svg style={[StyleSheet.absoluteFill, styles.ember]}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="42%" rx="55%" ry="60%">
          <Stop offset="0" stopColor={color} stopOpacity={0.22} />
          <Stop offset="0.55" stopColor={color} stopOpacity={0.05} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
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
  panel: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  temper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  ember: {
    pointerEvents: 'none',
  },
  logo: {
    width: 104,
    height: 104,
  },
  brand: {
    alignItems: 'center',
    gap: Spacing.half,
  },
  wordmark: {
    letterSpacing: 2,
  },
  intro: {
    gap: Spacing.half,
  },
  heading: {
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  form: {
    gap: Spacing.three,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
