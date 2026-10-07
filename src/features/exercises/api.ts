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

async function send(path: string, init?: RequestInit) {
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
  // A 304 has no body.
  const body = response.status === 304 ? null : await response.json().catch(() => null);
  if (!response.ok && response.status !== 304) {
    throw new Error(body?.message || 'Something went wrong. Try again.');
  }
  return { response, body };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { body } = await send(path, init);
  return body.data;
}

export type CatalogResult = { notModified: true } | { notModified: false; data: Exercise[]; etag?: string };

/**
 * The catalog, as a conditional request: with the `etag` of a cached copy, an unchanged catalog
 * comes back as a bodiless 304 (`notModified`) instead of the full list.
 */
export async function fetchExercises(etag?: string, signal?: AbortSignal): Promise<CatalogResult> {
  const { response, body } = await send('/api/v1/exercise', {
    signal,
    headers: etag ? { 'If-None-Match': etag } : undefined,
    // Our own cache does the revalidation; keep the browser's HTTP cache out of it.
    cache: 'no-store',
  });
  if (response.status === 304) return { notModified: true };
  return { notModified: false, data: body.data, etag: response.headers.get('etag') ?? undefined };
}

/** Sends the name and picked image as one multipart request; the backend uploads to Cloudinary. */
export async function createExercise(name: string, image: ImagePickerAsset) {
  const form = new FormData();
  form.append('exercise_name', name);
  await appendImage(form, 'image', image);
  // No Content-Type header: fetch sets the multipart boundary.
  return request<Exercise>('/api/v1/exercise', { method: 'POST', body: form });
}
