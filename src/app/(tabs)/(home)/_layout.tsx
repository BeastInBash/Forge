import { Link, Stack } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/text';
import { Radius } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { useStackOptions } from '@/hooks/use-stack-options';
import { useTheme } from '@/hooks/use-theme';

export const unstable_settings = { initialRouteName: 'index' };

export default function HomeLayout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen name="index" options={{ title: 'Forge', headerRight: ProfileButton }} />
      <Stack.Screen name="workout" options={{ title: 'Workout', headerLargeTitle: false }} />
    </Stack>
  );
}

function ProfileButton() {
  const theme = useTheme();
  const { session } = useSession();
  return (
    <Link href="/profile" asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        style={StyleSheet.flatten([styles.avatar, { backgroundColor: theme.text }])}>
        <Text variant="bodyStrong" style={{ color: theme.background }}>
          {session?.user.name.trim().charAt(0).toUpperCase() || '?'}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
