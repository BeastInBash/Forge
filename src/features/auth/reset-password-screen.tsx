import * as Haptics from 'expo-haptics';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { FontFamily, Spacing } from '@/constants/theme';

import { AuthScreen } from './components/auth-screen';
import { FormError } from './components/form-error';
import { useShake } from './components/motion';
import { SubmitButton } from './components/submit-button';
import { TextField } from './components/text-field';
import { useSession } from './session';
import { errorMessage, MIN_PASSWORD_LENGTH } from './validation';

const CODE_LENGTH = 6;
/** Wait before another code can be sent; the server allows 3 sends a minute. */
const RESEND_COOLDOWN_S = 30;

/**
 * Step two of a password reset: the emailed code plus a new password. On success the user is
 * signed in, and the route guard moves them out of the auth screens.
 */
export function ResetPasswordScreen() {
  const { email = '' } = useLocalSearchParams<{ email: string }>();
  const { requestPasswordReset, resetPassword } = useSession();
  const passwordRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const [resent, setResent] = useState(false);
  const fields = useShake();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const errors = {
    code: code.length === CODE_LENGTH ? undefined : `Enter the ${CODE_LENGTH}-digit code.`,
    password:
      password.length >= MIN_PASSWORD_LENGTH
        ? undefined
        : `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
  };

  async function submit() {
    setSubmitted(true);
    setFormError(undefined);
    if (errors.code || errors.password) return reject();
    setLoading(true);
    try {
      await resetPassword({ email, otp: code, password });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setFormError(errorMessage(e));
      setLoading(false);
      reject();
    }
  }

  async function resend() {
    setFormError(undefined);
    setCooldown(RESEND_COOLDOWN_S);
    try {
      await requestPasswordReset(email);
      setCode('');
      setResent(true);
    } catch (e) {
      setFormError(errorMessage(e));
      setCooldown(0);
    }
  }

  function reject() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    fields.shake();
  }

  return (
    <AuthScreen
      eyebrow="Check your email"
      heading="Choose a new password"
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
        If <Text style={styles.email}>{email}</Text> has a Forge account, we’ve sent it a{' '}
        {CODE_LENGTH}-digit code. It expires in 10 minutes.
      </Text>
      <Animated.View style={[styles.fields, fields.style]}>
        <TextField
          label="Code"
          value={code}
          onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, CODE_LENGTH))}
          error={submitted ? errors.code : undefined}
          placeholder="123456"
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={CODE_LENGTH}
          autoFocus
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          ref={passwordRef}
          label="New password"
          value={password}
          onChangeText={setPassword}
          error={submitted ? errors.password : undefined}
          hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
          secure
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </Animated.View>
      {formError && <FormError message={formError} />}
      <SubmitButton label="Reset password" loading={loading} onPress={submit} />
      <View style={styles.resend}>
        <Text variant="label" color="textSecondary">
          {resent ? 'New code sent.' : 'Didn’t get it?'}
        </Text>
        {cooldown > 0 ? (
          <Text variant="label" color="textSecondary">
            Resend in {cooldown}s
          </Text>
        ) : (
          <Pressable onPress={resend} accessibilityRole="button" hitSlop={8}>
            {({ pressed }) => (
              <Text variant="label" style={[styles.link, pressed && styles.pressed]}>
                Resend code
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: Spacing.three,
  },
  email: {
    fontFamily: FontFamily.bodySemiBold,
  },
  link: {
    fontFamily: FontFamily.bodySemiBold,
  },
  pressed: {
    opacity: 0.5,
  },
  resend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
