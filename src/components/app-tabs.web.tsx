import { Tabs, TabList, TabTrigger, TabSlot, type TabTriggerSlotProps } from 'expo-router/ui';
import { Bot, Home, Map, Package, Users } from 'lucide-react-native';
import { forwardRef, type ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';

/*
 * Web fallback for the native tab bar — a fixed bottom nav that mirrors the
 * web app's mobile BottomNav (same five destinations, lucide icons).
 */

interface TabButtonProps extends TabTriggerSlotProps {
  icon: ComponentType<{ size?: number; color?: string }>;
  label: string;
}

const TabButton = forwardRef<View, TabButtonProps>(function TabButton(
  { icon: Icon, label, isFocused, ...props },
  ref,
) {
  const color = isFocused ? '#171717' : '#737373';
  return (
    <Pressable
      ref={ref}
      {...props}
      className="h-full flex-1 items-center justify-center gap-1 active:opacity-70">
      <Icon size={24} color={color} />
      <Text
        className={`text-[10px] font-sans-medium ${
          isFocused ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'
        }`}>
        {label}
      </Text>
    </Pressable>
  );
});

export default function AppTabs() {
  return (
    <Tabs style={{ flex: 1 }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <View className="h-16 flex-row items-center justify-around border-t border-border bg-background">
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon={Home} label="Home" />
          </TabTrigger>
          <TabTrigger name="trips" href="/trips" asChild>
            <TabButton icon={Map} label="Trips" />
          </TabTrigger>
          <TabTrigger name="ai" href="/ai" asChild>
            <TabButton icon={Bot} label="AI" />
          </TabTrigger>
          <TabTrigger name="gear" href="/gear" asChild>
            <TabButton icon={Package} label="Closet" />
          </TabTrigger>
          <TabTrigger name="social" href="/social" asChild>
            <TabButton icon={Users} label="Social" />
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}
