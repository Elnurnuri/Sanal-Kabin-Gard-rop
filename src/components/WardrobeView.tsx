import { Layers, Shirt, ShoppingBag, Trash2 } from 'lucide-react';
import { formatCurrencyTRY, PRODUCTS } from '../data/catalog';
import {
  ActiveLayers,
  ColorOption,
  GarmentSize,
  LayerSlot,
  Product,
  SavedOutfit,
  WardrobeItem,
} from '../types';
import { calculateOutfitTotal } from '../utils/wardrobe';
import { OutfitRecommender } from './OutfitRecommender';

interface WardrobeViewProps {
  wardrobe: WardrobeItem[];
  savedOutfits: SavedOutfit[];
  onRemoveWardrobeItem: (id: string) => void;
  onTryInStudio: (product: Product, size: GarmentSize, color: ColorOption) => void;
  onLoadOutfitInStudio: (outfit: SavedOutfit) => void;
  onDeleteOutfit: (outfitId: string) => void;
  onMoveToBag: (productId: string, size: GarmentSize, color: ColorOption) => void;
  onExploreCatalog: () => void;
  onTryOutfitLayersInStudio: (layers: ActiveLayers) => void;
  onSaveRecommendedOutfit: (
    name: string,
    layers: ActiveLayers
  ) => { ok: boolean; error?: string };
}

export function WardrobeView({
  wardrobe,
  savedOutfits,
  onRemoveWardrobeItem,
  onTryInStudio,
  onLoadOutfitInStudio,
  onDeleteOutfit,
  onMoveToBag,
  onExploreCatalog,
  onTryOutfitLayersInStudio,
  onSaveRecommendedOutfit,
}: WardrobeViewProps) {
  const getOutfitProducts = (layers: ActiveLayers): Product[] => {
    const slots: LayerSlot[] = ['base', 'outerwear', 'accessory'];
    const items: Product[] = [];
    for (const slot of slots) {
      const layer = layers[slot];
      if (!layer) continue;
      const product = PRODUCTS.find((p) => p.id === layer.productId);
      if (product) items.push(product);
    }
    return items;
  };

  return (
    <section
      aria-label="Sanal Gardırobum"
      className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-12"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#1A1816]/10">
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#6A635A]">
            VARDE · KİŞİSEL ARŞİV
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-[#1A1816] mt-1">
            Sanal Gardırobum
          </h1>
          <p className="text-sm text-[#6A635A] mt-2 max-w-2xl">
            Satın alma zorunluluğu olmadan koleksiyonlardan beğendiğiniz parçaları biriktirin, kombinleyin ve dilediğiniz zaman kendi üzerinizde tekrar deneyin.
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs tracking-[0.1em] uppercase text-[#6A635A] tabular-nums">
          <span>{wardrobe.length} Kayıtlı Parça</span>
          <span aria-hidden="true">·</span>
          <span>{savedOutfits.length} Kombin</span>
        </div>
      </div>

      {/* Section 0: Smart Outfit Recommender */}
      <OutfitRecommender
        wardrobe={wardrobe}
        onTryOutfitInStudio={onTryOutfitLayersInStudio}
        onSaveRecommendedOutfit={onSaveRecommendedOutfit}
      />

      {/* Section 1: Saved Multi-Piece Outfits */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl sm:text-3xl text-[#1A1816]">
            Kayıtlı Kombinlerim
          </h2>
        </div>

        {savedOutfits.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#FAF8F4] border border-[#1A1816]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-base font-medium text-[#1A1816]">
                Henüz kayıtlı bir kombin oluşturmadınız.
              </p>
              <p className="text-sm text-[#6A635A] mt-1">
                Sanal Kabin&apos;de üst, dış giyim ve aksesuarları katmanlayıp &ldquo;Kombin Kaydet&rdquo; ile saklayabilirsiniz.
              </p>
            </div>
            <button
              type="button"
              onClick={onExploreCatalog}
              className="px-5 py-2.5 rounded-full bg-[#1A1816] text-[#F5F2EC] text-xs uppercase tracking-[0.1em] font-medium whitespace-nowrap shrink-0"
            >
              Kabin&apos;de Kombin Yap
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedOutfits.map((outfit) => {
              const items = getOutfitProducts(outfit.layers);
              const total = calculateOutfitTotal(outfit.layers, PRODUCTS);
              return (
                <article
                  key={outfit.id}
                  className="bg-[#FAF8F4] border border-[#1A1816]/10 rounded-2xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] tracking-[0.12em] uppercase text-[#6A635A]">
                          {outfit.usingCustomPhoto ? 'Kendi Fotoğrafın' : 'Stüdyo Modeli'} ·{' '}
                          {items.length} Parça
                        </p>
                        <h3 className="font-serif text-2xl text-[#1A1816] mt-0.5">
                          {outfit.name}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDeleteOutfit(outfit.id)}
                        aria-label={`${outfit.name} kombinini sil`}
                        className="w-9 h-9 rounded-full border border-[#1A1816]/10 flex items-center justify-center text-[#6A635A] hover:text-[#1A1816] hover:bg-[#EBE7DF] transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {items.map((prod) => (
                        <div
                          key={prod.id}
                          className="aspect-square rounded-lg bg-white border border-[#1A1816]/5 overflow-hidden p-2"
                        >
                          <img
                            src={prod.image}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-[#6A635A]">
                      <span>{items.map((p) => p.name).join(' + ')}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#1A1816]/10 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[#1A1816] tabular-nums">
                      Toplam: {formatCurrencyTRY(total)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onLoadOutfitInStudio(outfit)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1A1816] text-[#F5F2EC] text-xs font-medium hover:bg-[#312D29] transition-colors whitespace-nowrap"
                    >
                      <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Stüdyoda Aç</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Saved Individual Pieces */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl sm:text-3xl text-[#1A1816]">
            Gardırop Parçalarım
          </h2>
        </div>

        {wardrobe.length === 0 ? (
          <div className="py-16 text-center bg-[#FAF8F4] rounded-2xl border border-[#1A1816]/10">
            <p className="font-serif text-2xl text-[#1A1816]">
              Sanal gardırobunuz henüz boş.
            </p>
            <p className="text-sm text-[#6A635A] mt-2 max-w-md mx-auto">
              Koleksiyonlardan beğendiğiniz ürünleri satın almadan önce gardırobunuza ekleyin ve üzerinizde deneyin.
            </p>
            <button
              type="button"
              onClick={onExploreCatalog}
              className="mt-5 px-6 py-2.5 rounded-full bg-[#1A1816] text-[#F5F2EC] text-xs uppercase tracking-[0.1em] font-medium"
            >
              Koleksiyonları Keşfet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wardrobe.map((entry) => {
              const product = PRODUCTS.find((p) => p.id === entry.productId);
              if (!product) return null;

              return (
                <article
                  key={entry.id}
                  className="bg-[#FAF8F4] border border-[#1A1816]/10 rounded-2xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[4/3] rounded-xl bg-white overflow-hidden border border-[#1A1816]/5">
                      <img
                        src={product.image}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain p-4"
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveWardrobeItem(entry.id)}
                        aria-label={`${product.name} gardıroptan çıkar`}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#F5F2EC]/90 border border-[#1A1816]/10 flex items-center justify-center text-[#6A635A] hover:text-[#1A1816] hover:bg-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-4">
                      <p className="text-[11px] tracking-[0.1em] uppercase text-[#6A635A]">
                        Beden {entry.selectedSize} · {entry.selectedColor.name}
                      </p>
                      <div className="mt-1 flex items-baseline justify-between gap-2">
                        <h3 className="text-base font-semibold text-[#1A1816]">
                          {product.name}
                        </h3>
                        <span className="text-sm font-medium text-[#1A1816] tabular-nums shrink-0">
                          {formatCurrencyTRY(product.price)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#1A1816]/10 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onTryInStudio(product, entry.selectedSize, entry.selectedColor)
                      }
                      className="flex-1 py-2.5 px-3 rounded-lg bg-[#1A1816] text-[#F5F2EC] text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-[#312D29] transition-colors whitespace-nowrap"
                    >
                      <Shirt className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Üzerinde Dene</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onMoveToBag(product.id, entry.selectedSize, entry.selectedColor)
                      }
                      aria-label={`${product.name} sepete ekle`}
                      className="py-2.5 px-3 rounded-lg border border-[#1A1816]/20 text-xs font-medium text-[#1A1816] hover:bg-[#EBE7DF] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Satın Al</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
