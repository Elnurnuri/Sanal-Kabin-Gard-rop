export type GarmentCategory = 'tops' | 'outerwear' | 'dresses' | 'accessories';

export type FilterCategory = 'all' | GarmentCategory;

export type GarmentSize = 'S' | 'M' | 'L' | 'XL';

export type StudioGenderPreset = 'male' | 'female';

export type ViewMode = 'studio' | 'lookbook' | 'catalog' | 'wardrobe';

export interface ColorOption {
  name: string;
  hex: string;
}

export interface GarmentPlacement {
  /** Horizontal center as percentage of canvas width (0-100) */
  xPct: number;
  /** Top offset as percentage of canvas height (0-100) */
  yPct: number;
  /** Width as percentage of canvas width (15-95) */
  widthPct: number;
  /** Fine rotation in degrees (-20 to 20) */
  rotationDeg: number;
  /** Opacity / blend strength (0.65 to 1) */
  opacity: number;
}

export interface Product {
  id: string;
  name: string;
  collection: string;
  category: GarmentCategory;
  categoryLabel: string;
  fabric: string;
  price: number;
  image: string;
  /** Studio look image when tried on the matching preset model */
  modelPreviewImage?: string;
  preferredModel: StudioGenderPreset;
  sizes: GarmentSize[];
  colors: ColorOption[];
  description: string;
  defaultPlacement: GarmentPlacement;
}

export interface LookbookEntry {
  id: string;
  lookNumber: string;
  title: string;
  subtitle: string;
  season: string;
  image: string;
  modelGender: StudioGenderPreset;
  productIds: string[];
}

export interface WardrobeItem {
  id: string;
  productId: string;
  selectedSize: GarmentSize;
  selectedColor: ColorOption;
  addedAt: string;
  customNote?: string;
}

export type LayerSlot = 'base' | 'outerwear' | 'accessory';

export type ActiveLayers = Partial<Record<LayerSlot, {
  productId: string;
  size: GarmentSize;
  color: ColorOption;
  placement: GarmentPlacement;
}>>;

export interface SavedOutfit {
  id: string;
  name: string;
  createdAt: string;
  layers: ActiveLayers;
  usingCustomPhoto: boolean;
}

export interface BagItem {
  productId: string;
  size: GarmentSize;
  color: ColorOption;
  quantity: number;
}

export interface FitAnalysisResult {
  placement: GarmentPlacement;
  recommendedSize: GarmentSize;
  fitNote: string;
}
