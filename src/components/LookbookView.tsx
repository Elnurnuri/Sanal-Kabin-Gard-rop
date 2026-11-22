import { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, Plus, Shirt, Check } from 'lucide-react';
import { formatCurrencyTRY, LOOKBOOK_ENTRIES, PRODUCTS } from '../data/catalog';
import { ColorOption, GarmentSize, Product, WardrobeItem } from '../types';
import { isProductInWardrobe } from '../utils/wardrobe';

interface LookbookViewProps {
  wardrobe: WardrobeItem[];
  favoriteIds: string[];
  onToggleFavorite: (productId: string) => void;
  onTryInStudio: (product: Product) => void;
  onAddToWardrobe: (product: Product, size: GarmentSize, color: ColorOption) => void;
}

export function LookbookView({
  wardrobe,
  favoriteIds,
  onToggleFavorite,
  onTryInStudio,
  onAddToWardrobe,
}: LookbookViewProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const total = LOOKBOOK_ENTRIES.length;
  const activeLook = LOOKBOOK_ENTRIES[activeIndex];
  const prevIndex = (activeIndex - 1 + total) % total;
  const nextIndex = (activeIndex + 1) % total;

  const lookProducts = activeLook.productIds
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const handleTryEntireLook = () => {
    if (lookProducts[0]) {
      onTryInStudio(lookProducts[0]);
    }
  };

  return (
    <section
      aria-label="Koleksiyon Lookbook"
      className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 sm:py-8"
    >
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#1A1816]/10">
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#6A635A]">
            VARDE · LOW TIDE
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#1A1816] mt-1">
            {activeLook.season}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveIndex(prevIndex)}
            aria-label="Önceki görünüm"
            className="w-10 h-10 rounded-full border border-[#1A1816]/20 flex items-center justify-center text-[#1A1816] hover:bg-[#1A1816] hover:text-[#F5F2EC] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex(nextIndex)}
            aria-label="Sonraki görünüm"
            className="w-10 h-10 rounded-full border border-[#1A1816]/20 flex items-center justify-center text-[#1A1816] hover:bg-[#1A1816] hover:text-[#F5F2EC] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3-Column Editorial Look Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center py-6">
        {/* Previous Look (Left Flank) */}
        <div className="hidden lg:block lg:col-span-3">
          <button
            type="button"
            onClick={() => setActiveIndex(prevIndex)}
            aria-label={`Önceki görünümü seç: ${LOOKBOOK_ENTRIES[prevIndex].title}`}
            className="group w-full text-left opacity-55 hover:opacity-85 transition-opacity"
          >
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#EBE7DF] border border-[#1A1816]/10">
              <img
                src={LOOKBOOK_ENTRIES[prevIndex].image}
                alt={LOOKBOOK_ENTRIES[prevIndex].title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </div>
            <p className="mt-2.5 text-xs text-[#6A635A] font-serif italic">
              {LOOKBOOK_ENTRIES[prevIndex].title}
            </p>
          </button>
        </div>

        {/* Active Look (Center Dominant) */}
        <div className="lg:col-span-6">
          <div className="max-w-[340px] mx-auto">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-[#EBE7DF] border border-[#1A1816]/10 shadow-sm">
              <img
                src={activeLook.image}
                alt={`${activeLook.lookNumber} — ${activeLook.title}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="mt-5 flex items-baseline justify-between gap-4">
              <div>
                <h2 className="font-serif italic text-3xl text-[#1A1816]">
                  {activeLook.title}
                </h2>
                <p className="text-sm text-[#6A635A] mt-1">{activeLook.subtitle}</p>
              </div>
              <span className="text-xs tracking-[0.2em] uppercase text-[#1A1816] font-medium tabular-nums shrink-0">
                {activeLook.lookNumber}
              </span>
            </div>

            {/* Look Step Progress Bar */}
            <div className="mt-4 flex items-center gap-2">
              {LOOKBOOK_ENTRIES.map((entry, idx) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`${entry.lookNumber} — ${entry.title}`}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    idx === activeIndex ? 'bg-[#1A1816]' : 'bg-[#1A1816]/15 hover:bg-[#1A1816]/35'
                  }`}
                />
              ))}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleTryEntireLook}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1A1816] text-[#F5F2EC] text-xs tracking-[0.1em] uppercase font-medium hover:bg-[#312D29] transition-colors"
              >
                <Shirt className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Bu Görünümü Kabinde Dene</span>
              </button>
            </div>
          </div>
        </div>

        {/* Next Look (Right Flank) */}
        <div className="hidden lg:block lg:col-span-3">
          <button
            type="button"
            onClick={() => setActiveIndex(nextIndex)}
            aria-label={`Sonraki görünümü seç: ${LOOKBOOK_ENTRIES[nextIndex].title}`}
            className="group w-full text-left opacity-55 hover:opacity-85 transition-opacity"
          >
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#EBE7DF] border border-[#1A1816]/10">
              <img
                src={LOOKBOOK_ENTRIES[nextIndex].image}
                alt={LOOKBOOK_ENTRIES[nextIndex].title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </div>
            <p className="mt-2.5 text-xs text-[#6A635A] font-serif italic">
              {LOOKBOOK_ENTRIES[nextIndex].title}
            </p>
          </button>
        </div>
      </div>

      {/* Individual Garments in Active Look */}
      <div className="pt-8 border-t border-[#1A1816]/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs tracking-[0.16em] uppercase font-medium text-[#6A635A]">
            Görünümdeki Parçalar · Satın Almadan Gardırobuna Ekle
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {lookProducts.map((product) => {
            const saved = isProductInWardrobe(wardrobe, product.id);
            const isFav = favoriteIds.includes(product.id);
            return (
              <article
                key={product.id}
                className="bg-[#FAF8F4] border border-[#1A1816]/10 rounded-xl p-4 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div>
                  <div className="relative aspect-square rounded-lg bg-white overflow-hidden border border-[#1A1816]/5">
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain p-4"
                    />
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(product.id)}
                      aria-label={
                        isFav
                          ? `${product.name} favorilerden çıkar`
                          : `${product.name} favorilere ekle`
                      }
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#F5F2EC]/90 border border-[#1A1816]/10 flex items-center justify-center text-[#1A1816] hover:bg-white transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 ${isFav ? 'fill-[#1A1816]' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  <div className="mt-4">
                    <p className="text-[11px] tracking-[0.12em] uppercase text-[#6A635A]">
                      {product.categoryLabel} · {product.collection}
                    </p>
                    <div className="mt-1 flex items-baseline justify-between gap-2">
                      <h4 className="text-base font-semibold text-[#1A1816]">
                        {product.name}
                      </h4>
                      <span className="text-sm font-medium text-[#1A1816] tabular-nums shrink-0">
                        {formatCurrencyTRY(product.price)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1A1816]/10 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onTryInStudio(product)}
                    className="flex-1 py-2 px-3 rounded-lg border border-[#1A1816]/20 text-xs font-medium text-[#1A1816] hover:bg-[#1A1816] hover:text-[#F5F2EC] transition-colors whitespace-nowrap"
                  >
                    Kabin&apos;de Dene
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onAddToWardrobe(product, product.sizes[0], product.colors[0])
                    }
                    aria-label={`${product.name} gardıroba ekle`}
                    className={`py-2 px-3 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                      saved
                        ? 'bg-[#E5E0D5] text-[#1A1816]'
                        : 'bg-[#1A1816] text-[#F5F2EC] hover:bg-[#312D29]'
                    }`}
                  >
                    {saved ? (
                      <>
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Gardıropta</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Gardıroba Ekle</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
