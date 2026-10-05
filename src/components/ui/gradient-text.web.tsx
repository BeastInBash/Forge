import type { TextStyle } from 'react-native';

import { Text, type TextProps } from './text';

export type GradientTextProps = Omit<TextProps, 'color'> & {
  /** Left-to-right colour stops. */
  colors: readonly [string, string, ...string[]];
};

/** Web version of GradientText: the browser clips a CSS gradient to the glyphs. */
export function GradientText({ colors, style, ...rest }: GradientTextProps) {
  // React Native's style types don't know these CSS properties; react-native-web passes them through.
  const gradient = {
    backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
  } as TextStyle;

  return <Text {...rest} style={[style, gradient]} />;
}
