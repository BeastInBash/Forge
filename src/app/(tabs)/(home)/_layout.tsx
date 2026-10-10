import { Image } from 'expo-image';
import { Link, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { useStackOptions } from '@/hooks/use-stack-options';
import { useTheme } from '@/hooks/use-theme';

export const unstable_settings = { initialRouteName: 'index' };

export default function HomeLayout() {
  return (
    <Stack screenOptions={useStackOptions()}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Forge',
          // A large title can't hold an image, so Home uses the inline title with the app icon.
          headerLargeTitle: false,
          headerTitle: BrandTitle,
          headerTitleAlign: 'left',
          headerRight: ProfileButton,
        }}
      />
      <Stack.Screen name="workout" options={{ title: 'Workout', headerLargeTitle: false }} />
      <Stack.Screen
        name="calculator"
        options={{ title: 'BMI & calories', headerLargeTitle: false }}
      />
    </Stack>
  );
}

/** The app icon in a small circle, then the wordmark. */
function BrandTitle() {
  const theme = useTheme();
  return (
    <View style={styles.brand} accessibilityRole="header" accessibilityLabel="Forge">
      <Image
        source={require('@/assets/images/icon.png')}
        style={[styles.brandIcon, { borderColor: theme.line }]}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      <Text variant="title" style={styles.brandName}>
        Forge
      </Text>
    </View>
  );
}

/** The user's photo, or the first letter of their name when there's no photo or it fails to load. */
function ProfileButton() {
  const theme = useTheme();
  const { session } = useSession();
  const image = session?.user.image;
  const [failedImage, setFailedImage] = useState<string>();
  const showImage = !!image && image !== failedImage;
  return (
    <Link href="/profile" asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        style={StyleSheet.flatten([styles.avatar, { backgroundColor: theme.text }])}>
        {showImage ? (
          <Image
            source={image}
            style={styles.photo}
            contentFit="cover"
            transition={150}
            cachePolicy="memory-disk"
            onError={() => setFailedImage(image)}
          />
        ) : (
          <Text variant="bodyStrong" style={{ color: theme.background }}>
            {session?.user.name.trim().charAt(0).toUpperCase() || '?'}
          </Text>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  brandName: {
    fontSize: 22,
    lineHeight: 28,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
});
