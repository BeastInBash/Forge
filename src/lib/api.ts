/**
 * The one place the app calls forge-backend's own API (`/api/v1/...`). It adds the session
 * cookie, gives up after a time limit, retries a failed GET once, and signs the user out when the
 * server answers 401. Failures throw an `ApiError` whose message is ready to show.
 */

import { apiURL, authHeaders } from '@/lib/auth-client';

const OFFLINE = 'Can’t reach Forge right now. Check your connection.';
const TIMED_OUT = 'Forge is taking too long to answer. Try again.';
const SIGNED_OUT = 'Your session has ended. Sign in again.';
const FAILED = 'Something went wrong. Try again.';

/** Time limit per attempt. Calls that wait on the AI (meal logging) pass a longer one. */
const TIMEOUT_MS = 15_000;
const RETRY_DELAY_MS = 600;
/** Answers worth one more try: the server or Vercel was briefly unavailable. */
const RETRYABLE_STATUSES = new Set([502, 503, 504]);

export type ApiErrorKind = 'offline' | 'timeout' | 'http';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** HTTP status; 0 when no answer arrived. */
  readonly status: number;

  constructor(message: string, kind: ApiErrorKind, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
}

export type ApiInit = RequestInit & {
  timeoutMs?: number;
  /** Shown when a failed answer carries no message of its own. */
  fallbackMessage?: string;
};

let onUnauthorized: (() => void) | null = null;

/** The session provider registers how to sign out once the server stops accepting the session. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** One attempt, cut off after `timeoutMs`. The caller's own `signal` still cancels it. */
async function attempt(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const cancel = () => controller.abort();
  if (init.signal?.aborted) controller.abort();
  init.signal?.addEventListener('abort', cancel);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw timedOut ? new ApiError(TIMED_OUT, 'timeout') : new ApiError(OFFLINE, 'offline');
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener('abort', cancel);
  }
}

/**
 * Sends a request and returns the response with its parsed body (null for a 304 or a body that
 * isn't JSON). A 304 counts as success, for conditional requests.
 */
export async function apiSend(path: string, init: ApiInit = {}) {
  const { timeoutMs = TIMEOUT_MS, fallbackMessage = FAILED, ...rest } = init;
  const request: RequestInit = {
    ...rest,
    headers: {
      // JSON bodies are strings; FormData sets its own multipart Content-Type.
      ...(typeof rest.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...authHeaders(),
      ...rest.headers,
    },
    credentials: 'include',
  };
  const url = `${apiURL}${path}`;
  // Only GETs are retried: repeating a POST could log the same meal twice.
  const tries = (rest.method ?? 'GET').toUpperCase() === 'GET' ? 2 : 1;

  let response: Response | undefined;
  for (let i = 1; !response; i++) {
    const last = i === tries;
    try {
      response = await attempt(url, request, timeoutMs);
    } catch (error) {
      // A timeout isn't retried: the user has already waited the full limit once.
      if (last || !(error instanceof ApiError) || error.kind !== 'offline') throw error;
      await wait(RETRY_DELAY_MS);
      continue;
    }
    if (!last && RETRYABLE_STATUSES.has(response.status)) {
      response = undefined;
      await wait(RETRY_DELAY_MS);
    }
  }

  const body = response.status === 304 ? null : await response.json().catch(() => null);
  if (response.status === 401) {
    onUnauthorized?.();
    throw new ApiError(SIGNED_OUT, 'http', 401);
  }
  if (!response.ok && response.status !== 304) {
    throw new ApiError(body?.message || fallbackMessage, 'http', response.status);
  }
  return { response, body };
}

/** Sends a request and returns the `data` of forge-backend's `{ data }` answer. */
export async function apiRequest<T>(path: string, init?: ApiInit): Promise<T> {
  const { body } = await apiSend(path, init);
  return body?.data as T;
}
