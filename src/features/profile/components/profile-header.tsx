import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { FontFamily, Radius, Spacing, Temper } from '@/constants/theme';
import { useClay, useTheme } from '@/hooks/use-theme';

import { formatMonth, initials } from '../format';

const AVATAR_SIZE = 76;

/** The four tempering colours in order, as a band across the top of the card. */
const TEMPER_BAND = [Temper.push, Temper.pull, Temper.legs, Temper.upper] as const;

type Props = {
  name: string;
  email: string;
  image?: string | null;
  /** Undefined while the profile is still loading. */
  bio?: string | null;
  emailVerified?: boolean;
  createdAt?: string;
};

/** Cast-iron identity card: avatar, name, email, verification and membership, then the bio. */
export function ProfileHeader({ name, email, image, bio, emailVerified, createdAt }: Props) {
  const theme = useTheme();
  const clay = useClay();

  return (
    <View style={[styles.card, { backgroundColor: theme.iron }, clay.iron]}>
      <LinearGradient colors={TEMPER_BAND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.band} />
      <View style={styles.body}>
        <View style={styles.identity}>
          <View style={[styles.avatarRing, { backgroundColor: theme.accent }, clay.accent]}>
            {image ? (
              <Image
                source={image}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
                accessibilityLabel={`${name}'s photo`}
              />
            ) : (
              <View style={[styles.avatar, styles.initials, { backgroundColor: theme.accent }]}>
                <Text style={[styles.initialsText, { color: theme.onAccent }]}>{initials(name)}</Text>
              </View>
            )}
          </View>
          <View style={styles.names}>
            <Text variant="title" numberOfLines={2} style={[styles.name, { color: theme.ironText }]}>
              {name}
            </Text>
            <Text variant="label" numberOfLines={1} style={{ color: theme.ironTextSecondary }}>
              {email}
            </Text>
          </View>
        </View>

        {(emailVerified !== undefined || createdAt) && (
          <View style={styles.chips}>
            {emailVerified !== undefined && (
              <Chip
                icon={
                  emailVerified
                    ? { ios: 'checkmark.seal.fill', material: 'verified' }
                    : { ios: 'exclamationmark.circle', material: 'error' }
                }
                label={emailVerified ? 'Verified email' : 'Email not verified'}
                highlight={emailVerified}
              />
            )}
            {createdAt && (
              <Chip
                icon={{ ios: 'calendar', material: 'calendar_month' }}
                label={`Member since ${formatMonth(createdAt)}`}
              />
            )}
          </View>
        )}

        {bio !== undefined && (
          <View style={[styles.bio, { borderTopColor: theme.ironLine }]}>
            <Text variant="caption" style={[styles.bioLabel, { color: theme.ironTextSecondary }]}>
              BIO
            </Text>
            <Text
              variant="body"
              style={{ color: bio ? theme.ironText : theme.ironTextSecondary, fontStyle: bio ? 'normal' : 'italic' }}>
              {bio || 'No bio yet.'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function Chip({
  icon,
  label,
  highlight = false,
}: {
  icon: Pick<ComponentProps<typeof Icon>, 'ios' | 'material'>;
  label: string;
  highlight?: boolean;
}) {
  const theme = useTheme();
  const clay = useClay();
  const color = highlight ? theme.accent : theme.ironTextSecondary;
  return (
    <View
      style={[
        styles.chip,
        clay.ironSunken,
        { backgroundColor: theme.iron, borderColor: highlight ? theme.accent : 'transparent' },
      ]}>
      <Icon ios={icon.ios} material={icon.material} size={14} color={color} />
      <Text variant="caption" style={{ color: highlight ? theme.ironText : theme.ironTextSecondary }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  band: {
    height: 6,
  },
  body: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatarRing: {
    padding: 4,
    borderRadius: Radius.pill,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  initials: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontFamily: FontFamily.display,
    fontSize: 26,
    lineHeight: 32,
  },
  names: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
  name: {
    fontSize: 28,
    lineHeight: 32,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two + Spacing.half,
    paddingVertical: Spacing.one + Spacing.half,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  bio: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
    gap: Spacing.one,
  },
  bioLabel: {
    letterSpacing: 1.2,
  },
});
