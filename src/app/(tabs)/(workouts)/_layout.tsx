import { Stack } from 'expo-router';

import { useIsAdmin } from '@/features/auth/use-is-admin';
import { useStackOptions } from '@/hooks/use-stack-options';

export const unstable_settings = { initialRouteName: 'workouts' };

export default function WorkoutsLayout() {
  const stackOptions = useStackOptions();
  const isAdmin = useIsAdmin();
  return (
    <Stack screenOptions={stackOptions}>
      <Stack.Screen name="workouts" options={{ title: 'Workouts' }} />
      <Stack.Screen name="exercises" options={{ title: 'Exercise library' }} />
      <Stack.Screen
        name="plan"
        options={{ title: 'Plan', presentation: 'modal', headerLargeTitle: false }}
      />
      {/* Only admins can add to the exercise catalog. */}
      <Stack.Protected guard={isAdmin}>
        <Stack.Screen
          name="add-exercise"
          options={{ title: 'Add exercise', presentation: 'modal', headerLargeTitle: false }}
        />
      </Stack.Protected>
    </Stack>
  );
}
