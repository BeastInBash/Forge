import { useSession } from './session';

/**
 * Users who may add exercises to the catalog. forge-backend enforces the same list (its
 * ADMIN_EMAILS setting); this copy only decides what the app shows.
 */
const ADMIN_EMAILS = ['mohammadsaif0847@gmail.com'];

export function useIsAdmin() {
  const { session } = useSession();
  const email = session?.user.email.toLowerCase();
  return email !== undefined && ADMIN_EMAILS.includes(email);
}
