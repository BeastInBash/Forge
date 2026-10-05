import { Stack } from 'expo-router';

import { useStackOptions } from '@/hooks/use-stack-options';

export const unstable_settings = { initialRouteName: 'workouts' };

export default function WorkoutsLayout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen name="workouts" options={{ title: 'Workouts' }} />
    </Stack>
  );
}
