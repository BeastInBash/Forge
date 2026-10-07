/**
 * Signed-in state for the whole app, backed by forge-backend's Better Auth endpoints. The root
 * layout reads `session` to decide whether the tabs or the auth screens are reachable.
 *
 * Successful calls update Better Auth's session store, which re-renders this provider and moves
 * the user across the route guard. Failed calls throw an `Error` with a message ready to show.
 */

import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { authClient } from '@/lib/auth-client';

export type Session = {
  user: { id: string; name: string; email: string; image?: string | null };
};

type SignInInput = { email: string; password: string };
type SignUpInput = SignInInput & { name: string };

type SessionContextValue = {
  session: Session | null;
  /** True until the launch session check settles (or times out); never true again after. */
  isLoading: boolean;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  /** Signs in, or creates the account on first use — Google doesn't distinguish the two. */
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

/** Better Auth error codes, reworded for people. Anything else falls back to the server message. */
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: 'That email and password don’t match.',
  USER_ALREADY_EXISTS: 'An account with this email already exists. Sign in instead.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'An account with this email already exists. Sign in instead.',
  PASSWORD_TOO_SHORT: 'That password is too short.',
  PASSWORD_TOO_LONG: 'That password is too long.',
  INVALID_EMAIL: 'That email doesn’t look right.',
  PROVIDER_NOT_FOUND: 'Google sign-in isn’t set up on the server yet.',
};

type AuthError = { code?: string; message?: string; status: number; statusText: string };

function toError(error: AuthError) {
  if (error.code && MESSAGES[error.code]) return new Error(MESSAGES[error.code]);
  // Status 0 means the request never reached the server.
  if (!error.status) return new Error('Can’t reach Forge right now. Check your connection.');
  return new Error(error.message || error.statusText || 'Something went wrong. Try again.');
}

/** Longest the app waits on the launch session check before showing the signed-out screens. */
const SESSION_CHECK_TIMEOUT_MS = 8000;

/**
 * True once the launch session check has settled, and never false again. Better Auth sets
 * `isPending` back to true at the start of every refetch while signed out, so after a failed
 * check (offline, CORS) the settled value can be overwritten before React renders it. Listening
 * to the store directly sees every change; the timeout covers a request that never returns.
 */
function useSessionChecked() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const atom = authClient.$store.atoms.session;
    const settle = () => setChecked(true);
    if (!atom.get().isPending) settle();
    const unlisten = atom.listen((state) => {
      if (!state.isPending) settle();
    });
    const timeout = setTimeout(settle, SESSION_CHECK_TIMEOUT_MS);
    return () => {
      unlisten();
      clearTimeout(timeout);
    };
  }, []);

  return checked;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const { data } = authClient.useSession();
  const checked = useSessionChecked();

  const value: SessionContextValue = {
    session: data ? { user: data.user } : null,
    isLoading: !checked,
    async signIn({ email, password }) {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) throw toError(error);
    },
    async signUp({ name, email, password }) {
      const { error } = await authClient.signUp.email({ name, email, password });
      if (error) throw toError(error);
    },
    async signInWithGoogle() {
      // Native opens an auth session and returns through forge:// (the Expo plugin turns '/' into
      // a deep link). Web redirects the page, and a relative URL would resolve against the
      // backend, so it gets the app's own origin.
      const callbackURL = Platform.OS === 'web' ? `${window.location.origin}/` : '/';
      const { error } = await authClient.signIn.social({ provider: 'google', callbackURL });
      if (error) throw toError(error);
    },
    async signOut() {
      const { error } = await authClient.signOut();
      if (error) throw toError(error);
    },
  };

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession() {
  const value = use(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
