import { Stack } from 'expo-router';

import { useStackOptions } from '@/hooks/use-stack-options';

export const unstable_settings = { initialRouteName: 'profile' };

export default function ProfileLayout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
    </Stack>
  );
}
