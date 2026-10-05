import { ScrollView, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';

/** Stand-in body for tabs whose screens haven't been designed yet. */
export function TabPlaceholder({ message }: { message: string }) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Text variant="body" color="textSecondary">
        {message}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
  },
});
