import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { Text } from '@/components/ui/text';
import { FontFamily } from '@/constants/theme';

import { AuthScreen } from './components/auth-screen';
import { GoogleSignIn } from './components/google-sign-in';
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

  const errors = {
    email: emailError(email),
    password: password ? undefined : 'Enter your password.',
  };

  async function submit() {
    if (googleBusy) return;
    setSubmitted(true);
    setFormError(undefined);
    if (errors.email || errors.password) return;
    setLoading(true);
    try {
      await signIn({ email: email.trim(), password });
    } catch (error) {
      setFormError(errorMessage(error));
      setLoading(false);
    }
  }

  return (
    <AuthScreen
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
      {formError && (
        <Text variant="label" color="danger" accessibilityRole="alert">
          {formError}
        </Text>
      )}
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
  link: {
    fontFamily: FontFamily.bodySemiBold,
  },
});
