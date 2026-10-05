import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { errorMessage } from '@/features/auth/validation';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const theme = useTheme();
  const { session, signOut } = useSession();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSignOut() {
    setSigningOut(true);
    setError(undefined);
    try {
      await signOut();
    } catch (e) {
      setError(errorMessage(e));
      setSigningOut(false);
    }
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      {session && (
        <Text variant="label" color="textSecondary">
          Signed in as {session.user.email}
        </Text>
      )}
      <Text variant="body" color="textSecondary">
        Your account, goals and settings will live here.
      </Text>
      {error && (
        <Text variant="label" color="danger" accessibilityRole="alert">
          {error}
        </Text>
      )}
      <Pressable
        onPress={handleSignOut}
        disabled={signingOut}
        accessibilityRole="button"
        accessibilityState={{ busy: signingOut }}
        style={({ pressed }) => [
          styles.signOut,
          { borderColor: theme.line },
          pressed && { backgroundColor: theme.line },
        ]}>
        {signingOut ? (
          <ActivityIndicator color={theme.danger} />
        ) : (
          <Text variant="bodyStrong" color="danger">
            Sign out
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  signOut: {
    height: 52,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
