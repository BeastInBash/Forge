import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Radius } from '@/constants/theme';

type IconProps = ComponentProps<typeof Icon>;

/**
 * An icon on a small flat tile: the marker for a card's subject (workout, meal, goal…) and for
 * list rows. `background` is the tile fill, `color` the glyph; pass a border colour for tiles
 * that sit on a fill of the same tone.
 */
export function IconBadge({
  ios,
  material,
  color,
  background,
  border,
  size = 32,
}: {
  ios: IconProps['ios'];
  material: IconProps['material'];
  color: string;
  background: string;
  border?: string;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, backgroundColor: background },
        border !== undefined && { borderWidth: 1, borderColor: border },
      ]}>
      <Icon ios={ios} material={material} size={Math.round(size * 0.56)} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.small,
    borderCurve: 'continuous',
  },
});
