/** Better Auth's default minimum for email-and-password accounts. */
export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailError(email: string) {
  if (!email.trim()) return 'Enter your email.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'That email doesn’t look right.';
  return undefined;
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Try again.';
}
