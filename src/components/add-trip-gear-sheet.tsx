import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { ModalSheet } from '@/components/ui/modal-sheet';
import { useAddTripGear, useGear, useTripGear } from '@/lib/queries';

/* Multi-select sheet that adds closet items to a trip's packing list. */
export function AddTripGearSheet({
  tripId,
  visible,
  onClose,
}: {
  tripId: string;
  visible: boolean;
  onClose: () => void;
}) {
  const { data: closet } = useGear();
  const { data: tripGear } = useTripGear(tripId);
  const addGear = useAddTripGear(tripId);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isGroupGear, setIsGroupGear] = useState(false);

  const alreadyAdded = new Set((tripGear ?? []).map((g) => g.gearItem.id));
  const available = (closet ?? []).filter((g) => !alreadyAdded.has(g.id));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = async () => {
    if (selected.size === 0) return;
    await addGear.mutateAsync({ gearItemIds: [...selected], isGroupGear });
    setSelected(new Set());
    onClose();
  };

  return (
    <ModalSheet visible={visible} onClose={onClose} title="Add Gear to Trip">
      {available.length === 0 ? (
        <Text className="text-center text-neutral-500">
          Everything in your closet is already on this list.
        </Text>
      ) : (
        <View className="gap-2">
          {available.map((item) => {
            const isSelected = selected.has(item.id);
            return (
              <Pressable
                key={item.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                onPress={() => toggle(item.id)}
                className={`flex-row items-center justify-between rounded-xl border px-4 py-3 active:opacity-70 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/10'
                    : 'border-border bg-white dark:bg-neutral-900'
                }`}>
                <View className="flex-1 pr-3">
                  <Text className="text-sm font-sans-medium text-foreground" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="text-xs text-neutral-500">
                    {item.brand || 'Unknown Brand'} · {item.weightGrams}g
                  </Text>
                </View>
                <View
                  className={`h-6 w-6 items-center justify-center rounded-full border ${
                    isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-border'
                  }`}>
                  {isSelected ? <Check size={14} color="#ffffff" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: isGroupGear }}
        onPress={() => setIsGroupGear((v) => !v)}
        className="flex-row items-center justify-between rounded-xl border border-border px-4 py-3 active:opacity-70">
        <View>
          <Text className="text-sm font-sans-medium text-foreground">Group gear</Text>
          <Text className="text-xs text-neutral-500">Shared equipment the whole crew uses</Text>
        </View>
        <View
          className={`h-6 w-11 justify-center rounded-full px-0.5 ${isGroupGear ? 'bg-emerald-600' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
          <View className={`h-5 w-5 rounded-full bg-white ${isGroupGear ? 'self-end' : 'self-start'}`} />
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        disabled={selected.size === 0 || addGear.isPending}
        onPress={submit}
        className="items-center rounded-xl bg-emerald-600 py-3.5 active:opacity-80 disabled:opacity-50">
        {addGear.isPending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-base font-sans-semibold text-white">
            Add {selected.size > 0 ? `${selected.size} item${selected.size > 1 ? 's' : ''}` : 'items'}
          </Text>
        )}
      </Pressable>
    </ModalSheet>
  );
}
