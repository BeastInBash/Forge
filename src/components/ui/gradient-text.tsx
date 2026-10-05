import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { Text, type TextProps } from './text';

export type GradientTextProps = Omit<TextProps, 'color'> & {
  /** Left-to-right colour stops. */
  colors: readonly [string, string, ...string[]];
};

/**
 * Text filled with a horizontal gradient. The text is drawn as a mask over a gradient: the mask
 * copy gives the shape, and an invisible copy inside the gradient sizes it and stays readable to
 * screen readers. Web has its own CSS version in gradient-text.web.tsx.
 */
export function GradientText({ colors, style, ...rest }: GradientTextProps) {
  return (
    <MaskedView
      maskElement={
        <Text {...rest} style={style} accessibilityElementsHidden importantForAccessibility="no" />
      }>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text {...rest} style={[style, styles.hidden]} />
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  hidden: {
    opacity: 0,
  },
});
