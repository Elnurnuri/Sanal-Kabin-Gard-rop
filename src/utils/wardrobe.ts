import {
  ActiveLayers,
  BagItem,
  ColorOption,
  FilterCategory,
  GarmentCategory,
  GarmentPlacement,
  GarmentSize,
  LayerSlot,
  Product,
  SavedOutfit,
  WardrobeItem,
} from '../types';

export function filterProducts(
  products: Product[],
  category: FilterCategory,
  searchQuery = ''
): Product[] {
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('tr-TR');
  return products.filter((product) => {
    const matchesCategory = category === 'all' || product.category === category;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;
    const haystack = [
      product.name,
      product.collection,
      product.categoryLabel,
      product.fabric,
      product.description,
    ]
      .join(' ')
      .toLocaleLowerCase('tr-TR');
    return haystack.includes(normalizedQuery);
  });
}

export function getLayerSlotForCategory(category: GarmentCategory): LayerSlot {
  if (category === 'outerwear') return 'outerwear';
  if (category === 'accessories') return 'accessory';
  return 'base';
}

export function clampPlacement(placement: GarmentPlacement): GarmentPlacement {
  return {
    xPct: Math.min(85, Math.max(15, Math.round(placement.xPct * 10) / 10)),
    yPct: Math.min(80, Math.max(5, Math.round(placement.yPct * 10) / 10)),
    widthPct: Math.min(90, Math.max(15, Math.round(placement.widthPct * 10) / 10)),
    rotationDeg: Math.min(20, Math.max(-20, Math.round(placement.rotationDeg))),
    opacity: Math.min(1, Math.max(0.65, Math.round(placement.opacity * 100) / 100)),
  };
}

export function applyProductToLayers(
  currentLayers: ActiveLayers,
  product: Product,
  size: GarmentSize,
  color: ColorOption,
  overridePlacement?: GarmentPlacement
): ActiveLayers {
  const slot = getLayerSlotForCategory(product.category);
  const placement = clampPlacement(overridePlacement ?? product.defaultPlacement);
  return {
    ...currentLayers,
    [slot]: {
      productId: product.id,
      size,
      color,
      placement,
    },
  };
}

export function removeLayerSlot(
  currentLayers: ActiveLayers,
  slot: LayerSlot
): ActiveLayers {
  const next = { ...currentLayers };
  delete next[slot];
  return next;
}

export function addToWardrobe(
  wardrobe: WardrobeItem[],
  product: Product,
  size: GarmentSize,
  color: ColorOption,
  nowIso = new Date().toISOString()
): WardrobeItem[] {
  const duplicateIndex = wardrobe.findIndex(
    (entry) =>
      entry.productId === product.id &&
      entry.selectedSize === size &&
      entry.selectedColor.name === color.name
  );
  if (duplicateIndex !== -1) {
    return wardrobe;
  }
  const newItem: WardrobeItem = {
    id: `${product.id}-${size}-${color.name}-${wardrobe.length + 1}`,
    productId: product.id,
    selectedSize: size,
    selectedColor: color,
    addedAt: nowIso,
  };
  return [newItem, ...wardrobe];
}

export function removeFromWardrobe(
  wardrobe: WardrobeItem[],
  wardrobeItemId: string
): WardrobeItem[] {
  return wardrobe.filter((item) => item.id !== wardrobeItemId);
}

export function isProductInWardrobe(
  wardrobe: WardrobeItem[],
  productId: string,
  size?: GarmentSize,
  colorName?: string
): boolean {
  return wardrobe.some((item) => {
    if (item.productId !== productId) return false;
    if (size && item.selectedSize !== size) return false;
    if (colorName && item.selectedColor.name !== colorName) return false;
    return true;
  });
}

export function createSavedOutfit(
  existingOutfits: SavedOutfit[],
  name: string,
  layers: ActiveLayers,
  usingCustomPhoto: boolean,
  nowIso = new Date().toISOString()
): { outfits: SavedOutfit[]; error?: string } {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { outfits: existingOutfits, error: 'Lütfen kombin için bir isim girin.' };
  }
  const hasAnyLayer = Boolean(layers.base || layers.outerwear || layers.accessory);
  if (!hasAnyLayer) {
    return {
      outfits: existingOutfits,
      error: 'Kombin kaydetmek için en az bir parça giyin.',
    };
  }
  const outfit: SavedOutfit = {
    id: `kombin-${Date.now()}-${existingOutfits.length + 1}`,
    name: trimmedName,
    createdAt: nowIso,
    layers,
    usingCustomPhoto,
  };
  return { outfits: [outfit, ...existingOutfits] };
}

export function calculateOutfitTotal(
  layers: ActiveLayers,
  products: Product[]
): number {
  const slots: LayerSlot[] = ['base', 'outerwear', 'accessory'];
  return slots.reduce((sum, slot) => {
    const layer = layers[slot];
    if (!layer) return sum;
    const product = products.find((p) => p.id === layer.productId);
    return sum + (product ? product.price : 0);
  }, 0);
}

export function addItemToBag(
  bag: BagItem[],
  productId: string,
  size: GarmentSize,
  color: ColorOption
): BagItem[] {
  const existingIndex = bag.findIndex(
    (item) =>
      item.productId === productId &&
      item.size === size &&
      item.color.name === color.name
  );
  if (existingIndex !== -1) {
    return bag.map((item, idx) =>
      idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
    );
  }
  return [...bag, { productId, size, color, quantity: 1 }];
}

export function updateBagQuantity(
  bag: BagItem[],
  index: number,
  delta: number
): BagItem[] {
  if (index < 0 || index >= bag.length) return bag;
  const target = bag[index];
  const nextQty = target.quantity + delta;
  if (nextQty <= 0) {
    return bag.filter((_, idx) => idx !== index);
  }
  return bag.map((item, idx) =>
    idx === index ? { ...item, quantity: nextQty } : item
  );
}

export function calculateBagTotal(bag: BagItem[], products: Product[]): number {
  return bag.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
}
