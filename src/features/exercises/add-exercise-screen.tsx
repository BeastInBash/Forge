import { Image } from 'expo-image';
import type { ImagePickerAsset } from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { reflow } from '@/constants/motion';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { SubmitButton } from '@/features/auth/components/submit-button';
import { TextField } from '@/features/auth/components/text-field';
import { errorMessage } from '@/features/auth/validation';
import { useSurface, useTheme } from '@/hooks/use-theme';

import { createExercise, MAX_IMAGE_BYTES } from './api';
import { LibraryMatches } from './components/library-matches';
import { MusclePicker } from './components/muscle-picker';
import { addToCache } from './exercise-cache';
import { NO_MUSCLES, type MuscleTargets } from './muscles';
import { nameKey } from './search';
import { useExercises } from './use-exercises';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function imageError(image: ImagePickerAsset | undefined) {
  if (!image) return 'Pick an image.';
  if (image.mimeType && !ACCEPTED_TYPES.includes(image.mimeType)) return 'Use a PNG, JPEG or WebP image.';
  if (image.fileSize && image.fileSize > MAX_IMAGE_BYTES) return 'That image is over 4 MB. Pick a smaller one.';
  return undefined;
}

/**
 * Name plus image for a new catalog exercise; uploads in one request and returns to the library.
 * The name doubles as a search of the library, so the admin sees what already exists as they type.
 */
export function AddExerciseScreen() {
  const theme = useTheme();
  const surface = useSurface();
  const router = useRouter();
  // Prefilled when the library search found nothing and the admin tapped "Add …".
  const params = useLocalSearchParams<{ name?: string }>();
  const [name, setName] = useState(params.name ?? '');
  const [image, setImage] = useState<ImagePickerAsset>();
  const [muscles, setMuscles] = useState<MuscleTargets>(NO_MUSCLES);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();
  const { exercises } = useExercises();
  // The backend rejects a name already in the library (409); catch it before the upload.
  const duplicate = !!name.trim() && !!exercises?.some((e) => nameKey(e.exercise_name) === nameKey(name));

  const errors = {
    name: !name.trim()
      ? 'Enter the exercise name.'
      : duplicate
        ? 'This exercise is already in the library.'
        : undefined,
    image: imageError(image),
  };

  async function pickImage() {
    // Loaded on demand: in development Expo Router imports every route at startup, and a build
    // made before expo-image-picker was added would otherwise fail to launch at all.
    let ImagePicker: typeof import('expo-image-picker');
    try {
      ImagePicker = await import('expo-image-picker');
    } catch {
      setFormError('This build can’t pick images yet. Rebuild the app (npx expo run:android).');
      return;
    }
    // No permission prompt is needed for the library picker. Editing stays off: Android's
    // cropper re-encodes to JPEG, which would drop a transparent background.
    // `legacy` (Android only) opens the system file chooser instead of the Photo Picker, which
    // only lists indexed photos and cloud providers; the chooser also reaches local folders
    // such as Downloads and the phone's own gallery app.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 1,
      legacy: true,
    });
    if (!result.canceled) setImage(result.assets[0]);
  }

  async function submit() {
    setSubmitted(true);
    setFormError(undefined);
    if (errors.name || errors.image || !image) return;
    setSaving(true);
    try {
      addToCache(await createExercise(name.trim(), image, muscles));
      router.back();
    } catch (e) {
      setFormError(errorMessage(e));
      setSaving(false);
    }
  }

  const showImageError = submitted || (image && errors.image);

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.fill, { backgroundColor: theme.background }]}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}>
        <TextField
          label="Exercise name"
          value={name}
          onChangeText={setName}
          error={submitted || duplicate ? errors.name : undefined}
          placeholder="e.g. Barbell Back Squat"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={100}
          returnKeyType="done"
        />
        <LibraryMatches query={name} exercises={exercises} />

        {/* Slides down, rather than jumping, as the matches above grow and shrink. */}
        <Animated.View layout={reflow} style={styles.imageSection}>
          <Pressable
            onPress={pickImage}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={image ? 'Change image' : 'Pick an image'}
            style={({ pressed }) => [
              styles.picker,
              {
                backgroundColor: image ? '#FFFFFF' : theme.background,
                borderColor: showImageError && errors.image ? theme.danger : 'transparent',
              },
              image ? surface.raised : surface.sunken,
              pressed && styles.pressed,
            ]}>
            {image ? (
              <>
                <Image source={image.uri} style={StyleSheet.absoluteFill} contentFit="contain" />
                <View style={[styles.change, { backgroundColor: theme.iron }, surface.ironSoft]}>
                  <Icon ios="photo" material="image" size={14} color={theme.ironText} />
                  <Text variant="caption" style={{ color: theme.ironText }}>
                    Change image
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.placeholder}>
                <View style={[styles.placeholderIcon, { backgroundColor: theme.surface }, surface.soft]}>
                  <Icon ios="photo.badge.plus" material="add_photo_alternate" size={28} color={theme.text} />
                </View>
                <Text variant="bodyStrong">Pick an image</Text>
                <Text variant="caption" color="textSecondary" style={styles.hint}>
                  Square PNG with a transparent background, about 1024 × 1024. Max 4 MB.
                </Text>
              </View>
            )}
          </Pressable>
          {showImageError && errors.image ? (
            <Text variant="caption" color="danger">
              {errors.image}
            </Text>
          ) : null}
        </Animated.View>

        <Animated.View layout={reflow}>
          <MusclePicker value={muscles} onChange={setMuscles} disabled={saving} />
        </Animated.View>

        <Animated.View layout={reflow} style={styles.footer}>
          {formError && (
            <Text variant="label" color="danger" accessibilityRole="alert">
              {formError}
            </Text>
          )}
          <SubmitButton label="Add exercise" loading={saving} onPress={submit} />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.screen,
    paddingVertical: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  imageSection: {
    gap: Spacing.three,
  },
  footer: {
    gap: Spacing.three,
  },
  picker: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 1,
    alignSelf: 'center',
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  placeholder: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  placeholderIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  hint: {
    textAlign: 'center',
    maxWidth: 240,
  },
  change: {
    position: 'absolute',
    bottom: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + Spacing.half,
    borderRadius: Radius.pill,
  },
});
