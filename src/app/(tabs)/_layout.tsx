import * as Haptics from 'expo-haptics';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useClay, useTheme } from '@/hooks/use-theme';

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
 * A floating clay tab bar on every platform. The system tab bars can't take clay shadows, so
 * this draws its own: a raised bar, inset from the edges and capped to the content width, with
 * the active tab pressed into it.
 */
export default function TabsLayout() {
  const theme = useTheme();
  const clay = useClay();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  // `Tabs` finds its TabList among its direct children, so the bar can't sit in a wrapper View;
  // its width comes from the window instead.
  const barWidth = Math.min(window.width - Spacing.three * 2, MaxContentWidth);

  return (
    <Tabs style={{ flex: 1, backgroundColor: theme.background }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <View
          style={StyleSheet.flatten([
            styles.bar,
            {
              width: barWidth,
              marginBottom: Math.max(insets.bottom, Spacing.three),
              backgroundColor: theme.surface,
            },
            clay.raised,
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
  const clay = useClay();
  const color = isFocused ? theme.text : theme.textSecondary;

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
          isFocused && { backgroundColor: theme.background, ...clay.sunken },
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
    alignSelf: 'center',
    marginTop: Spacing.two,
    padding: Spacing.one + Spacing.half,
    borderRadius: Radius.large,
    borderCurve: 'continuous',
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.two,
    borderRadius: Radius.medium,
    borderCurve: 'continuous',
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
  label: {
    fontSize: 11,
  },
  labelFocused: {
    fontWeight: '600',
  },
});
