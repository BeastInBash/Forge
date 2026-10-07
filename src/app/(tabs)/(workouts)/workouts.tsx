import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function WorkoutsScreen() {
  const theme = useTheme();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}>
      <Link href="/exercises" asChild>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.card, { backgroundColor: theme.surface }, pressed && { opacity: 0.85 }]}>
          <View style={[styles.icon, { backgroundColor: theme.background }]}>
            <Icon ios="dumbbell" material="fitness_center" size={20} color={theme.text} />
          </View>
          <View style={styles.text}>
            <Text variant="bodyStrong">Exercise library</Text>
            <Text variant="caption" color="textSecondary">
              Browse exercises and add new ones with images
            </Text>
          </View>
          <Icon ios="chevron.right" material="chevron_right" size={18} color={theme.textSecondary} />
        </Pressable>
      </Link>
      <Text variant="body" color="textSecondary">
        Your weekly split will live here.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.four,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: Radius.small + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: Spacing.half,
  },
});
