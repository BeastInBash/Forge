import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** A titled surface card holding a list of `Row`s separated by hairlines. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text variant="label" color="textSecondary" style={styles.title}>
        {title.toUpperCase()}
      </Text>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>{children}</View>
    </View>
  );
}

type RowProps = {
  /** Leading glyph, drawn on a small tile. */
  icon: ReactNode;
  title: string;
  /** Second line, in the secondary colour. */
  detail?: string;
  /** Right-hand slot for a badge or short value. */
  trailing?: ReactNode;
  /** Hides the hairline above the row; set on the first row of a section. */
  first?: boolean;
  selectable?: boolean;
  mono?: boolean;
};

export function Row({ icon, title, detail, trailing, first = false, selectable, mono }: RowProps) {
  const theme = useTheme();
  return (
    <View style={[styles.row, !first && { borderTopColor: theme.line, borderTopWidth: StyleSheet.hairlineWidth }]}>
      <View style={[styles.iconTile, { backgroundColor: theme.background }]}>{icon}</View>
      <View style={styles.text}>
        <Text variant="bodyStrong" numberOfLines={2} selectable={selectable} style={mono && styles.mono}>
          {title}
        </Text>
        {detail ? (
          <Text variant="caption" color="textSecondary" numberOfLines={2}>
            {detail}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

/** Small pill for the trailing slot of a row. */
export function Badge({ label, tone = 'muted' }: { label: string; tone?: 'accent' | 'muted' }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.badge,
        tone === 'accent' ? { backgroundColor: theme.accent } : { borderColor: theme.line, borderWidth: 1 },
      ]}>
      <Text variant="caption" style={{ color: tone === 'accent' ? theme.onAccent : theme.textSecondary }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  title: {
    paddingHorizontal: Spacing.one,
    letterSpacing: 1.2,
    fontSize: 12,
  },
  card: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: Radius.small + 4,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  mono: {
    fontFamily: Fonts.mono,
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half + 1,
    borderRadius: Radius.pill,
  },
});
