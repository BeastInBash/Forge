import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { errorMessage } from '@/features/auth/validation';
import { useClay, useTheme } from '@/hooks/use-theme';

import type { Profile } from './api';
import { AppearanceSection } from './components/appearance-section';
import { ProfileHeader } from './components/profile-header';
import { Badge, Row, Section } from './components/section';
import { daysSince, describeDevice, formatDate, formatDateTime, providerLabel, timeAgo } from './format';
import { useProfile } from './use-profile';

const numberFormat = new Intl.NumberFormat();

export function ProfileScreen() {
  const theme = useTheme();
  const clay = useClay();
  const { session, signOut } = useSession();
  const { profile, error, loading, refreshing, refresh } = useProfile();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string>();

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutError(undefined);
    try {
      await signOut();
    } catch (e) {
      setSignOutError(errorMessage(e));
      setSigningOut(false);
    }
  }

  // The session already has name, email and photo, so the header shows straight away.
  const user = profile ?? session?.user;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.textSecondary} />}>
      {user && (
        <ProfileHeader
          name={user.name}
          email={user.email}
          image={user.image}
          bio={profile?.bio}
          emailVerified={profile?.emailVerified}
          createdAt={profile?.createdAt}
        />
      )}

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.textSecondary} />
        </View>
      )}

      {error && !profile && (
        <View style={[styles.errorCard, { backgroundColor: theme.surface }, clay.raised]}>
          <Text variant="bodyStrong">Couldn’t load your details</Text>
          <Text variant="label" color="textSecondary">
            {error}
          </Text>
          <Pressable
            onPress={refresh}
            disabled={refreshing}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.retry,
              { backgroundColor: theme.surface },
              pressed ? clay.sunken : clay.soft,
            ]}>
            {refreshing ? <ActivityIndicator color={theme.text} /> : <Text variant="label">Try again</Text>}
          </Pressable>
        </View>
      )}

      {profile && <ProfileDetails profile={profile} />}

      <AppearanceSection />

      <View style={styles.signOutBlock}>
        {signOutError && (
          <Text variant="label" color="danger" accessibilityRole="alert">
            {signOutError}
          </Text>
        )}
        <Pressable
          onPress={handleSignOut}
          disabled={signingOut}
          accessibilityRole="button"
          accessibilityState={{ busy: signingOut }}
          style={({ pressed }) => [
            styles.signOut,
            { backgroundColor: theme.surface },
            pressed ? clay.sunken : clay.soft,
          ]}>
          {signingOut ? (
            <ActivityIndicator color={theme.danger} />
          ) : (
            <>
              <Icon ios="rectangle.portrait.and.arrow.right" material="logout" size={18} color={theme.danger} />
              <Text variant="bodyStrong" color="danger">
                Sign out
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ProfileDetails({ profile }: { profile: Profile }) {
  const theme = useTheme();

  return (
    <>
      <View style={styles.stats}>
        <StatTile value={profile.stats.workoutPlans} label={profile.stats.workoutPlans === 1 ? 'Workout plan' : 'Workout plans'} />
        <StatTile value={profile.stats.exercisesCreated} label="Exercises added" />
        <StatTile value={daysSince(profile.createdAt)} label="Days on Forge" />
      </View>

      <Section title="Sign-in methods">
        {profile.accounts.map((account, i) => (
          <Row
            key={account.providerId}
            first={i === 0}
            icon={
              account.providerId === 'google' ? (
                <Image source={require('@/assets/images/google-g.png')} style={styles.providerLogo} />
              ) : (
                <Icon ios="lock.fill" material="lock" size={18} color={theme.text} />
              )
            }
            title={providerLabel(account.providerId)}
            detail={`Linked ${formatDate(account.createdAt)}`}
          />
        ))}
      </Section>

      <Section title={`Active sessions · ${profile.sessions.length}`}>
        {profile.sessions.map((s, i) => {
          const device = describeDevice(s.userAgent);
          const where = [s.ipAddress, `Signed in ${formatDate(s.createdAt)}`].filter(Boolean).join(' · ');
          return (
            <Row
              key={`${s.createdAt}-${i}`}
              first={i === 0}
              icon={
                device.mobile ? (
                  <Icon ios="iphone" material="smartphone" size={18} color={theme.text} />
                ) : (
                  <Icon ios="laptopcomputer" material="laptop" size={18} color={theme.text} />
                )
              }
              title={device.label}
              detail={where}
              trailing={
                s.current ? <Badge label="This device" tone="accent" /> : <Badge label={timeAgo(s.updatedAt)} />
              }
            />
          );
        })}
      </Section>

      <Section title="Account">
        <Row
          first
          icon={<Icon ios="envelope.fill" material="mail" size={18} color={theme.text} />}
          title={profile.email}
          detail="Email"
          selectable
          trailing={<Badge label={profile.emailVerified ? 'Verified' : 'Unverified'} tone={profile.emailVerified ? 'accent' : 'muted'} />}
        />
        <Row
          icon={<Icon ios="person.text.rectangle" material="badge" size={18} color={theme.text} />}
          title={profile.id}
          detail="User ID"
          selectable
          mono
        />
        <Row
          icon={<Icon ios="calendar.badge.plus" material="event" size={18} color={theme.text} />}
          title={formatDateTime(profile.createdAt)}
          detail="Joined"
        />
        <Row
          icon={<Icon ios="clock.arrow.circlepath" material="update" size={18} color={theme.text} />}
          title={formatDateTime(profile.updatedAt)}
          detail="Last updated"
        />
      </Section>
    </>
  );
}

function StatTile({ value, label }: { value: number; label: string }) {
  const theme = useTheme();
  const clay = useClay();
  return (
    <View style={[styles.stat, { backgroundColor: theme.surface }, clay.raised]}>
      <Text variant="display" numberOfLines={1} adjustsFontSizeToFit>
        {numberFormat.format(value)}
      </Text>
      <Text variant="caption" color="textSecondary" numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
    gap: Spacing.four,
  },
  loading: {
    paddingVertical: Spacing.five,
    alignItems: 'center',
  },
  errorCard: {
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  retry: {
    alignSelf: 'flex-start',
    marginTop: Spacing.two,
    minHeight: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  stat: {
    flex: 1,
    minWidth: 0,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: Spacing.half,
  },
  providerLogo: {
    width: 18,
    height: 18,
  },
  signOutBlock: {
    gap: Spacing.two,
  },
  signOut: {
    minHeight: 52,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
