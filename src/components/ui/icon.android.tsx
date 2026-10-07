import type { SymbolViewProps } from 'expo-symbols';
import regular from 'expo-symbols/androidWeights/regular';
import { useFonts } from 'expo-font';
import { StyleSheet, Text, View } from 'react-native';

/**
 * Android version of the Material Symbols icon. expo-symbols' SymbolView leaves the glyph's Text
 * to measure itself, and Android measures it narrower than it draws, clipping the right side.
 * This draws the same font glyph (via its ligature) in a Text with a fixed size instead.
 */
export function Icon({
  material,
  size = 20,
  color,
}: {
  ios: Extract<SymbolViewProps['name'], string>;
  material: NonNullable<Exclude<SymbolViewProps['name'], string>['android']>;
  size?: number;
  color: string;
}) {
  const [loaded] = useFonts({ [regular.name]: regular.font });

  return (
    // The glyph is a ligature word like "visibility"; keep it away from screen readers.
    <View
      style={{ width: size, height: size }}
      accessible={false}
      importantForAccessibility="no-hide-descendants">
      {loaded && (
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={[
            styles.glyph,
            { fontFamily: regular.name, color, fontSize: size, lineHeight: size, width: size, height: size },
          ]}>
          {material}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  glyph: {
    textAlign: 'center',
    includeFontPadding: false,
  },
});
