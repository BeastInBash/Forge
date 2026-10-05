import { SymbolView, type SymbolViewProps } from 'expo-symbols';

/**
 * Cross-platform icon: SF Symbols on iOS, Material Symbols on Android and web.
 * Pass both names so every platform gets its native glyph.
 */
export function Icon({
  ios,
  material,
  size = 20,
  color,
}: {
  ios: Extract<SymbolViewProps['name'], string>;
  material: NonNullable<Exclude<SymbolViewProps['name'], string>['android']>;
  size?: number;
  color: string;
}) {
  return (
    <SymbolView name={{ ios, android: material, web: material }} size={size} tintColor={color} />
  );
}
