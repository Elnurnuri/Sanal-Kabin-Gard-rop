import { useMemo, useState } from 'react';
import { BookmarkPlus, Check, Palette, RotateCcw, Shirt, Sparkles } from 'lucide-react';
import { formatCurrencyTRY, PRODUCTS } from '../data/catalog';
import { ActiveLayers, WardrobeItem } from '../types';
import {
  COLOR_COMBINATION_RULES,
  COLOR_RULE_CATEGORIES,
  ColorRuleCategory,
  OCCASION_OPTIONS,
  OccasionType,
  OutfitRecommendation,
  recommendOutfits,
  STYLE_OPTIONS,
  StyleProfile,
  WEATHER_OPTIONS,
  WeatherCondition,
} from '../utils/recommender';
import { calculateOutfitTotal } from '../utils/wardrobe';

interface OutfitRecommenderProps {
  wardrobe: WardrobeItem[];
  onTryOutfitInStudio: (layers: ActiveLayers) => void;
  onSaveRecommendedOutfit: (
    name: string,
    layers: ActiveLayers
  ) => { ok: boolean; error?: string };
}

export function OutfitRecommender({
  wardrobe,
  onTryOutfitInStudio,
  onSaveRecommendedOutfit,
}: OutfitRecommenderProps) {
  const [weather, setWeather] = useState<WeatherCondition>('breezy');
  const [occasion, setOccasion] = useState<OccasionType>('gallery');
  const [style, setStyle] = useState<StyleProfile>('quiet-luxury');
  const [ruleCategory, setRuleCategory] = useState<ColorRuleCategory>('all');
  const [selectedRuleId, setSelectedRuleId] = useState<string>('auto');
  const [allowCatalogFill, setAllowCatalogFill] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const visibleRules = useMemo(
    () =>
      ruleCategory === 'all'
        ? COLOR_COMBINATION_RULES
        : COLOR_COMBINATION_RULES.filter((r) => r.category === ruleCategory),
    [ruleCategory]
  );

  const activeRule = useMemo(
    () =>
      selectedRuleId === 'auto'
        ? null
        : COLOR_COMBINATION_RULES.find((r) => r.id === selectedRuleId) ?? null,
    [selectedRuleId]
  );

  const recommendations = useMemo(
    () =>
      recommendOutfits(wardrobe, PRODUCTS, {
        weather,
        occasion,
        style,
        colorRuleId: selectedRuleId,
        allowCatalogFill,
        maxResults: 3,
      }),
    [wardrobe, weather, occasion, style, selectedRuleId, allowCatalogFill]
  );

  const activeStyleMeta = STYLE_OPTIONS.find((s) => s.id === style);

  const handleSelectRule = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    const rule = COLOR_COMBINATION_RULES.find((r) => r.id === ruleId);
    if (rule) {
      setStyle(rule.preferredStyle);
    }
  };

  const handleSave = (rec: OutfitRecommendation) => {
    const result = onSaveRecommendedOutfit(rec.title, rec.layers);
    if (result.ok) {
      setSavedIds((prev) => (prev.includes(rec.id) ? prev : [...prev, rec.id]));
    }
  };

  return (
    <section
      aria-label="Kombin Öner Stüdyosu"
      className="rounded-2xl bg-[#FAF8F4] border border-[#1A1816]/10 p-6 sm:p-8 space-y-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#1A1816]/10">
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase text-[#6A635A] inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Kişisel Stil Algoritması</span>
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#1A1816] mt-1">
            Kombin Öner
          </h2>
          <p className="text-sm text-[#6A635A] mt-1.5 max-w-2xl">
            {wardrobe.length > 0
              ? `Gardırobunuzdaki ${wardrobe.length} parça renk harmonisi, kumaş kalınlığı ve ortam uyumuna göre analiz edilir.`
              : 'Gardırobunuzda henüz parça olmadığı için seçtiğiniz hava, etkinlik ve renk formülüne göre koleksiyondan başlangıç kombinleri hazırlanır.'}
          </p>
        </div>

        <label className="inline-flex items-center gap-2.5 text-xs text-[#1A1816] cursor-pointer select-none shrink-0">
          <input
            type="checkbox"
            checked={allowCatalogFill}
            onChange={(e) => setAllowCatalogFill(e.target.checked)}
            className="w-4 h-4 accent-[#1A1816] rounded"
          />
          <span>Eksik katmanları koleksiyondan tamamla</span>
        </label>
      </div>

      {/* 3-Column Criteria Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather */}
        <div className="space-y-2.5">
          <span className="block text-[11px] tracking-[0.14em] uppercase font-medium text-[#6A635A]">
            Hava Durumu
          </span>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Hava durumu seçimi">
            {WEATHER_OPTIONS.map((opt) => {
              const active = weather === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setWeather(opt.id)}
                  aria-pressed={active}
                  className={`px-3 py-2.5 rounded-xl text-left border transition-colors ${
                    active
                      ? 'bg-[#1A1816] text-[#F5F2EC] border-[#1A1816]'
                      : 'bg-white text-[#1A1816] border-[#1A1816]/12 hover:border-[#1A1816]/35'
                  }`}
                >
                  <span className="block text-xs font-medium">{opt.label}</span>
                  <span
                    className={`block text-[10px] mt-0.5 ${
                      active ? 'text-[#F5F2EC]/75' : 'text-[#6A635A]'
                    }`}
                  >
                    {opt.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Occasion */}
        <div className="space-y-2.5">
          <span className="block text-[11px] tracking-[0.14em] uppercase font-medium text-[#6A635A]">
            Etkinlik &amp; Ortam
          </span>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Etkinlik seçimi">
            {OCCASION_OPTIONS.map((opt) => {
              const active = occasion === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOccasion(opt.id)}
                  aria-pressed={active}
                  className={`px-3 py-3 rounded-xl text-left border text-xs font-medium transition-colors ${
                    active
                      ? 'bg-[#1A1816] text-[#F5F2EC] border-[#1A1816]'
                      : 'bg-white text-[#1A1816] border-[#1A1816]/12 hover:border-[#1A1816]/35'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Style & Color Direction */}
        <div className="space-y-2.5">
          <span className="block text-[11px] tracking-[0.14em] uppercase font-medium text-[#6A635A]">
            Stil &amp; Doku Yönü
          </span>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Stil seçimi">
            {STYLE_OPTIONS.map((opt) => {
              const active = style === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStyle(opt.id)}
                  aria-pressed={active}
                  className={`px-3 py-2.5 rounded-xl text-left border transition-colors ${
                    active
                      ? 'bg-[#1A1816] text-[#F5F2EC] border-[#1A1816]'
                      : 'bg-white text-[#1A1816] border-[#1A1816]/12 hover:border-[#1A1816]/35'
                  }`}
                >
                  <span className="block text-xs font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
          {activeStyleMeta && (
            <p className="text-[11px] text-[#6A635A] leading-relaxed">
              Stil odağı: {activeStyleMeta.colorFocus}
            </p>
          )}
        </div>
      </div>

      {/* Curated Two-Tone Color Combination Rules Matrix */}
      <div className="pt-5 border-t border-[#1A1816]/10 space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#6A635A]" aria-hidden="true" />
            <span className="text-[11px] tracking-[0.14em] uppercase font-medium text-[#6A635A]">
              Kürasyonlu Renk Formülleri ({COLOR_COMBINATION_RULES.length})
            </span>
          </div>

          <div
            role="group"
            aria-label="Renk formülü kategorileri"
            className="flex flex-wrap items-center gap-1.5"
          >
            {COLOR_RULE_CATEGORIES.map((cat) => {
              const active = ruleCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setRuleCategory(cat.id)}
                  aria-pressed={active}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[#1A1816] text-[#F5F2EC] border-[#1A1816]'
                      : 'bg-white text-[#554F47] border-[#1A1816]/12 hover:text-[#1A1816]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}

            {selectedRuleId !== 'auto' && (
              <button
                type="button"
                onClick={() => setSelectedRuleId('auto')}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium border border-[#1A1816]/20 text-[#1A1816] bg-[#EBE7DF] hover:bg-[#DFD9CE] inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Otomatik Analiz</span>
              </button>
            )}
          </div>
        </div>

        <div
          role="group"
          aria-label="İkili renk kombinasyonu seçimi"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2"
        >
          {visibleRules.map((rule) => {
            const isSelected = selectedRuleId === rule.id;
            return (
              <button
                key={rule.id}
                type="button"
                onClick={() =>
                  isSelected ? setSelectedRuleId('auto') : handleSelectRule(rule.id)
                }
                aria-pressed={isSelected}
                className={`px-2.5 py-2 rounded-xl border text-left transition-colors flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#1A1816] text-[#F5F2EC] border-[#1A1816]'
                    : 'bg-white text-[#1A1816] border-[#1A1816]/12 hover:border-[#1A1816]/40'
                }`}
              >
                <span className="inline-flex items-center -space-x-1.5 shrink-0" aria-hidden="true">
                  <span
                    style={{ backgroundColor: rule.primary.hex }}
                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                  />
                  <span
                    style={{ backgroundColor: rule.secondary.hex }}
                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                  />
                </span>
                <span className="text-[11px] font-medium truncate">{rule.label}</span>
              </button>
            );
          })}
        </div>

        {activeRule && (
          <div className="p-4 rounded-xl bg-white border border-[#1A1816]/12 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center -space-x-1" aria-hidden="true">
                  <span
                    style={{ backgroundColor: activeRule.primary.hex }}
                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                  />
                  <span
                    style={{ backgroundColor: activeRule.secondary.hex }}
                    className="w-4 h-4 rounded-full border border-white shadow-xs"
                  />
                </span>
                <p className="text-xs font-semibold text-[#1A1816]">
                  {activeRule.label} · Stil Kuralı
                </p>
              </div>
              <p className="text-xs text-[#554F47]">{activeRule.styleTip}</p>
            </div>

            <div className="text-[11px] text-[#6A635A] flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 shrink-0">
              <span>
                <strong className="font-medium text-[#1A1816]">Erkek:</strong> {activeRule.menLook}
              </span>
              <span className="hidden sm:inline" aria-hidden="true">
                ·
              </span>
              <span>
                <strong className="font-medium text-[#1A1816]">Kadın:</strong> {activeRule.womenLook}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations Grid */}
      {recommendations.length === 0 ? (
        <div className="p-8 rounded-xl bg-white border border-[#1A1816]/10 text-center space-y-2">
          <p className="font-serif text-xl text-[#1A1816]">
            Yalnızca gardırobunuzdaki parçalarla eşleşme bulunamadı.
          </p>
          <p className="text-xs text-[#6A635A]">
            Gardırobunuza daha fazla parça ekleyin veya &ldquo;Eksik katmanları koleksiyondan tamamla&rdquo; seçeneğini açın.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {recommendations.map((rec, index) => {
            const isSaved = savedIds.includes(rec.id);
            const total = calculateOutfitTotal(rec.layers, PRODUCTS);

            return (
              <article
                key={rec.id}
                className="bg-white border border-[#1A1816]/10 rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Editorial Metadata Line (Zero-pill discipline) */}
                  <div className="flex items-center justify-between gap-2 text-[11px] tracking-[0.1em] uppercase text-[#6A635A] tabular-nums">
                    <span>
                      0{index + 1} · %{rec.score} Uyum
                    </span>
                    <span>
                      {rec.wardrobeMatchCount > 0
                        ? `${rec.wardrobeMatchCount}/${rec.pieces.length} Gardırobundan`
                        : 'Koleksiyon Önerisi'}
                    </span>
                  </div>

                  <h3 className="font-serif text-xl text-[#1A1816] mt-1.5">
                    {rec.title}
                  </h3>

                  {/* Color Combination Palette Bar */}
                  <div className="mt-3 flex items-center gap-2.5">
                    <div className="flex items-center -space-x-1.5">
                      {rec.colorPalette.map((color, idx) => (
                        <span
                          key={`${color.name}-${idx}`}
                          title={color.name}
                          style={{ backgroundColor: color.hex }}
                          className="w-5 h-5 rounded-full border-2 border-white shadow-xs"
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-[#1A1816]">
                      {rec.harmonyLabel}
                    </span>
                  </div>

                  {/* Pieces Thumbnails */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {rec.pieces.map((piece) => (
                      <div
                        key={`${piece.product.id}-${piece.slot}`}
                        className="rounded-lg bg-[#FAF8F4] border border-[#1A1816]/8 p-2 text-center"
                      >
                        <div className="relative aspect-square rounded bg-white p-1.5">
                          <img
                            src={piece.product.image}
                            alt={piece.product.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                          <span
                            title={piece.color.name}
                            style={{ backgroundColor: piece.color.hex }}
                            className="absolute bottom-1 right-1 w-3 h-3 rounded-full border border-white shadow-xs"
                          />
                        </div>
                        <p className="mt-1.5 text-[10px] font-medium text-[#1A1816] truncate">
                          {piece.product.name}
                        </p>
                        <p className="text-[9px] text-[#6A635A] truncate">
                          {piece.color.name} ·{' '}
                          {piece.source === 'wardrobe' ? 'Gardırobun' : 'Koleksiyon'}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="mt-4 text-xs text-[#554F47] leading-relaxed">
                    {rec.rationale}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#1A1816]/10 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-[#6A635A]">
                    <span>Renk Tonları: {rec.colorPalette.map((c) => c.name).join(' · ')}</span>
                    <span className="font-medium text-[#1A1816] tabular-nums shrink-0 ml-2">
                      {formatCurrencyTRY(total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onTryOutfitInStudio(rec.layers)}
                      className="flex-1 py-2.5 px-3 rounded-lg bg-[#1A1816] text-[#F5F2EC] text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-[#312D29] transition-colors whitespace-nowrap"
                    >
                      <Shirt className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Kabin&apos;de Dene</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave(rec)}
                      aria-label={`${rec.title} kombinini ${isSaved ? 'Kaydedildi' : 'Kaydet'}`}
                      className={`py-2.5 px-3 rounded-lg border text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
                        isSaved
                          ? 'bg-[#495A42] border-[#495A42] text-[#F5F2EC]'
                          : 'border-[#1A1816]/20 text-[#1A1816] hover:bg-[#EBE7DF]'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Kaydedildi</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Kaydet</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
