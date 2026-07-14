import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native';

import { ModalSheet } from '@/components/ui/modal-sheet';
import { TextField } from '@/components/text-field';
import { useCategories, useDeleteGear, useSaveGear } from '@/lib/queries';
import type { Condition, GearItem } from '@/types';

const CONDITIONS: Condition[] = ['NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'RETIRED'];

function SelectChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`rounded-full border px-3 py-1.5 active:opacity-70 ${
        selected
          ? 'border-emerald-600 bg-emerald-600'
          : 'border-border bg-white dark:bg-neutral-900'
      }`}>
      <Text
        className={`text-xs font-sans-medium ${
          selected ? 'text-white' : 'text-neutral-600 dark:text-neutral-300'
        }`}>
        {label}
      </Text>
    </Pressable>
  );
}

/* Add/edit gear sheet — the iOS take on the web's GearForm modal. */
export function GearFormSheet({
  visible,
  onClose,
  initialItem,
}: {
  visible: boolean;
  onClose: () => void;
  initialItem: GearItem | null;
}) {
  const { data: categories } = useCategories();
  const saveGear = useSaveGear();
  const deleteGear = useDeleteGear();

  const [name, setName] = useState(initialItem?.name ?? '');
  const [brand, setBrand] = useState(initialItem?.brand ?? '');
  const [weight, setWeight] = useState(initialItem ? String(initialItem.weightGrams) : '');
  const [categoryId, setCategoryId] = useState(initialItem?.categoryId ?? '');
  const [condition, setCondition] = useState<Condition>(initialItem?.condition ?? 'GOOD');
  const [error, setError] = useState<string | null>(null);

  const groups = categories ?? [];

  const submit = async () => {
    if (!name.trim()) return setError('Give the item a name.');
    if (!categoryId) return setError('Pick a category.');
    setError(null);
    await saveGear.mutateAsync({
      id: initialItem?.id,
      name: name.trim(),
      brand: brand.trim() || null,
      weightGrams: parseInt(weight, 10) || 0,
      categoryId,
      condition,
    });
    onClose();
  };

  const confirmDelete = () => {
    if (!initialItem) return;
    const remove = async () => {
      await deleteGear.mutateAsync(initialItem.id);
      onClose();
    };
    if (Platform.OS === 'web') {
      remove();
      return;
    }
    Alert.alert('Delete gear', `Remove “${initialItem.name}” from your closet?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: remove },
    ]);
  };

  return (
    <ModalSheet visible={visible} onClose={onClose} title={initialItem ? 'Edit Gear' : 'Add New Gear'}>
      <TextField label="Name" value={name} onChangeText={setName} placeholder="Copper Spur HV UL2" />
      <TextField label="Brand" value={brand} onChangeText={setBrand} placeholder="Big Agnes" />
      <TextField
        label="Weight (grams)"
        value={weight}
        onChangeText={setWeight}
        placeholder="1400"
        keyboardType="number-pad"
      />

      <View className="gap-2">
        <Text className="text-sm font-sans-medium text-foreground">Category</Text>
        {groups.map((group) => (
          <View key={group.id} className="gap-2">
            <Text className="mt-1 text-xs font-sans-semibold uppercase tracking-wider text-neutral-500">
              {group.name}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {(group.children ?? []).map((cat) => (
                <SelectChip
                  key={cat.id}
                  label={cat.name}
                  selected={categoryId === cat.id}
                  onPress={() => setCategoryId(cat.id)}
                />
              ))}
            </View>
          </View>
        ))}
      </View>

      <View className="gap-2">
        <Text className="text-sm font-sans-medium text-foreground">Condition</Text>
        <View className="flex-row flex-wrap gap-2">
          {CONDITIONS.map((c) => (
            <SelectChip key={c} label={c} selected={condition === c} onPress={() => setCondition(c)} />
          ))}
        </View>
      </View>

      {error ? <Text className="text-sm text-red-500">{error}</Text> : null}

      <Pressable
        accessibilityRole="button"
        disabled={saveGear.isPending}
        onPress={submit}
        className="items-center rounded-xl bg-emerald-600 py-3.5 active:opacity-80 disabled:opacity-50">
        {saveGear.isPending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-base font-sans-semibold text-white">
            {initialItem ? 'Save Changes' : 'Add to Closet'}
          </Text>
        )}
      </Pressable>

      {initialItem ? (
        <Pressable
          accessibilityRole="button"
          disabled={deleteGear.isPending}
          onPress={confirmDelete}
          className="items-center rounded-xl border border-red-200 py-3 active:opacity-70 dark:border-red-900/40">
          <Text className="text-sm font-sans-semibold text-red-600">Delete Item</Text>
        </Pressable>
      ) : null}
    </ModalSheet>
  );
}
