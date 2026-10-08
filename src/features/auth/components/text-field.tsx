import { useState, type Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { CSS_EASE_OUT } from '@/constants/motion';
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

/** Focus moves between fields tens of times a session, so its colour change stays short. */
const FOCUS = {
    transitionDuration: 150,
    transitionTimingFunction: CSS_EASE_OUT,
} as const;

export function TextField({ label, error, hint, secure, ref, onFocus, onBlur, ...rest }: Props) {
    const theme = useTheme();
    const [focused, setFocused] = useState(false);
    const [revealed, setRevealed] = useState(false);

    const tone = error ? theme.danger : theme.accent;
    const borderColor = error ? theme.danger : focused ? theme.accent : theme.line;

    return (
        <View style={styles.field}>
            <Text variant="label" color={focused ? 'text' : 'textSecondary'}>
                {label}
            </Text>
            <View>
                {/* A soft halo outside the border; only its opacity animates. */}
                <Animated.View
                    style={[
                        styles.ring,
                        FOCUS,
                        {
                            borderColor: tone,
                            opacity: focused ? 0.28 : 0,
                            transitionProperty: 'opacity',
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.box,
                        FOCUS,
                        {
                            backgroundColor: theme.surface,
                            borderColor,
                            transitionProperty: 'borderColor',
                        },
                    ]}>
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
                            style={({ pressed }) => [
                                styles.reveal,
                                pressed && styles.revealPressed,
                            ]}>
                            <Icon
                                ios={revealed ? 'eye.slash' : 'eye'}
                                material={revealed ? 'visibility_off' : 'visibility'}
                                size={18}
                                color={theme.textSecondary}
                            />
                        </Pressable>
                    )}
                </Animated.View>
            </View>
            {error ? (
                <Animated.View key={error} entering={FadeIn.duration(160)}>
                    <Text variant="caption" color="danger" accessibilityRole="alert">
                        {error}
                    </Text>
                </Animated.View>
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
        gap: Spacing.one + Spacing.half,
    },
    ring: {
        pointerEvents: 'none',
        position: 'absolute',
        top: -3,
        right: -3,
        bottom: -3,
        left: -3,
        borderWidth: 3,
        borderRadius: Radius.medium + 3,
        borderCurve: 'continuous',
    },
    box: {
        // A minimum rather than a fixed height, so large system font sizes don't clip the text.
        minHeight: 52,
        borderRadius: Radius.medium,
        borderCurve: 'continuous',
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'stretch',
        overflow: 'hidden',
    },
    input: {
        flex: 1,
        // Without this an <input> on web keeps its intrinsic width (~20ch) and pushes the
        // reveal button out of the box on narrow screens.
        minWidth: 0,
        paddingHorizontal: Spacing.three,
        paddingVertical: Spacing.two,
        fontFamily: FontFamily.body,
        fontSize: 16,
    },
    reveal: {
        flexShrink: 0,
        paddingHorizontal: Spacing.three,
        justifyContent: 'center',
    },
    revealPressed: {
        opacity: 0.5,
    },
});
