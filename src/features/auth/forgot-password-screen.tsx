import * as Haptics from 'expo-haptics';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { FontFamily } from '@/constants/theme';

import { AuthScreen } from './components/auth-screen';
import { FormError } from './components/form-error';
import { useShake } from './components/motion';
import { SubmitButton } from './components/submit-button';
import { TextField } from './components/text-field';
import { useSession } from './session';
import { emailError, errorMessage } from './validation';

/** Step one of a password reset: ask for the email and send a code to it. */
export function ForgotPasswordScreen() {
  const router = useRouter();
  const { requestPasswordReset } = useSession();
  // Login passes along whatever was already typed, so it needn't be entered twice.
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string>();
  const fields = useShake();

  const error = emailError(email);

  async function submit() {
    setSubmitted(true);
    setFormError(undefined);
    if (error) return reject();
    setLoading(true);
    try {
      const address = email.trim();
      await requestPasswordReset(address);
      router.push({ pathname: '/reset-password', params: { email: address } });
    } catch (e) {
      setFormError(errorMessage(e));
      reject();
    } finally {
      setLoading(false);
    }
  }

  function reject() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    fields.shake();
  }

  return (
    <AuthScreen
      eyebrow="Forgot password"
      heading="Reset your password"
      footer={
        <>
          <Text variant="label" color="textSecondary">
            Remembered it?
          </Text>
          <Link href="/login" dismissTo>
            <Text variant="label" style={styles.link}>
              Sign in
            </Text>
          </Link>
        </>
      }>
      <Text color="textSecondary">
        Enter the email you sign in with and we’ll send you a 6-digit code.
      </Text>
      <Animated.View style={fields.style}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={submitted ? error : undefined}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          keyboardType="email-address"
          autoFocus={!email}
          returnKeyType="send"
          onSubmitEditing={submit}
        />
      </Animated.View>
      {formError && <FormError message={formError} />}
      <SubmitButton label="Send code" loading={loading} onPress={submit} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  link: {
    fontFamily: FontFamily.bodySemiBold,
  },
});
