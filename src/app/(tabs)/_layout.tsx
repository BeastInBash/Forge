import * as Haptics from 'expo-haptics';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconProps = ComponentProps<typeof Icon>;
type TabIcon = { ios: IconProps['ios']; iosSelected: IconProps['ios']; material: IconProps['material'] };

const ICONS = {
  today: { ios: 'flame', iosSelected: 'flame.fill', material: 'local_fire_department' },
  workouts: { ios: 'dumbbell', iosSelected: 'dumbbell.fill', material: 'fitness_center' },
  progress: {
    ios: 'chart.line.uptrend.xyaxis',
    iosSelected: 'chart.line.uptrend.xyaxis',
    material: 'show_chart',
  },
  nutrition: { ios: 'fork.knife', iosSelected: 'fork.knife', material: 'restaurant' },
  profile: { ios: 'person', iosSelected: 'person.fill', material: 'person' },
} satisfies Record<string, TabIcon>;

/**
 * A flat tab bar on every platform: a borderless full-width surface, its tabs capped to the
 * content width, and the active tab marked with a mint tile.
 */
export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  // `Tabs` finds its TabList among its direct children, so the bar can't wrap its tabs in a
  // centred View; side padding caps them to the content width instead.
  const gutter = Math.max(Spacing.two, (window.width - MaxContentWidth) / 2);

  return (
    <Tabs style={{ flex: 1, backgroundColor: theme.background }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <View
          style={StyleSheet.flatten([
            styles.bar,
            {
              paddingHorizontal: gutter,
              paddingBottom: Math.max(insets.bottom, Spacing.two),
              backgroundColor: theme.surface,
            },
          ])}>
          <TabTrigger name="(home)" href="/" asChild>
            <TabButton icon={ICONS.today}>Today</TabButton>
          </TabTrigger>
          <TabTrigger name="(workouts)" href="/workouts" asChild>
            <TabButton icon={ICONS.workouts}>Workouts</TabButton>
          </TabTrigger>
          <TabTrigger name="(progress)" href="/progress" asChild>
            <TabButton icon={ICONS.progress}>Progress</TabButton>
          </TabTrigger>
          <TabTrigger name="(nutrition)" href="/nutrition" asChild>
            <TabButton icon={ICONS.nutrition}>Nutrition</TabButton>
          </TabTrigger>
          <TabTrigger name="(profile)" href="/profile" asChild>
            <TabButton icon={ICONS.profile}>Profile</TabButton>
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
  onPress,
  ...props
}: TabTriggerSlotProps & { icon: TabIcon }) {
  const theme = useTheme();
  const color = isFocused ? theme.onMint : theme.textSecondary;

  return (
    <Pressable
      {...props}
      onPress={(event) => {
        if (!isFocused && Platform.OS !== 'web') Haptics.selectionAsync();
        onPress?.(event);
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) =>
        StyleSheet.flatten([
          styles.tab,
          isFocused && { backgroundColor: theme.mint },
          pressed && !isFocused && styles.pressed,
        ])
      }>
      <Icon
        ios={isFocused ? icon.iosSelected : icon.ios}
        material={icon.material}
        size={22}
        color={color}
      />
      <Text
        variant="caption"
        numberOfLines={1}
        style={[styles.label, { color }, isFocused && styles.labelFocused]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: Spacing.one,
    paddingTop: Spacing.two,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.one + Spacing.half,
    borderRadius: Radius.small,
    borderCurve: 'continuous',
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    fontSize: 11,
  },
  labelFocused: {
    fontWeight: '600',
  },
});
