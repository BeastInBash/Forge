import { Stack } from 'expo-router';

import { useStackOptions } from '@/hooks/use-stack-options';

export const unstable_settings = { initialRouteName: 'progress' };

export default function ProgressLayout() {
  const stackOptions = useStackOptions();
  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="progress" options={{ title: 'Progress' }} />
      <Stack.Screen name="lift/[exerciseId]" options={{ title: 'Lift', headerLargeTitle: false }} />
      <Stack.Screen
        name="log-lift"
        options={{ title: 'Log a lift', presentation: 'modal', headerLargeTitle: false }}
      />
    </Stack>
  );
}
