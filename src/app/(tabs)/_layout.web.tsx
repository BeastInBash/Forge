import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type MaterialName = ComponentProps<typeof Icon>['material'];

/** Web has no native tab bar, so this mirrors the native one as a bottom bar. */
export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs style={{ flex: 1, backgroundColor: theme.background }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <View
          style={StyleSheet.flatten([
            styles.bar,
            { backgroundColor: theme.background, borderTopColor: theme.line },
          ])}>
          <TabTrigger name="(home)" href="/" asChild>
            <TabButton icon="local_fire_department">Today</TabButton>
          </TabTrigger>
          <TabTrigger name="(workouts)" href="/workouts" asChild>
            <TabButton icon="fitness_center">Workouts</TabButton>
          </TabTrigger>
          <TabTrigger name="(nutrition)" href="/nutrition" asChild>
            <TabButton icon="restaurant">Nutrition</TabButton>
          </TabTrigger>
          <TabTrigger name="(profile)" href="/profile" asChild>
            <TabButton icon="person">Profile</TabButton>
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  icon,
  children,
  isFocused,
  ...props
}: TabTriggerSlotProps & { icon: MaterialName }) {
  const theme = useTheme();
  const color = isFocused ? theme.text : theme.textSecondary;

  return (
    <Pressable {...props} style={styles.tab}>
      <Icon ios="circle" material={icon} size={22} color={color} />
      <Text variant="caption" style={{ color }}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
  },
});
