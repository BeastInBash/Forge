import { StyleSheet, Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { FontFamily, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'hero' | 'display' | 'title' | 'body' | 'bodyStrong' | 'label' | 'caption';

export type TextProps = RNTextProps & {
  variant?: Variant;
  color?: ThemeColor;
};

/** App text. Display variants use Big Shoulders; everything else is Archivo. */
export function Text({ variant = 'body', color = 'text', style, ...rest }: TextProps) {
  const theme = useTheme();
  return <RNText style={[styles[variant], { color: theme[color] }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  hero: {
    fontFamily: FontFamily.display,
    fontSize: 52,
    lineHeight: 50,
    letterSpacing: -0.5,
  },
  display: {
    fontFamily: FontFamily.display,
    fontSize: 40,
    lineHeight: 42,
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontFamily: FontFamily.displayBold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: 0.2,
  },
  body: {
    fontFamily: FontFamily.body,
    fontSize: 16,
    lineHeight: 22,
  },
  bodyStrong: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
  caption: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
  },
});
