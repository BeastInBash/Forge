import { Stack } from 'expo-router';

import { useStackOptions } from '@/hooks/use-stack-options';

export const unstable_settings = { initialRouteName: 'nutrition' };

export default function NutritionLayout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen name="nutrition" options={{ title: 'Nutrition' }} />
      <Stack.Screen name="meal/[mealId]" options={{ title: 'Meal', headerLargeTitle: false }} />
      <Stack.Screen
        name="log-meal"
        options={{ title: 'Log a meal', presentation: 'modal', headerLargeTitle: false }}
      />
    </Stack>
  );
}
