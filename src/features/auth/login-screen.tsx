import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import Animated from 'react-native-reanimated';

import { Text } from '@/components/ui/text';
import { FontFamily, Spacing } from '@/constants/theme';

import { AuthScreen } from './components/auth-screen';
import { FormError } from './components/form-error';
import { GoogleSignIn } from './components/google-sign-in';
import { useShake } from './components/motion';
import { SubmitButton } from './components/submit-button';
import { TextField } from './components/text-field';
import { useSession } from './session';
import { emailError, errorMessage } from './validation';

export function LoginScreen() {
  const { signIn } = useSession();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Field errors appear only after the first submit, so nothing turns red while typing.
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [formError, setFormError] = useState<string>();
  const fields = useShake();

  const errors = {
    email: emailError(email),
    password: password ? undefined : 'Enter your password.',
  };

  async function submit() {
    if (googleBusy) return;
    setSubmitted(true);
    setFormError(undefined);
    if (errors.email || errors.password) return reject();
    setLoading(true);
    try {
      await signIn({ email: email.trim(), password });
    } catch (error) {
      setFormError(errorMessage(error));
      setLoading(false);
      reject();
    }
  }

  /** The haptic and the shake land on the same frame the errors appear. */
  function reject() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    fields.shake();
  }

  return (
    <AuthScreen
      animateIn
      eyebrow="Welcome back"
      heading="Sign in to keep training"
      footer={
        <>
          <Text variant="label" color="textSecondary">
            New to Forge?
          </Text>
          <Link href="/signup" push>
            <Text variant="label" style={styles.link}>
              Create an account
            </Text>
          </Link>
        </>
      }>
      <Animated.View style={[styles.fields, fields.style]}>
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={submitted ? errors.email : undefined}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          keyboardType="email-address"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          ref={passwordRef}
          label="Password"
          value={password}
          onChangeText={setPassword}
          error={submitted ? errors.password : undefined}
          secure
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
      </Animated.View>
      {formError && <FormError message={formError} />}
      <SubmitButton label="Sign in" loading={loading} disabled={googleBusy} onPress={submit} />
      <GoogleSignIn
        disabled={loading}
        onBusyChange={(busy) => {
          setGoogleBusy(busy);
          if (busy) setFormError(undefined);
        }}
        onError={setFormError}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: Spacing.three,
  },
  link: {
    fontFamily: FontFamily.bodySemiBold,
  },
});
