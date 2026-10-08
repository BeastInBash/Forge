import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { CSS_EASE_OUT } from '@/constants/motion';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  /** Styles the visual surface — the part that scales. */
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * A pressable whose surface dips to 97% on press-in and springs back on release. The Pressable
 * itself never scales, so the touch target stays put under the finger.
 */
export function PressScale({ style, children, ...rest }: Props) {
  return (
    <Pressable pressRetentionOffset={16} {...rest}>
      {({ pressed }) => (
        <Animated.View
          style={[
            style,
            {
              transform: [{ scale: pressed ? 0.97 : 1 }],
              transitionProperty: 'transform',
              transitionDuration: pressed ? 100 : 160,
              transitionTimingFunction: CSS_EASE_OUT,
            },
          ]}>
          {children}
        </Animated.View>
      )}
    </Pressable>
  );
}
