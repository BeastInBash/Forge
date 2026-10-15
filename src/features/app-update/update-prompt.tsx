import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';

import { IconBadge } from '@/components/ui/icon-badge';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useSurface, useTheme } from '@/hooks/use-theme';

import { useAppUpdate } from './use-app-update';

/**
 * Dialog offering a newer version from Google Play. "Update" opens Play's own update screen,
 * which installs it and restarts Forge; "Not now" hides it for a day.
 */
export function UpdatePrompt() {
  const theme = useTheme();
  const surface = useSurface();
  const { visible, updating, update, dismiss } = useAppUpdate();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={dismiss}>
      <View style={[styles.scrim, { backgroundColor: theme.scrim }]}>
        <View
          accessibilityViewIsModal
          style={[styles.card, { backgroundColor: theme.surface }, surface.raised]}>
          <IconBadge
            ios="arrow.down.circle"
            material="system_update"
            color={theme.onMint}
            background={theme.mint}
            size={40}
          />
          <View style={styles.copy}>
            <Text variant="title" accessibilityRole="header">
              Update available
            </Text>
            <Text color="textSecondary">
              A new version of Forge is ready on Google Play, with the latest fixes and features.
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={dismiss}
              disabled={updating}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.surface },
                pressed ? surface.sunken : surface.soft,
              ]}>
              <Text variant="bodyStrong">Not now</Text>
            </Pressable>
            <Pressable
              onPress={update}
              disabled={updating}
              accessibilityRole="button"
              accessibilityState={{ busy: updating }}
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: theme.accent },
                surface.accent,
                pressed && styles.pressed,
              ]}>
              {updating ? (
                <ActivityIndicator color={theme.onAccent} />
              ) : (
                <Text variant="bodyStrong" style={{ color: theme.onAccent }}>
                  Update
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
  },
  copy: {
    gap: Spacing.one,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
