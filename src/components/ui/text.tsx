import { StyleSheet, Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { FontFamily, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'hero' | 'display' | 'title' | 'body' | 'bodyStrong' | 'label' | 'caption';

export type TextProps = RNTextProps & {
  variant?: Variant;
  color?: ThemeColor;
};

/**
 * App text. Display variants use Roboto; everything else is Inter. The scale is deliberately
 * compact — hierarchy comes from weight, colour and space more than from size.
 */
export function Text({ variant = 'body', color = 'text', style, ...rest }: TextProps) {
  const theme = useTheme();
  return <RNText style={[styles[variant], { color: theme[color] }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  hero: {
    fontFamily: FontFamily.display,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  display: {
    fontFamily: FontFamily.display,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  title: {
    fontFamily: FontFamily.displayBold,
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: FontFamily.body,
    fontSize: 15,
    lineHeight: 21,
  },
  bodyStrong: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    lineHeight: 21,
  },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
  },
  caption: {
    fontFamily: FontFamily.body,
    fontSize: 11,
    lineHeight: 15,
    fontVariant: ['tabular-nums'],
  },
});
