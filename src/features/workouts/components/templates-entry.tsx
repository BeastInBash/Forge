import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { PressScale } from '@/components/ui/press-scale';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { SPLIT_TEMPLATES } from '@/features/plans/templates';
import { useSurface, useTheme } from '@/hooks/use-theme';

/** Opens the ready-made splits, naming the ones on offer. */
export function TemplatesEntry({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  const surface = useSurface();
  return (
    <PressScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint="Opens ready-made training splits"
      style={[styles.card, { backgroundColor: theme.mint }, surface.accent]}
      pressedStyle={styles.pressed}>
      <IconBadge
        ios="sparkles"
        material="auto_awesome"
        color={theme.onMint}
        background={theme.surface}
      />
      <View style={styles.text}>
        <Text variant="bodyStrong" style={{ color: theme.onMint }}>
          Start from a ready-made split
        </Text>
        <Text variant="caption" numberOfLines={1} style={{ color: theme.onMint }}>
          {SPLIT_TEMPLATES.map((t) => t.name).join('  ·  ')}
        </Text>
      </View>
      <Icon ios="chevron.right" material="chevron_right" size={16} color={theme.onMint} />
    </PressScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  pressed: {
    opacity: 0.85,
  },
});
