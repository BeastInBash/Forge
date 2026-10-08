import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** "↑ 4.5%" in green, "↓ 2%" in red, "→ 0%" in grey. */
export function TrendBadge({ change, suffix }: { change: number; suffix?: string }) {
  const theme = useTheme();
  const rounded = Math.round(Math.abs(change) * 10) / 10;
  const direction = rounded === 0 ? 'flat' : change > 0 ? 'up' : 'down';
  const color =
    direction === 'up' ? theme.up : direction === 'down' ? theme.danger : theme.textSecondary;

  return (
    <View
      style={[styles.badge, { backgroundColor: theme.background }]}
      accessibilityLabel={`${direction === 'down' ? 'Down' : 'Up'} ${rounded} percent${suffix ? ` ${suffix}` : ''}`}>
      <Icon
        ios={
          direction === 'up'
            ? 'arrow.up.right'
            : direction === 'down'
              ? 'arrow.down.right'
              : 'arrow.right'
        }
        material={
          direction === 'up'
            ? 'trending_up'
            : direction === 'down'
              ? 'trending_down'
              : 'trending_flat'
        }
        size={14}
        color={color}
      />
      <Text variant="caption" style={[styles.text, { color }]}>
        {rounded}%{suffix ? ` ${suffix}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
  text: {
    fontFamily: FontFamily.bodySemiBold,
  },
});
