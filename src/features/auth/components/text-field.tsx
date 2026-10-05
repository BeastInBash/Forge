import { useState, type Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Shown under the field in the danger colour; replaces `hint`. */
  error?: string;
  hint?: string;
  /** Hides the text and adds a show/hide toggle. */
  secure?: boolean;
  ref?: Ref<TextInput>;
};

export function TextField({ label, error, hint, secure, ref, onFocus, onBlur, ...rest }: Props) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const borderColor = error ? theme.danger : focused ? theme.text : theme.line;

  return (
    <View style={styles.field}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <View style={[styles.box, { backgroundColor: theme.surface, borderColor }]}>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={theme.textSecondary}
          selectionColor={theme.accent}
          cursorColor={theme.text}
          secureTextEntry={secure && !revealed}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: theme.text }]}
          {...rest}
        />
        {secure && (
          <Pressable
            onPress={() => setRevealed((r) => !r)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            hitSlop={8}
            style={styles.reveal}>
            <Icon
              ios={revealed ? 'eye.slash' : 'eye'}
              material={revealed ? 'visibility_off' : 'visibility'}
              size={18}
              color={theme.textSecondary}
            />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="textSecondary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
  box: {
    height: 52,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: Spacing.three,
    fontFamily: FontFamily.body,
    fontSize: 16,
  },
  reveal: {
    paddingHorizontal: Spacing.three,
    height: '100%',
    justifyContent: 'center',
  },
});
