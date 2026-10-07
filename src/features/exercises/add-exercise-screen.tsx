import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { SubmitButton } from '@/features/auth/components/submit-button';
import { TextField } from '@/features/auth/components/text-field';
import { errorMessage } from '@/features/auth/validation';
import { useTheme } from '@/hooks/use-theme';

import { createExercise, MAX_IMAGE_BYTES } from './api';
import { addToCache } from './exercise-cache';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function imageError(image: ImagePicker.ImagePickerAsset | undefined) {
  if (!image) return 'Pick an image.';
  if (image.mimeType && !ACCEPTED_TYPES.includes(image.mimeType)) return 'Use a PNG, JPEG or WebP image.';
  if (image.fileSize && image.fileSize > MAX_IMAGE_BYTES) return 'That image is over 4 MB. Pick a smaller one.';
  return undefined;
}

/** Name plus image for a new catalog exercise; uploads in one request and returns to the library. */
export function AddExerciseScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset>();
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string>();

  const errors = {
    name: name.trim() ? undefined : 'Enter the exercise name.',
    image: imageError(image),
  };

  async function pickImage() {
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
      addToCache(await createExercise(name.trim(), image));
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
        <Pressable
          onPress={pickImage}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={image ? 'Change image' : 'Pick an image'}
          style={({ pressed }) => [
            styles.picker,
            {
              backgroundColor: image ? '#FFFFFF' : theme.surface,
              borderColor: showImageError && errors.image ? theme.danger : theme.line,
            },
            !image && styles.pickerEmpty,
            pressed && styles.pressed,
          ]}>
          {image ? (
            <>
              <Image source={image.uri} style={StyleSheet.absoluteFill} contentFit="contain" />
              <View style={[styles.change, { backgroundColor: theme.iron }]}>
                <Icon ios="photo" material="image" size={14} color={theme.ironText} />
                <Text variant="caption" style={{ color: theme.ironText }}>
                  Change image
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.placeholder}>
              <View style={[styles.placeholderIcon, { backgroundColor: theme.background }]}>
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

        <TextField
          label="Exercise name"
          value={name}
          onChangeText={setName}
          error={submitted ? errors.name : undefined}
          placeholder="e.g. Barbell Back Squat"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={100}
          returnKeyType="done"
          onSubmitEditing={submit}
        />

        {formError && (
          <Text variant="label" color="danger" accessibilityRole="alert">
            {formError}
          </Text>
        )}
        <SubmitButton label="Add exercise" loading={saving} onPress={submit} />
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
    padding: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  picker: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 1,
    alignSelf: 'center',
    borderRadius: Radius.large,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerEmpty: {
    borderStyle: 'dashed',
    borderWidth: 2,
  },
  pressed: {
    opacity: 0.85,
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
