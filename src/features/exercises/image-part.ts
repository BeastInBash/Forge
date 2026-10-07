import type { ImagePickerAsset } from 'expo-image-picker';
import { File } from 'expo-file-system';

/**
 * Adds the picked image to a multipart form. Expo's fetch (the global `fetch` in this SDK) can't
 * send React Native's `{ uri, name, type }` parts, but it streams an expo-file-system `File`,
 * which carries its own file name and MIME type.
 */
export async function appendImage(form: FormData, field: string, image: ImagePickerAsset) {
  form.append(field, new File(image.uri) as unknown as Blob);
}
