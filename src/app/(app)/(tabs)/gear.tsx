import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';

import { GearCard } from '@/components/gear-card';
import { GearFormSheet } from '@/components/gear-form';
import { TabScreen } from '@/components/tab-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { HeroBanner } from '@/components/ui/hero-banner';
import { useGear } from '@/lib/queries';
import type { GearItem } from '@/types';

export default function GearClosetScreen() {
  const { data: gear, refetch, isRefetching } = useGear();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GearItem | null>(null);

  const openForm = (item: GearItem | null) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const totalGrams = (gear ?? []).reduce((sum, g) => sum + g.weightGrams, 0);

  return (
    <TabScreen>
      <FlatList
        data={gear ?? []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerClassName="gap-3 pb-10"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="mb-1 gap-4 p-4">
            <HeroBanner
              image={require('@/assets/images/headers/header4.jpg')}
              title="Gear Closet"
              subtitle="Inventory your equipment, track weights, and organize your pack."
              compact>
              <Pressable
                accessibilityRole="button"
                onPress={() => openForm(null)}
                className="flex-row items-center gap-2 rounded-full bg-white px-6 py-3 active:opacity-80">
                <Plus size={16} color="#171717" />
                <Text className="text-sm font-sans-bold text-neutral-900">Add Item</Text>
              </Pressable>
            </HeroBanner>
            <View className="flex-row items-center justify-between px-1">
              <Text className="text-sm text-neutral-500">
                {gear?.length ?? 0} items · {(totalGrams / 1000).toFixed(1)} kg total
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => <GearCard item={item} onPress={() => openForm(item)} />}
        ListEmptyComponent={
          <View className="px-4">
            <EmptyState message="Your closet is empty." hint="Add your first piece of gear →" />
          </View>
        }
      />

      {formOpen ? (
        <GearFormSheet
          key={editingItem?.id ?? 'new'}
          visible={formOpen}
          onClose={() => setFormOpen(false)}
          initialItem={editingItem}
        />
      ) : null}
    </TabScreen>
  );
}
