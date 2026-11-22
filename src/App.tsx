import { useEffect, useState } from 'react';
import { BagDrawer } from './components/BagDrawer';
import { CatalogView } from './components/CatalogView';
import { Header } from './components/Header';
import { LookbookView } from './components/LookbookView';
import { TryOnStudio } from './components/TryOnStudio';
import { WardrobeView } from './components/WardrobeView';
import { PRODUCTS } from './data/catalog';
import {
  ActiveLayers,
  BagItem,
  ColorOption,
  GarmentSize,
  Product,
  SavedOutfit,
  ViewMode,
  WardrobeItem,
} from './types';
import {
  addItemToBag,
  addToWardrobe,
  applyProductToLayers,
  createSavedOutfit,
  removeFromWardrobe,
  updateBagQuantity,
} from './utils/wardrobe';

const STORAGE_KEYS = {
  wardrobe: 'varde.wardrobe.v1',
  outfits: 'varde.outfits.v1',
  favorites: 'varde.favorites.v1',
  bag: 'varde.bag.v1',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const initialProduct = PRODUCTS[0];

  const [activeView, setActiveView] = useState<ViewMode>('studio');
  const [focusedProduct, setFocusedProduct] = useState<Product>(initialProduct);
  const [activeLayers, setActiveLayers] = useState<ActiveLayers>(() =>
    applyProductToLayers({}, initialProduct, 'M', initialProduct.colors[0])
  );

  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);
  const [usingCustomPhoto, setUsingCustomPhoto] = useState(false);

  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(() =>
    readStorage<WardrobeItem[]>(STORAGE_KEYS.wardrobe, [])
  );
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>(() =>
    readStorage<SavedOutfit[]>(STORAGE_KEYS.outfits, [])
  );
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    readStorage<string[]>(STORAGE_KEYS.favorites, [])
  );
  const [bag, setBag] = useState<BagItem[]>(() =>
    readStorage<BagItem[]>(STORAGE_KEYS.bag, [])
  );
  const [bagOpen, setBagOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.wardrobe, JSON.stringify(wardrobe));
    } catch {
      // Ignore storage quota issues
    }
  }, [wardrobe]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.outfits, JSON.stringify(savedOutfits));
    } catch {
      // Ignore storage quota issues
    }
  }, [savedOutfits]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favoriteIds));
    } catch {
      // Ignore storage quota issues
    }
  }, [favoriteIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.bag, JSON.stringify(bag));
    } catch {
      // Ignore storage quota issues
    }
  }, [bag]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeView]);

  const handleAddToWardrobe = (
    product: Product,
    size: GarmentSize,
    color: ColorOption
  ) => {
    setWardrobe((prev) => addToWardrobe(prev, product, size, color));
  };

  const handleRemoveWardrobeItem = (id: string) => {
    setWardrobe((prev) => removeFromWardrobe(prev, id));
  };

  const handleTryInStudio = (
    product: Product,
    size?: GarmentSize,
    color?: ColorOption
  ) => {
    const resolvedSize = size ?? product.sizes[1] ?? product.sizes[0];
    const resolvedColor = color ?? product.colors[0];
    setFocusedProduct(product);
    setActiveLayers((prev) =>
      applyProductToLayers(prev, product, resolvedSize, resolvedColor)
    );
    setActiveView('studio');
  };

  const handleSaveOutfit = (
    name: string,
    layers: ActiveLayers,
    isCustomPhoto: boolean
  ) => {
    const result = createSavedOutfit(savedOutfits, name, layers, isCustomPhoto);
    if (result.error) {
      return { ok: false, error: result.error };
    }
    setSavedOutfits(result.outfits);
    return { ok: true };
  };

  const handleLoadOutfitInStudio = (outfit: SavedOutfit) => {
    setActiveLayers(outfit.layers);
    const primaryId =
      outfit.layers.outerwear?.productId ??
      outfit.layers.base?.productId ??
      outfit.layers.accessory?.productId;
    const primaryProd = PRODUCTS.find((p) => p.id === primaryId);
    if (primaryProd) {
      setFocusedProduct(primaryProd);
    }
    if (outfit.usingCustomPhoto && customPhotoUrl) {
      setUsingCustomPhoto(true);
    }
    setActiveView('studio');
  };

  const handleTryOutfitLayersInStudio = (layers: ActiveLayers) => {
    setActiveLayers(layers);
    const primaryId =
      layers.outerwear?.productId ??
      layers.base?.productId ??
      layers.accessory?.productId;
    const primaryProd = PRODUCTS.find((p) => p.id === primaryId);
    if (primaryProd) {
      setFocusedProduct(primaryProd);
    }
    setActiveView('studio');
  };

  const handleDeleteOutfit = (outfitId: string) => {
    setSavedOutfits((prev) => prev.filter((o) => o.id !== outfitId));
  };

  const handleToggleFavorite = (productId: string) => {
    setFavoriteIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleAddToBag = (
    product: Product,
    size: GarmentSize,
    color: ColorOption
  ) => {
    setBag((prev) => addItemToBag(prev, product.id, size, color));
  };

  const bagCount = bag.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F2EC] text-[#1A1816]">
      <Header
        activeView={activeView}
        onNavigate={setActiveView}
        wardrobeCount={wardrobe.length}
        bagCount={bagCount}
        onOpenBag={() => setBagOpen(true)}
      />

      <main className="flex-1">
        {activeView === 'studio' && (
          <TryOnStudio
            activeLayers={activeLayers}
            onChangeLayers={setActiveLayers}
            focusedProduct={focusedProduct}
            onSelectProduct={setFocusedProduct}
            wardrobe={wardrobe}
            onAddToWardrobe={handleAddToWardrobe}
            onAddToBag={handleAddToBag}
            onSaveOutfit={handleSaveOutfit}
            customPhotoUrl={customPhotoUrl}
            onChangeCustomPhoto={setCustomPhotoUrl}
            usingCustomPhoto={usingCustomPhoto}
            onChangeUsingCustomPhoto={setUsingCustomPhoto}
            onOpenRecommender={() => setActiveView('wardrobe')}
          />
        )}

        {activeView === 'lookbook' && (
          <LookbookView
            wardrobe={wardrobe}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            onTryInStudio={(prod) => handleTryInStudio(prod)}
            onAddToWardrobe={handleAddToWardrobe}
          />
        )}

        {activeView === 'catalog' && (
          <CatalogView
            wardrobe={wardrobe}
            onTryInStudio={(prod) => handleTryInStudio(prod)}
            onAddToWardrobe={handleAddToWardrobe}
          />
        )}

        {activeView === 'wardrobe' && (
          <WardrobeView
            wardrobe={wardrobe}
            savedOutfits={savedOutfits}
            onRemoveWardrobeItem={handleRemoveWardrobeItem}
            onTryInStudio={(prod, sz, col) => handleTryInStudio(prod, sz, col)}
            onLoadOutfitInStudio={handleLoadOutfitInStudio}
            onDeleteOutfit={handleDeleteOutfit}
            onMoveToBag={(productId, sz, col) => {
              const prod = PRODUCTS.find((p) => p.id === productId);
              if (prod) {
                handleAddToBag(prod, sz, col);
                setBagOpen(true);
              }
            }}
            onExploreCatalog={() => setActiveView('studio')}
            onTryOutfitLayersInStudio={handleTryOutfitLayersInStudio}
            onSaveRecommendedOutfit={(name, layers) =>
              handleSaveOutfit(name, layers, usingCustomPhoto)
            }
          />
        )}
      </main>

      <footer className="border-t border-[#1A1816]/10 bg-[#FAF8F4]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6A635A]">
          <div className="flex items-center gap-3">
            <span className="font-serif text-base tracking-[0.2em] text-[#1A1816]">
              VARDE
            </span>
            <span aria-hidden="true">·</span>
            <span>Sanal Kabin &amp; Gardırop · Sonbahar Kış 2026</span>
          </div>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setActiveView('studio')}
              className="hover:text-[#1A1816] transition-colors"
            >
              Sanal Kabin
            </button>
            <button
              type="button"
              onClick={() => setActiveView('lookbook')}
              className="hover:text-[#1A1816] transition-colors"
            >
              Koleksiyonlar
            </button>
            <button
              type="button"
              onClick={() => setActiveView('wardrobe')}
              className="hover:text-[#1A1816] transition-colors"
            >
              Gardırobum
            </button>
          </div>
        </div>
      </footer>

      <BagDrawer
        open={bagOpen}
        bag={bag}
        onClose={() => setBagOpen(false)}
        onUpdateQuantity={(idx, delta) =>
          setBag((prev) => updateBagQuantity(prev, idx, delta))
        }
        onClearBag={() => setBag([])}
      />
    </div>
  );
}
