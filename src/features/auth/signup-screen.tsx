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
import { emailError, errorMessage, MIN_PASSWORD_LENGTH } from './validation';

export function SignupScreen() {
  const { signUp } = useSession();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [formError, setFormError] = useState<string>();

  const errors = {
    name: name.trim() ? undefined : 'Enter your name.',
    email: emailError(email),
    password:
      password.length >= MIN_PASSWORD_LENGTH
        ? undefined
        : `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
  };

  async function submit() {
    if (googleBusy) return;
    setSubmitted(true);
    setFormError(undefined);
    if (errors.name || errors.email || errors.password) return;
    setLoading(true);
    try {
      await signUp({ name: name.trim(), email: email.trim(), password });
    } catch (error) {
      setFormError(errorMessage(error));
      setLoading(false);
    }
  }

  return (
    <AuthScreen
      eyebrow="Start forging"
      heading="Create your account"
      footer={
        <>
          <Text variant="label" color="textSecondary">
            Already have an account?
          </Text>
          <Link href="/login" dismissTo>
            <Text variant="label" style={styles.link}>
              Sign in
            </Text>
          </Link>
        </>
      }>
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        error={submitted ? errors.name : undefined}
        placeholder="What should we call you?"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <TextField
        ref={emailRef}
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
        hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      {formError && (
        <Text variant="label" color="danger" accessibilityRole="alert">
          {formError}
        </Text>
      )}
      <SubmitButton label="Create account" loading={loading} disabled={googleBusy} onPress={submit} />
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
