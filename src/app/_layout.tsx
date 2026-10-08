// Per-weight entry points, so the bundle carries only these five files rather than every weight.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Roboto_700Bold } from '@expo-google-fonts/roboto/700Bold';
import { Roboto_800ExtraBold } from '@expo-google-fonts/roboto/800ExtraBold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Colors } from '@/constants/theme';
import { SessionProvider, useSession } from '@/features/auth/session';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemePreference } from '@/lib/theme-preference';
import { ThemeColorsProvider } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

const navigationThemes = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: Colors.light.background,
      card: Colors.light.background,
      text: Colors.light.text,
      border: Colors.light.line,
      primary: Colors.light.text,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: Colors.dark.background,
      card: Colors.dark.background,
      text: Colors.dark.text,
      border: Colors.dark.line,
      primary: Colors.dark.text,
    },
  },
};

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  // Loaded at runtime so the app keeps working in Expo Go. In a development or store build,
  // these can move to the `expo-font` config plugin in app.json and be embedded instead.
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Roboto_700Bold,
    Roboto_800ExtraBold,
  });
  // Wait for the saved theme too, so a dark-mode choice doesn't flash light on launch.
  const { loaded: themeLoaded } = useThemePreference();
  const ready = (fontsLoaded || fontError !== null) && themeLoaded;

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeColorsProvider scheme={scheme}>
        <ThemeProvider value={navigationThemes[scheme]}>
          <SessionProvider>
            <RootNavigator />
          </SessionProvider>
        </ThemeProvider>
      </ThemeColorsProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Signed out, only the auth screens are reachable. Signed in, onboarding comes first until it is
 * finished or skipped; after that, only the tabs.
 */
function RootNavigator() {
  const { session, isLoading, onboarded } = useSession();

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  // The splash screen stays up meanwhile, so a signed-in user never sees the login screen flash.
  if (isLoading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={session !== null && onboarded}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={session !== null && !onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={session === null}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
