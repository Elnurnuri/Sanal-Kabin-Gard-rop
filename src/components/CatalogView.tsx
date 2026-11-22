import { useMemo, useState } from 'react';
import { Check, Plus, Search, Shirt } from 'lucide-react';
import { formatCurrencyTRY, PRODUCTS } from '../data/catalog';
import { ColorOption, FilterCategory, GarmentSize, Product, WardrobeItem } from '../types';
import { filterProducts, isProductInWardrobe } from '../utils/wardrobe';

interface CatalogViewProps {
  wardrobe: WardrobeItem[];
  onTryInStudio: (product: Product) => void;
  onAddToWardrobe: (product: Product, size: GarmentSize, color: ColorOption) => void;
}

const CATEGORIES: { id: FilterCategory; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'tops', label: 'Üst Giyim' },
  { id: 'outerwear', label: 'Dış Giyim' },
  { id: 'dresses', label: 'Elbise & Set' },
  { id: 'accessories', label: 'Aksesuar' },
];

export function CatalogView({
  wardrobe,
  onTryInStudio,
  onAddToWardrobe,
}: CatalogViewProps) {
  const [category, setCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const visibleProducts = useMemo(
    () => filterProducts(PRODUCTS, category, searchQuery),
    [category, searchQuery]
  );

  return (
    <section
      aria-label="Koleksiyon Kataloğu"
      className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 sm:py-12"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#1A1816]/10">
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#6A635A]">
            VARDE · KOLEKSİYON KATALOĞU
          </p>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-[#1A1816] mt-1">
            Tüm Parçalar
          </h1>
          <p className="text-sm text-[#6A635A] mt-2 max-w-xl">
            Satın almadan önce beğendiğiniz parçaları seçip sanal kabinde kendi üzerinizde veya model üzerinde deneyin.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <label htmlFor="catalog-search" className="sr-only">
              Koleksiyon içinde ara
            </label>
            <Search
              className="w-4 h-4 text-[#6A635A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="catalog-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Parça, kumaş veya koleksiyon ara..."
              className="w-full sm:w-64 pl-10 pr-4 py-2 text-sm bg-[#FAF8F4] border border-[#1A1816]/15 rounded-full text-[#1A1816] placeholder:text-[#8E867B] focus:outline-none focus:border-[#1A1816]"
            />
          </div>
        </div>
      </div>

      {/* Category Segmented Tabs */}
      <div className="py-6 flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => {
          const active = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs tracking-[0.08em] uppercase font-medium transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#1A1816] text-[#F5F2EC]'
                  : 'bg-[#EBE7DF] text-[#554F47] hover:bg-[#DFD9CE] hover:text-[#1A1816]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {visibleProducts.length === 0 ? (
        <div className="py-16 text-center bg-[#FAF8F4] rounded-2xl border border-[#1A1816]/10">
          <p className="font-serif text-2xl text-[#1A1816]">
            Aramanızla eşleşen parça bulunamadı.
          </p>
          <p className="text-sm text-[#6A635A] mt-2">
            Filtreyi temizleyerek tüm Sonbahar / Kış parçalarını inceleyebilirsiniz.
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory('all');
              setSearchQuery('');
            }}
            className="mt-5 px-5 py-2.5 rounded-full bg-[#1A1816] text-[#F5F2EC] text-xs uppercase tracking-[0.1em] font-medium"
          >
            Filtreleri Sıfırla
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {visibleProducts.map((product) => {
            const inWardrobe = isProductInWardrobe(wardrobe, product.id);
            return (
              <article
                key={product.id}
                className="group bg-[#FAF8F4] border border-[#1A1816]/10 rounded-2xl p-5 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div>
                  <div className="aspect-[4/3] rounded-xl bg-white overflow-hidden border border-[#1A1816]/5 flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain p-5 transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-[11px] tracking-[0.1em] uppercase text-[#6A635A]">
                      <span>{product.categoryLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="truncate">{product.fabric}</span>
                    </div>

                    <div className="mt-1.5 flex items-baseline justify-between gap-3">
                      <h2 className="text-base font-semibold text-[#1A1816]">
                        {product.name}
                      </h2>
                      <span className="text-[15px] font-medium text-[#1A1816] tabular-nums shrink-0">
                        {formatCurrencyTRY(product.price)}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-[#6A635A] leading-relaxed line-clamp-2">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#1A1816]/10 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onTryInStudio(product)}
                    className="flex-1 py-2.5 px-3 rounded-lg bg-[#1A1816] text-[#F5F2EC] text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-[#312D29] transition-colors whitespace-nowrap"
                  >
                    <Shirt className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Üzerinde Dene</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onAddToWardrobe(product, product.sizes[0], product.colors[0])
                    }
                    className={`py-2.5 px-3.5 rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 border transition-colors whitespace-nowrap ${
                      inWardrobe
                        ? 'bg-[#EBE7DF] border-[#1A1816]/15 text-[#1A1816]'
                        : 'border-[#1A1816]/20 text-[#1A1816] hover:bg-[#EBE7DF]'
                    }`}
                  >
                    {inWardrobe ? (
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
      )}
    </section>
  );
}
