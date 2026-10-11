import { Image } from 'expo-image';
import { openBrowserAsync } from 'expo-web-browser';
import { useState, type ComponentProps } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { apiURL } from '@/lib/auth-client';
import { useSession } from '@/features/auth/session';
import { errorMessage } from '@/features/auth/validation';
import { useSurface, useTheme } from '@/hooks/use-theme';

import type { Profile } from './api';
import { AppearanceSection } from './components/appearance-section';
import { ProfileHeader } from './components/profile-header';
import { Badge, Row, Section } from './components/section';
import { daysSince, describeDevice, formatDate, formatDateTime, providerLabel, timeAgo } from './format';
import { useProfile } from './use-profile';

const numberFormat = new Intl.NumberFormat();

const privacyPolicyURL = `${apiURL}/privacy`;

const deleteWarning =
  'This permanently deletes your account, workout plans, lift logs and meals. It can’t be undone.';

/** Asks before deleting; resolves true when the user confirms. */
function confirmDelete(): Promise<boolean> {
  if (process.env.EXPO_OS === 'web') {
    return Promise.resolve(window.confirm(`Delete your account?\n\n${deleteWarning}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      'Delete your account?',
      deleteWarning,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export function ProfileScreen() {
  const theme = useTheme();
  const surface = useSurface();
  const { session, signOut, deleteAccount } = useSession();
  const { profile, error, loading, refreshing, refresh } = useProfile();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string>();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();

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

  async function handleDelete() {
    if (!(await confirmDelete())) return;
    setDeleting(true);
    setDeleteError(undefined);
    try {
      // On success the route guard moves to the sign-in screen and this screen unmounts.
      await deleteAccount();
    } catch (e) {
      setDeleteError(errorMessage(e));
      setDeleting(false);
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
        <View style={[styles.errorCard, { backgroundColor: theme.surface }, surface.raised]}>
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
              pressed ? surface.sunken : surface.soft,
            ]}>
            {refreshing ? <ActivityIndicator color={theme.text} /> : <Text variant="label">Try again</Text>}
          </Pressable>
        </View>
      )}

      {profile && <ProfileDetails profile={profile} />}

      <AppearanceSection />

      <Section title="Legal">
        <Pressable
          onPress={() => openBrowserAsync(privacyPolicyURL)}
          accessibilityRole="link"
          style={({ pressed }) => pressed && styles.pressed}>
          <Row
            first
            icon={<Icon ios="hand.raised.fill" material="privacy_tip" size={18} color={theme.text} />}
            title="Privacy policy"
            trailing={<Icon ios="arrow.up.right" material="open_in_new" size={16} color={theme.textSecondary} />}
          />
        </Pressable>
      </Section>

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
            pressed ? surface.sunken : surface.soft,
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

      <View style={styles.signOutBlock}>
        {deleteError && (
          <Text variant="label" color="danger" accessibilityRole="alert">
            {deleteError}
          </Text>
        )}
        <Pressable
          onPress={handleDelete}
          disabled={deleting || signingOut}
          accessibilityRole="button"
          accessibilityState={{ busy: deleting }}
          style={({ pressed }) => [styles.deleteAccount, pressed && styles.pressed]}>
          {deleting ? (
            <ActivityIndicator color={theme.danger} />
          ) : (
            <>
              <Icon ios="trash" material="delete" size={16} color={theme.danger} />
              <Text variant="label" color="danger">
                Delete account
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
        <StatTile
          icon={{ ios: 'list.clipboard', material: 'assignment' }}
          value={profile.stats.workoutPlans}
          label={profile.stats.workoutPlans === 1 ? 'Workout plan' : 'Workout plans'}
        />
        <StatTile
          icon={{ ios: 'dumbbell', material: 'fitness_center' }}
          value={profile.stats.exercisesCreated}
          label="Exercises added"
        />
        <StatTile
          icon={{ ios: 'calendar', material: 'calendar_month' }}
          value={daysSince(profile.createdAt)}
          label="Days on Forge"
        />
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

function StatTile({
  icon,
  value,
  label,
}: {
  icon: Pick<ComponentProps<typeof Icon>, 'ios' | 'material'>;
  value: number;
  label: string;
}) {
  const theme = useTheme();
  const surface = useSurface();
  return (
    <View style={[styles.stat, { backgroundColor: theme.surface }, surface.raised]}>
      <Icon {...icon} size={18} color={theme.textSecondary} />
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
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: Spacing.one,
  },
  providerLogo: {
    width: 18,
    height: 18,
  },
  signOutBlock: {
    gap: Spacing.two,
  },
  deleteAccount: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
  signOut: {
    minHeight: 52,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
