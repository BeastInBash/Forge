import type { ImagePickerAsset } from 'expo-image-picker';
import { PixelRatio } from 'react-native';

import { apiURL, authHeaders } from '@/lib/auth-client';

import { appendImage } from './image-part';

/** One catalog entry from `GET /api/v1/exercise`. */
export type Exercise = {
  id: string;
  exercise_name: string;
  /** Cloudinary URL of the original image; see `thumbnailUrl`. */
  exercise_icon: string | null;
  exercise_video: string | null;
};

/** forge-backend's upload limit (Vercel caps request bodies at 4.5 MB). */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/**
 * A square, device-sized copy of a Cloudinary image. `f_auto` lets Cloudinary pick AVIF/WebP for
 * the device, so a 56 pt thumbnail is a few KB instead of the 1–2 MB PNG original. Other URLs
 * are returned unchanged.
 */
export function thumbnailUrl(url: string, sizePt: number) {
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  const px = Math.round(PixelRatio.getPixelSizeForLayoutSize(sizePt));
  return url.replace('/upload/', `/upload/c_fill,w_${px},h_${px},f_auto,q_auto/`);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiURL}${path}`, {
      ...init,
      headers: { ...authHeaders(), ...init?.headers },
      credentials: 'include',
    });
  } catch (error) {
    if (init?.signal?.aborted) throw error;
    throw new Error('Can’t reach Forge right now. Check your connection.');
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || 'Something went wrong. Try again.');
  return body.data;
}

export const fetchExercises = (signal?: AbortSignal) => request<Exercise[]>('/api/v1/exercise', { signal });

/** Sends the name and picked image as one multipart request; the backend uploads to Cloudinary. */
export async function createExercise(name: string, image: ImagePickerAsset) {
  const form = new FormData();
  form.append('exercise_name', name);
  await appendImage(form, 'image', image);
  // No Content-Type header: fetch sets the multipart boundary.
  return request<Exercise>('/api/v1/exercise', { method: 'POST', body: form });
}
