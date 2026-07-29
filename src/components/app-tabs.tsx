import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'nativewind';

import { Colors } from '@/constants/theme';

/*
 * Native iOS tab bar mirroring the web's mobile BottomNav exactly:
 * Home · Trips · AI (center) · Closet · Social. SF Symbols keep it native;
 * the web build swaps in app-tabs.web.tsx with lucide icons.
 */
export default function AppTabs() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="trips">
        <Label>Trips</Label>
        <Icon sf={{ default: 'map', selected: 'map.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="ai">
        <Label>AI</Label>
        <Icon sf="sparkles" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="gear">
        <Label>Closet</Label>
        <Icon sf="backpack" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="social">
        <Label>Social</Label>
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
