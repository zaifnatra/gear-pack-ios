import { Pressable, ScrollView, Text, View } from 'react-native';

export interface UnderlineTab {
  key: string;
  label: string;
  count?: number;
}

/*
 * The web's tab pattern (Social Hub, trip detail): text tabs on a hairline
 * with an emerald underline + count pills.
 */
export function UnderlineTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: UnderlineTab[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <View className="border-b border-border">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              onPress={() => onChange(tab.key)}
              className={`flex-row items-center gap-2 border-b-2 px-4 py-2.5 ${
                isActive ? 'border-emerald-600' : 'border-transparent'
              }`}>
              <Text
                className={`font-sans-medium text-sm ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}>
                {tab.label}
              </Text>
              {tab.count !== undefined && tab.count > 0 ? (
                <View className="rounded-full bg-neutral-100 px-2 py-0.5 dark:bg-neutral-800">
                  <Text className="text-xs text-neutral-600 dark:text-neutral-300">{tab.count}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
