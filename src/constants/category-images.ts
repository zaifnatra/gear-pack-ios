import type { ImageSourcePropType } from 'react-native';

/*
 * Category default images, ported from the web app's
 * src/lib/constants/category-images.ts (same source files, copied into
 * assets/images/categories). Used as the gear-card image when an item has no
 * photo of its own — identical behavior to the web GearCard.
 */
const IMAGES: Record<string, ImageSourcePropType> = {
  Tent: require('@/assets/images/categories/tent.webp'),
  Hammock: require('@/assets/images/categories/hammock.webp'),
  Bivy: require('@/assets/images/categories/bivy.webp'),
  'Sleeping Bag': require('@/assets/images/categories/sleepingbag.webp'),
  Quilt: require('@/assets/images/categories/sleepingbag.webp'),
  'Sleeping Pad': require('@/assets/images/categories/sleepingbag.webp'),
  Backpack: require('@/assets/images/categories/daypack.avif'),
  Daypack: require('@/assets/images/categories/daypack.avif'),
  Stove: require('@/assets/images/categories/stove.webp'),
  Fuel: require('@/assets/images/categories/fuel.webp'),
  Pot: require('@/assets/images/categories/pot.webp'),
  Cookware: require('@/assets/images/categories/pot.webp'),
  Mug: require('@/assets/images/categories/mug.webp'),
  Utensil: require('@/assets/images/categories/utensils.webp'),
  'Water Filter': require('@/assets/images/categories/filter.jpg'),
  'Water Bottle': require('@/assets/images/categories/bottle.webp'),
  'Rain Jacket': require('@/assets/images/categories/rainjacket.webp'),
  'Down Jacket': require('@/assets/images/categories/down.webp'),
  Fleece: require('@/assets/images/categories/fleece.webp'),
  'Base Layer': require('@/assets/images/categories/baselayer.webp'),
  'T-Shirt': require('@/assets/images/categories/tshirt.webp'),
  Pants: require('@/assets/images/categories/hikingpants.webp'),
  Shorts: require('@/assets/images/categories/shorts.webp'),
  Hat: require('@/assets/images/categories/hat.webp'),
  Beanie: require('@/assets/images/categories/beanie.webp'),
  Gloves: require('@/assets/images/categories/gloves.webp'),
  'Camp Shoes': require('@/assets/images/categories/campshoes.webp'),
  Boots: require('@/assets/images/categories/campshoes.webp'),
  Headlamp: require('@/assets/images/categories/headlamp.jpg'),
  'Power Bank': require('@/assets/images/categories/powerbank.webp'),
  GPS: require('@/assets/images/categories/satellite.webp'),
  'Trekking Poles': require('@/assets/images/categories/trekking.png'),
  Multitool: require('@/assets/images/categories/multitool.webp'),
  'Bear Canister': require('@/assets/images/categories/bearcanister.webp'),
  'First Aid Kit': require('@/assets/images/categories/firstaidkit_.jpg'),
};

export function getCategoryDefaultImage(categoryName?: string | null): ImageSourcePropType | null {
  if (!categoryName) return null;
  return IMAGES[categoryName] ?? null;
}
