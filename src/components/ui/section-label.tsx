import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconName = Pick<ComponentProps<typeof Icon>, 'ios' | 'material'>;

/**
 * The small uppercase heading over a group of cards, with an optional icon before it and a
 * trailing slot (a total, a count) pushed to the right.
 */
export function SectionLabel({
  icon,
  trailing,
  children,
}: {
  icon?: IconName;
  trailing?: ReactNode;
  children: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {icon && <Icon {...icon} size={14} color={theme.textSecondary} />}
      <Text variant="label" color="textSecondary" numberOfLines={1} style={styles.label}>
        {children.toUpperCase()}
      </Text>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
    paddingHorizontal: Spacing.one,
  },
  label: {
    flex: 1,
    fontSize: 11,
    letterSpacing: 0.8,
  },
});
