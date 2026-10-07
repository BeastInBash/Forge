import { Stack } from 'expo-router';

import { useStackOptions } from '@/hooks/use-stack-options';

export const unstable_settings = { initialRouteName: 'workouts' };

export default function WorkoutsLayout() {
  const stackOptions = useStackOptions();
  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="workouts" options={{ title: 'Workouts' }} />
      <Stack.Screen name="exercises" options={{ title: 'Exercise library' }} />
      <Stack.Screen
        name="add-exercise"
        options={{ title: 'Add exercise', presentation: 'modal', headerLargeTitle: false }}
      />
    </Stack>
  );
}
