import { Link, Stack } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/text';
import { Radius } from '@/constants/theme';
import { SAMPLE_USER } from '@/features/home/data';
import { useStackOptions } from '@/hooks/use-stack-options';
import { useTheme } from '@/hooks/use-theme';

export const unstable_settings = { initialRouteName: 'index' };

export default function HomeLayout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen name="index" options={{ title: 'Forge', headerRight: ProfileButton }} />
    </Stack>
  );
}

function ProfileButton() {
  const theme = useTheme();
  return (
    <Link href="/profile" asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        style={StyleSheet.flatten([styles.avatar, { backgroundColor: theme.text }])}>
        <Text variant="bodyStrong" style={{ color: theme.background }}>
          {SAMPLE_USER.name.charAt(0)}
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
