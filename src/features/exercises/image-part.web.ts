import type { ImagePickerAsset } from 'expo-image-picker';

/** Adds the picked image to a multipart form: the browser `File` the picker returns. */
export async function appendImage(form: FormData, field: string, image: ImagePickerAsset) {
  const file = image.file ?? (await (await fetch(image.uri)).blob());
  form.append(field, file, image.fileName ?? 'exercise.png');
}
