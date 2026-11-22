import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookmarkPlus,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  RotateCcw,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react';
import {
  formatCurrencyTRY,
  PRODUCTS,
  STUDIO_BACKDROP_URL,
  STUDIO_BASE_MODELS,
} from '../data/catalog';
import {
  ActiveLayers,
  ColorOption,
  FilterCategory,
  FitAnalysisResult,
  GarmentPlacement,
  GarmentSize,
  LayerSlot,
  Product,
  StudioGenderPreset,
  WardrobeItem,
} from '../types';
import { getTransparentGarmentCutout } from '../utils/cutout';
import {
  applyProductToLayers,
  clampPlacement,
  filterProducts,
  getLayerSlotForCategory,
  isProductInWardrobe,
  removeLayerSlot,
} from '../utils/wardrobe';

interface TryOnStudioProps {
  activeLayers: ActiveLayers;
  onChangeLayers: (next: ActiveLayers) => void;
  focusedProduct: Product;
  onSelectProduct: (product: Product) => void;
  wardrobe: WardrobeItem[];
  onAddToWardrobe: (product: Product, size: GarmentSize, color: ColorOption) => void;
  onAddToBag: (product: Product, size: GarmentSize, color: ColorOption) => void;
  onSaveOutfit: (name: string, layers: ActiveLayers, usingCustomPhoto: boolean) => {
    ok: boolean;
    error?: string;
  };
  customPhotoUrl: string | null;
  onChangeCustomPhoto: (url: string | null) => void;
  usingCustomPhoto: boolean;
  onChangeUsingCustomPhoto: (using: boolean) => void;
  onOpenRecommender: () => void;
}

const CATEGORY_TABS: { id: FilterCategory; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'tops', label: 'Üst Giyim' },
  { id: 'outerwear', label: 'Dış Giyim' },
  { id: 'dresses', label: 'Elbise & Set' },
  { id: 'accessories', label: 'Aksesuar' },
];

const SLOT_LABELS: Record<LayerSlot, string> = {
  base: 'Üst / Elbise',
  outerwear: 'Dış Giyim',
  accessory: 'Aksesuar',
};

export function TryOnStudio({
  activeLayers,
  onChangeLayers,
  focusedProduct,
  onSelectProduct,
  wardrobe,
  onAddToWardrobe,
  onAddToBag,
  onSaveOutfit,
  customPhotoUrl,
  onChangeCustomPhoto,
  usingCustomPhoto,
  onChangeUsingCustomPhoto,
  onOpenRecommender,
}: TryOnStudioProps) {
  const [category, setCategory] = useState<FilterCategory>('all');
  const [carouselOffset, setCarouselOffset] = useState(0);
  const [modelGender, setModelGender] = useState<StudioGenderPreset>(
    focusedProduct.preferredModel
  );
  const [selectedSize, setSelectedSize] = useState<GarmentSize>(
    focusedProduct.sizes[1] ?? focusedProduct.sizes[0]
  );
  const [selectedColor, setSelectedColor] = useState<ColorOption>(
    focusedProduct.colors[0]
  );

  // Cutout cache state so garment PNG overlays render cleanly
  const [cutouts, setCutouts] = useState<Record<string, string>>({});

  // Own-photo UI panels & fit states
  const [showAdjustPanel, setShowAdjustPanel] = useState(false);
  const [compareOriginal, setCompareOriginal] = useState(false);
  const [showSaveOutfitForm, setShowSaveOutfitForm] = useState(false);
  const [outfitNameInput, setOutfitNameInput] = useState('');
  const [outfitFeedback, setOutfitFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [fitAnalysis, setFitAnalysis] = useState<FitAnalysisResult | null>(null);
  const [fitLoading, setFitLoading] = useState(false);
  const [fitError, setFitError] = useState<string | null>(null);
  const [bagToast, setBagToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    slot: LayerSlot;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const filteredProducts = useMemo(
    () => filterProducts(PRODUCTS, category),
    [category]
  );

  // Sync size/color selection when focusedProduct changes
  useEffect(() => {
    setSelectedSize(
      focusedProduct.sizes.includes(selectedSize)
        ? selectedSize
        : focusedProduct.sizes[0]
    );
    setSelectedColor(focusedProduct.colors[0]);
    if (!usingCustomPhoto) {
      setModelGender(focusedProduct.preferredModel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedProduct.id]);

  // Precompute transparent garment cutouts for active layers
  useEffect(() => {
    const slots: LayerSlot[] = ['base', 'outerwear', 'accessory'];
    slots.forEach((slot) => {
      const layer = activeLayers[slot];
      if (!layer) return;
      const prod = PRODUCTS.find((p) => p.id === layer.productId);
      if (!prod || cutouts[prod.image]) return;
      void getTransparentGarmentCutout(prod.image).then((dataUrl) => {
        setCutouts((prev) => ({ ...prev, [prod.image]: dataUrl }));
      });
    });
  }, [activeLayers, cutouts]);

  const activeSlot = getLayerSlotForCategory(focusedProduct.category);
  const activeFocusedLayer = activeLayers[activeSlot];

  const handleWearProduct = (product: Product) => {
    const nextSize = product.sizes[1] ?? product.sizes[0];
    const nextColor = product.colors[0];
    onSelectProduct(product);
    setSelectedSize(nextSize);
    setSelectedColor(nextColor);
    setFitError(null);
    setFitAnalysis(null);
    onChangeLayers(applyProductToLayers(activeLayers, product, nextSize, nextColor));
  };

  const handleSizeChange = (size: GarmentSize) => {
    setSelectedSize(size);
    onChangeLayers(
      applyProductToLayers(
        activeLayers,
        focusedProduct,
        size,
        selectedColor,
        activeFocusedLayer?.placement
      )
    );
  };

  const handleColorChange = (color: ColorOption) => {
    setSelectedColor(color);
    onChangeLayers(
      applyProductToLayers(
        activeLayers,
        focusedProduct,
        selectedSize,
        color,
        activeFocusedLayer?.placement
      )
    );
  };

  const handlePlacementChange = (patch: Partial<GarmentPlacement>) => {
    const basePlacement =
      activeFocusedLayer?.placement ?? focusedProduct.defaultPlacement;
    const nextPlacement = clampPlacement({ ...basePlacement, ...patch });
    onChangeLayers(
      applyProductToLayers(
        activeLayers,
        focusedProduct,
        selectedSize,
        selectedColor,
        nextPlacement
      )
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChangeCustomPhoto(reader.result);
        onChangeUsingCustomPhoto(true);
        setShowAdjustPanel(true);
        setCompareOriginal(false);
        setFitError(null);
        setFitAnalysis(null);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUseDemoSelfPhoto = async () => {
    // Load one of the crisp portrait photos as a convertible data URL so AI Fit works too
    try {
      const sampleUrl = STUDIO_BASE_MODELS[modelGender].image;
      const resp = await fetch(sampleUrl);
      const blob = await resp.blob();
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onChangeCustomPhoto(reader.result);
          onChangeUsingCustomPhoto(true);
          setShowAdjustPanel(true);
          setCompareOriginal(false);
        }
      };
      reader.readAsDataURL(blob);
    } catch {
      onChangeCustomPhoto(STUDIO_BASE_MODELS[modelGender].image);
      onChangeUsingCustomPhoto(true);
      setShowAdjustPanel(true);
    }
  };

  const handleAnalyzeFit = async () => {
    if (!customPhotoUrl) return;
    setFitLoading(true);
    setFitError(null);
    try {
      const response = await fetch('/api/analyze-fit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrl: customPhotoUrl,
          productName: focusedProduct.name,
          categoryLabel: focusedProduct.categoryLabel,
          category: focusedProduct.category,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setFitError(data.error || 'Beden hizalama servisi şu an yanıt vermiyor.');
        return;
      }
      const result = data as FitAnalysisResult;
      setFitAnalysis(result);
      const validSize = focusedProduct.sizes.includes(result.recommendedSize)
        ? result.recommendedSize
        : selectedSize;
      setSelectedSize(validSize);
      onChangeLayers(
        applyProductToLayers(
          activeLayers,
          focusedProduct,
          validSize,
          selectedColor,
          result.placement
        )
      );
    } catch {
      setFitError('Bağlantı hatası nedeniyle akıllı hizalama yapılamadı.');
    } finally {
      setFitLoading(false);
    }
  };

  const handleDragStart = (
    slot: LayerSlot,
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!usingCustomPhoto || compareOriginal) return;
    const layer = activeLayers[slot];
    if (!layer) return;
    const prod = PRODUCTS.find((p) => p.id === layer.productId);
    if (prod) onSelectProduct(prod);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      slot,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: layer.placement.xPct,
      origY: layer.placement.yPct,
    };
  };

  const handleDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dxPct = ((e.clientX - drag.startClientX) / rect.width) * 100;
    const dyPct = ((e.clientY - drag.startClientY) / rect.height) * 100;
    const layer = activeLayers[drag.slot];
    if (!layer) return;
    const prod = PRODUCTS.find((p) => p.id === layer.productId);
    if (!prod) return;
    onChangeLayers(
      applyProductToLayers(activeLayers, prod, layer.size, layer.color, {
        ...layer.placement,
        xPct: drag.origX + dxPct,
        yPct: drag.origY + dyPct,
      })
    );
  };

  const handleDragEnd = () => {
    dragStateRef.current = null;
  };

  const handleSubmitSaveOutfit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = onSaveOutfit(outfitNameInput, activeLayers, usingCustomPhoto);
    if (!result.ok) {
      setOutfitFeedback({
        type: 'error',
        text: result.error ?? 'Kombin kaydedilemedi.',
      });
      return;
    }
    setOutfitNameInput('');
    setOutfitFeedback({
      type: 'success',
      text: 'Kombin Gardırobunuza kaydedildi.',
    });
    setTimeout(() => {
      setShowSaveOutfitForm(false);
      setOutfitFeedback(null);
    }, 1800);
  };

  // Determine flanking cards (2 left, 2 right)
  const safeCount = filteredProducts.length;
  const getCarouselItem = (offset: number): Product | null => {
    if (safeCount === 0) return null;
    const idx = ((carouselOffset + offset) % safeCount + safeCount) % safeCount;
    return filteredProducts[idx];
  };

  const leftCards = [getCarouselItem(0), getCarouselItem(1)].filter(
    (p): p is Product => Boolean(p)
  );
  const rightCards = [getCarouselItem(2), getCarouselItem(3)].filter(
    (p): p is Product => Boolean(p)
  );

  // Determine which model base image to display when not in Own-Photo mode
  const studioModelImage = useMemo(() => {
    if (usingCustomPhoto && customPhotoUrl) return customPhotoUrl;
    // Prefer matched full-look photography when active base/outerwear matches a model look
    const outerwearProd = activeLayers.outerwear
      ? PRODUCTS.find((p) => p.id === activeLayers.outerwear?.productId)
      : null;
    const baseProd = activeLayers.base
      ? PRODUCTS.find((p) => p.id === activeLayers.base?.productId)
      : null;

    if (outerwearProd?.modelPreviewImage && outerwearProd.preferredModel === modelGender) {
      return outerwearProd.modelPreviewImage;
    }
    if (baseProd?.modelPreviewImage && baseProd.preferredModel === modelGender) {
      return baseProd.modelPreviewImage;
    }
    return STUDIO_BASE_MODELS[modelGender].image;
  }, [usingCustomPhoto, customPhotoUrl, activeLayers, modelGender]);

  // Decide which layers should be drawn as transparent overlays on top of the figure
  const overlaySlots: LayerSlot[] = useMemo(() => {
    const slots: LayerSlot[] = ['base', 'outerwear', 'accessory'];
    if (compareOriginal) return [];
    if (usingCustomPhoto) {
      return slots.filter((s) => Boolean(activeLayers[s]));
    }
    // In Studio Model Mode: overlay any layer that isn't already baked into the base model look photo,
    // and avoid drawing a base shirt over an outerwear jacket/blazer already rendered in the model look.
    const bakedIds = new Set([
      'chore-jacket-olive',
      'sage-satin-dress',
      'chalk-denim-set',
      'velvet-blazer-night',
    ]);
    const outerwearLayer = activeLayers.outerwear;
    const outerwearProd = outerwearLayer
      ? PRODUCTS.find((p) => p.id === outerwearLayer.productId)
      : null;
    const outerwearBaked =
      Boolean(outerwearProd) &&
      bakedIds.has(outerwearProd!.id) &&
      outerwearProd!.modelPreviewImage === studioModelImage;

    return slots.filter((slot) => {
      const layer = activeLayers[slot];
      if (!layer) return false;
      const prod = PRODUCTS.find((p) => p.id === layer.productId);
      if (!prod) return false;
      if (slot === 'base' && outerwearBaked) {
        return false;
      }
      const isBakedIntoPreview =
        prod.modelPreviewImage === studioModelImage && bakedIds.has(prod.id);
      return !isBakedIntoPreview;
    });
  }, [activeLayers, compareOriginal, studioModelImage, usingCustomPhoto]);

  const inWardrobe = isProductInWardrobe(
    wardrobe,
    focusedProduct.id,
    selectedSize,
    selectedColor.name
  );

  const activeLayerCount = (['base', 'outerwear', 'accessory'] as LayerSlot[]).filter(
    (slot) => Boolean(activeLayers[slot])
  ).length;

  return (
    <section
      aria-label="Sanal Deneme Stüdyosu"
      className="relative w-full overflow-hidden bg-[#D5C3AA]"
    >
      {/* Hidden File Input for Own Photo Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        aria-label="Kendi fotoğrafını yükle"
        className="sr-only"
      />

      {/* Full-Bleed Studio Arch Environment */}
      <div className="relative max-w-[1440px] mx-auto min-h-[700px] lg:min-h-[760px] flex flex-col justify-between">
        <img
          src={STUDIO_BACKDROP_URL}
          alt="VARDE stüdyo arka planı"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-[#1A1816]/20 via-transparent to-[#1A1816]/45 pointer-events-none"
        />

        {/* Top Category Segmented Bar */}
        <div className="relative z-20 pt-4 px-4 flex flex-col items-center gap-2">
          <div
            role="tablist"
            aria-label="Kategori filtreleri"
            className="inline-flex items-center gap-1 p-1 rounded-full bg-[#F5F2EC]/90 backdrop-blur-md border border-[#1A1816]/10 shadow-sm max-w-full overflow-x-auto flex-nowrap"
          >
            {CATEGORY_TABS.map((tab) => {
              const isSelected = category === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    setCategory(tab.id);
                    setCarouselOffset(0);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-[#1A1816] text-[#F5F2EC]'
                      : 'text-[#554F47] hover:text-[#1A1816]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Studio Stage: Left Dock + Flanking Cards + Central Try-On Figure */}
        <div className="relative z-20 flex-1 flex items-center justify-between px-4 sm:px-8 py-4 gap-4">
          {/* Left Floating Vertical Studio Dock */}
          <aside
            aria-label="Kabin araçları"
            className="hidden sm:flex flex-col gap-2.5 p-2 rounded-2xl bg-[#F5F2EC]/85 backdrop-blur-md border border-[#1A1816]/10 shadow-md w-48 shrink-0"
          >
            <p className="px-2 pt-1 text-[10px] tracking-[0.16em] uppercase text-[#6A635A] font-medium">
              Deneme Zemini
            </p>

            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => {
                  onChangeUsingCustomPhoto(false);
                  setModelGender('male');
                }}
                className={`px-2 py-2 rounded-lg text-[11px] font-medium transition-colors ${
                  !usingCustomPhoto && modelGender === 'male'
                    ? 'bg-[#1A1816] text-[#F5F2EC]'
                    : 'bg-white/70 text-[#1A1816] hover:bg-white'
                }`}
              >
                Erkek Model
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeUsingCustomPhoto(false);
                  setModelGender('female');
                }}
                className={`px-2 py-2 rounded-lg text-[11px] font-medium transition-colors ${
                  !usingCustomPhoto && modelGender === 'female'
                    ? 'bg-[#1A1816] text-[#F5F2EC]'
                    : 'bg-white/70 text-[#1A1816] hover:bg-white'
                }`}
              >
                Kadın Model
              </button>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium inline-flex items-center justify-center gap-2 transition-colors ${
                usingCustomPhoto
                  ? 'bg-[#1A1816] text-[#F5F2EC]'
                  : 'bg-white text-[#1A1816] border border-[#1A1816]/15 hover:bg-[#FAF8F4]'
              }`}
            >
              <Upload className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {customPhotoUrl ? 'Fotoğrafı Değiştir' : 'Kendi Fotoğrafın'}
              </span>
            </button>

            {!customPhotoUrl && (
              <button
                type="button"
                onClick={handleUseDemoSelfPhoto}
                className="w-full px-3 py-1.5 rounded-lg text-[11px] font-medium text-[#554F47] hover:text-[#1A1816] hover:bg-white/60 transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <Camera className="w-3 h-3" aria-hidden="true" />
                <span>Örnek Portreyle Dene</span>
              </button>
            )}

            {customPhotoUrl && (
              <button
                type="button"
                onClick={() => onChangeUsingCustomPhoto(!usingCustomPhoto)}
                className="w-full px-3 py-1.5 rounded-lg text-[11px] font-medium bg-white/70 text-[#1A1816] hover:bg-white transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <User className="w-3 h-3" aria-hidden="true" />
                <span>
                  {usingCustomPhoto ? 'Stüdyo Modeline Geç' : 'Fotoğrafıma Dön'}
                </span>
              </button>
            )}

            <div className="border-t border-[#1A1816]/10 pt-2 mt-0.5 space-y-1.5">
              <div className="px-1 flex items-center justify-between">
                <span className="text-[10px] tracking-[0.14em] uppercase text-[#6A635A] font-medium">
                  Üzerindeki Katmanlar ({activeLayerCount})
                </span>
              </div>

              {(['base', 'outerwear', 'accessory'] as LayerSlot[]).map((slot) => {
                const layer = activeLayers[slot];
                const prod = layer
                  ? PRODUCTS.find((p) => p.id === layer.productId)
                  : null;
                return (
                  <div
                    key={slot}
                    className="flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg bg-white/65 text-[11px]"
                  >
                    <div className="min-w-0">
                      <span className="block text-[9px] uppercase tracking-wider text-[#6A635A]">
                        {SLOT_LABELS[slot]}
                      </span>
                      <span className="block font-medium text-[#1A1816] truncate">
                        {prod ? prod.name : 'Boş'}
                      </span>
                    </div>
                    {prod && (
                      <button
                        type="button"
                        onClick={() => onChangeLayers(removeLayerSlot(activeLayers, slot))}
                        aria-label={`${prod.name} katmanını çıkar`}
                        className="w-5 h-5 rounded-full hover:bg-[#1A1816]/10 flex items-center justify-center text-[#554F47] shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowSaveOutfitForm((prev) => !prev);
                setOutfitFeedback(null);
              }}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-[#EBE7DF] hover:bg-[#DFD9CE] text-[#1A1816] text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <BookmarkPlus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Kombini Kaydet</span>
            </button>

            {showSaveOutfitForm && (
              <form onSubmit={handleSubmitSaveOutfit} className="space-y-1.5 pt-1">
                <label htmlFor="outfit-name-input" className="sr-only">
                  Kombin adı
                </label>
                <input
                  id="outfit-name-input"
                  type="text"
                  value={outfitNameInput}
                  onChange={(e) => setOutfitNameInput(e.target.value)}
                  placeholder="Örn: Galeri Kombini"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#1A1816]/15 rounded-lg text-[#1A1816] focus:outline-none focus:border-[#1A1816]"
                />
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-lg bg-[#1A1816] text-[#F5F2EC] text-[11px] font-medium"
                >
                  Gardıroba Kaydet
                </button>
                {outfitFeedback && (
                  <p
                    className={`text-[11px] leading-snug ${
                      outfitFeedback.type === 'error'
                        ? 'text-[#9E2A2B]'
                        : 'text-[#395233]'
                    }`}
                  >
                    {outfitFeedback.text}
                  </p>
                )}
              </form>
            )}

            <button
              type="button"
              onClick={onOpenRecommender}
              className="w-full px-3 py-2 rounded-xl bg-white/80 hover:bg-white border border-[#1A1816]/12 text-[#1A1816] text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Kombin Öner</span>
            </button>
          </aside>

          {/* Left Carousel Arrow + 2 Glass Garment Cards */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCarouselOffset((prev) => prev - 1)}
              aria-label="Önceki parçalar"
              className="w-9 h-9 rounded-full bg-[#F5F2EC]/80 backdrop-blur-md border border-[#1A1816]/15 flex items-center justify-center text-[#1A1816] hover:bg-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              {leftCards.map((prod, idx) => {
                const isActive = prod.id === focusedProduct.id;
                return (
                  <button
                    key={`${prod.id}-left-${idx}`}
                    type="button"
                    onClick={() => handleWearProduct(prod)}
                    aria-label={`${prod.name} ürününü üzerinde dene`}
                    className={`group text-left rounded-2xl p-2.5 backdrop-blur-md border transition-all duration-200 hover:-translate-y-0.5 ${
                      idx === 0 ? 'w-32 opacity-85' : 'w-40'
                    } ${
                      isActive
                        ? 'bg-white/95 border-[#1A1816] shadow-lg'
                        : 'bg-white/75 border-white/50 hover:bg-white/90'
                    }`}
                  >
                    <div className="aspect-square rounded-xl bg-white/90 overflow-hidden p-2">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                      />
                    </div>
                    <p className="mt-2 text-xs font-medium text-[#1A1816] truncate">
                      {prod.name}
                    </p>
                    <p className="text-[11px] text-[#554F47] tabular-nums">
                      {formatCurrencyTRY(prod.price)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Center Try-On Figure Canvas */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <div
              ref={stageRef}
              data-testid="tryon-canvas-stage"
              className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/40 bg-[#E6DDD0]"
            >
              <img
                src={studioModelImage}
                alt={
                  usingCustomPhoto
                    ? 'Yüklediğiniz kendi fotoğrafınız'
                    : `${STUDIO_BASE_MODELS[modelGender].label} sanal kabin görünümü`
                }
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top select-none"
              />

              {/* Layered Transparent Garment Cutouts */}
              {overlaySlots.map((slot) => {
                const layer = activeLayers[slot];
                if (!layer) return null;
                const prod = PRODUCTS.find((p) => p.id === layer.productId);
                if (!prod) return null;
                const overlaySrc = cutouts[prod.image] ?? prod.image;

                return (
                  <div
                    key={slot}
                    onPointerDown={(e) => handleDragStart(slot, e)}
                    onPointerMove={handleDragMove}
                    onPointerUp={handleDragEnd}
                    onPointerCancel={handleDragEnd}
                    style={{
                      left: `${layer.placement.xPct}%`,
                      top: `${layer.placement.yPct}%`,
                      width: `${layer.placement.widthPct}%`,
                      opacity: layer.placement.opacity,
                      transform: `translate(-50%, 0%) rotate(${layer.placement.rotationDeg}deg)`,
                      zIndex: slot === 'base' ? 10 : slot === 'outerwear' ? 20 : 30,
                    }}
                    className={`absolute select-none ${
                      usingCustomPhoto
                        ? 'cursor-grab active:cursor-grabbing'
                        : 'pointer-events-none'
                    }`}
                  >
                    <img
                      src={overlaySrc}
                      alt={`${prod.name} katmanı`}
                      draggable={false}
                      referrerPolicy="no-referrer"
                      className="w-full h-auto object-contain drop-shadow-[0_12px_20px_rgba(20,16,12,0.2)]"
                    />
                  </div>
                );
              })}

              {/* Top Right Quick Actions inside Canvas (Compare & Fine-tune when using custom photo) */}
              {usingCustomPhoto && (
                <div className="absolute top-3 right-3 z-40 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCompareOriginal((prev) => !prev)}
                    aria-pressed={compareOriginal}
                    className="px-2.5 py-1.5 rounded-full bg-[#1A1816]/80 text-[#F5F2EC] text-[11px] font-medium backdrop-blur-md inline-flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" aria-hidden="true" />
                    <span>{compareOriginal ? 'Kıyafeti Göster' : 'Orijinal'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdjustPanel((prev) => !prev)}
                    aria-expanded={showAdjustPanel}
                    aria-label="Kalıp ve konum ayarlarını aç"
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors ${
                      showAdjustPanel
                        ? 'bg-[#1A1816] text-[#F5F2EC]'
                        : 'bg-[#F5F2EC]/90 text-[#1A1816]'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Subtle Drag Hint in Own-Photo Mode */}
              {usingCustomPhoto && !compareOriginal && (
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full bg-[#1A1816]/75 text-[#F5F2EC] text-[10px] tracking-wide whitespace-nowrap backdrop-blur-sm pointer-events-none">
                  Kıyafeti fotoğraf üzerinde sürükleyerek hizalayın
                </div>
              )}
            </div>

            {/* Mobile Photo / Model / Outfit Controls Strip */}
            <div className="mt-3 flex sm:hidden flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-full bg-[#F5F2EC]/95 text-[#1A1816] text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{customPhotoUrl ? 'Fotoğrafı Değiştir' : 'Kendi Fotoğrafın'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeUsingCustomPhoto(false);
                  setModelGender((prev) => (prev === 'male' ? 'female' : 'male'));
                }}
                className="px-3.5 py-2 rounded-full bg-[#1A1816]/85 text-[#F5F2EC] text-xs font-medium whitespace-nowrap"
              >
                {modelGender === 'male' ? 'Kadın Model' : 'Erkek Model'}
              </button>
              <button
                type="button"
                onClick={() => setShowSaveOutfitForm((prev) => !prev)}
                className="px-3.5 py-2 rounded-full bg-[#EBE7DF] text-[#1A1816] text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <BookmarkPlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Kombin Kaydet ({activeLayerCount})</span>
              </button>
            </div>

            {showSaveOutfitForm && (
              <form
                onSubmit={handleSubmitSaveOutfit}
                className="mt-2 sm:hidden w-full max-w-[340px] p-3 rounded-xl bg-[#F5F2EC]/95 border border-[#1A1816]/15 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={outfitNameInput}
                    onChange={(e) => setOutfitNameInput(e.target.value)}
                    placeholder="Kombin adı..."
                    aria-label="Mobil kombin adı"
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-[#1A1816]/15 rounded-lg text-[#1A1816]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-[#1A1816] text-[#F5F2EC] text-xs font-medium whitespace-nowrap"
                  >
                    Kaydet
                  </button>
                </div>
                {outfitFeedback && (
                  <p
                    className={`text-[11px] ${
                      outfitFeedback.type === 'error'
                        ? 'text-[#9E2A2B]'
                        : 'text-[#395233]'
                    }`}
                  >
                    {outfitFeedback.text}
                  </p>
                )}
              </form>
            )}

            {usingCustomPhoto && showAdjustPanel && activeFocusedLayer && (
              <div className="mt-2 lg:hidden w-full max-w-[340px] rounded-2xl bg-[#F5F2EC]/95 backdrop-blur-md border border-[#1A1816]/15 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] tracking-[0.12em] uppercase font-semibold text-[#1A1816]">
                    Kalıp &amp; Hizalama
                  </span>
                  <button
                    type="button"
                    onClick={handleAnalyzeFit}
                    disabled={fitLoading}
                    className="px-3 py-1.5 rounded-lg bg-[#1A1816] text-[#F5F2EC] text-[11px] font-medium inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" aria-hidden="true" />
                    <span>{fitLoading ? 'Hizalanıyor...' : 'Akıllı Hizala'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px] text-[#554F47]">
                  <label className="block">
                    Ölçek (%{Math.round(activeFocusedLayer.placement.widthPct)})
                    <input
                      type="range"
                      min={15}
                      max={85}
                      value={activeFocusedLayer.placement.widthPct}
                      onChange={(e) =>
                        handlePlacementChange({ widthPct: Number(e.target.value) })
                      }
                      className="w-full accent-[#1A1816] mt-1"
                    />
                  </label>
                  <label className="block">
                    Dikey (%{Math.round(activeFocusedLayer.placement.yPct)})
                    <input
                      type="range"
                      min={5}
                      max={75}
                      value={activeFocusedLayer.placement.yPct}
                      onChange={(e) =>
                        handlePlacementChange({ yPct: Number(e.target.value) })
                      }
                      className="w-full accent-[#1A1816] mt-1"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Show Kalıp & Hizalama panel cleanly without overlapping cards when active in Own-Photo mode, else show 2 Glass Garment Cards */}
          {usingCustomPhoto && showAdjustPanel ? (
            <div className="hidden lg:block w-72 shrink-0 rounded-2xl bg-[#F5F2EC]/95 backdrop-blur-md border border-[#1A1816]/15 shadow-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs tracking-[0.12em] uppercase font-semibold text-[#1A1816]">
                  Kalıp &amp; Hizalama
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAdjustPanel(false)}
                  aria-label="Hizalama panelini kapat"
                  className="w-6 h-6 rounded-full hover:bg-[#1A1816]/10 flex items-center justify-center text-[#554F47]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleAnalyzeFit}
                disabled={fitLoading}
                className="w-full py-2 px-3 rounded-xl bg-[#1A1816] text-[#F5F2EC] text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-[#312D29] disabled:opacity-60 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {fitLoading ? 'Hizalanıyor...' : 'Akıllı Beden Hizalama'}
                </span>
              </button>

              {fitError && (
                <p className="text-[11px] text-[#9E2A2B] leading-relaxed" role="alert">
                  {fitError}
                </p>
              )}

              {fitAnalysis && (
                <div className="p-2.5 rounded-xl bg-white border border-[#1A1816]/10 text-[11px] space-y-1">
                  <p className="font-semibold text-[#1A1816]">
                    Önerilen Beden: {fitAnalysis.recommendedSize}
                  </p>
                  <p className="text-[#554F47] leading-relaxed">
                    {fitAnalysis.fitNote}
                  </p>
                </div>
              )}

              {activeFocusedLayer && (
                <div className="space-y-2.5 pt-1 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-[#554F47] mb-1">
                      <label htmlFor="fit-scale">Ölçek</label>
                      <span className="tabular-nums">
                        %{Math.round(activeFocusedLayer.placement.widthPct)}
                      </span>
                    </div>
                    <input
                      id="fit-scale"
                      type="range"
                      min={15}
                      max={85}
                      value={activeFocusedLayer.placement.widthPct}
                      onChange={(e) =>
                        handlePlacementChange({ widthPct: Number(e.target.value) })
                      }
                      className="w-full accent-[#1A1816]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-[#554F47] mb-1">
                      <label htmlFor="fit-y">Dikey Konum</label>
                      <span className="tabular-nums">
                        %{Math.round(activeFocusedLayer.placement.yPct)}
                      </span>
                    </div>
                    <input
                      id="fit-y"
                      type="range"
                      min={5}
                      max={75}
                      value={activeFocusedLayer.placement.yPct}
                      onChange={(e) =>
                        handlePlacementChange({ yPct: Number(e.target.value) })
                      }
                      className="w-full accent-[#1A1816]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-[#554F47] mb-1">
                      <label htmlFor="fit-rot">Eğim</label>
                      <span className="tabular-nums">
                        {activeFocusedLayer.placement.rotationDeg}°
                      </span>
                    </div>
                    <input
                      id="fit-rot"
                      type="range"
                      min={-20}
                      max={20}
                      value={activeFocusedLayer.placement.rotationDeg}
                      onChange={(e) =>
                        handlePlacementChange({ rotationDeg: Number(e.target.value) })
                      }
                      className="w-full accent-[#1A1816]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handlePlacementChange(focusedProduct.defaultPlacement)
                    }
                    className="w-full py-1.5 rounded-lg border border-[#1A1816]/15 text-[11px] font-medium text-[#1A1816] inline-flex items-center justify-center gap-1 hover:bg-white transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" aria-hidden="true" />
                    <span>Varsayılana Sıfırla</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-3">
                {rightCards.map((prod, idx) => {
                  const isActive = prod.id === focusedProduct.id;
                  return (
                    <button
                      key={`${prod.id}-right-${idx}`}
                      type="button"
                      onClick={() => handleWearProduct(prod)}
                      aria-label={`${prod.name} ürününü üzerinde dene`}
                      className={`group text-left rounded-2xl p-2.5 backdrop-blur-md border transition-all duration-200 hover:-translate-y-0.5 ${
                        idx === 1 ? 'w-32 opacity-85' : 'w-40'
                      } ${
                        isActive
                          ? 'bg-white/95 border-[#1A1816] shadow-lg'
                          : 'bg-white/75 border-white/50 hover:bg-white/90'
                      }`}
                    >
                      <div className="aspect-square rounded-xl bg-white/90 overflow-hidden p-2">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                        />
                      </div>
                      <p className="mt-2 text-xs font-medium text-[#1A1816] truncate">
                        {prod.name}
                      </p>
                      <p className="text-[11px] text-[#554F47] tabular-nums">
                        {formatCurrencyTRY(prod.price)}
                      </p>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCarouselOffset((prev) => prev + 1)}
                aria-label="Sonraki parçalar"
                className="w-9 h-9 rounded-full bg-[#F5F2EC]/80 backdrop-blur-md border border-[#1A1816]/15 flex items-center justify-center text-[#1A1816] hover:bg-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile/Tablet Product Picker Strip */}
        <div className="relative z-20 lg:hidden px-4 pb-2 flex items-center gap-2.5 overflow-x-auto">
          {filteredProducts.map((prod) => {
            const isActive = prod.id === focusedProduct.id;
            return (
              <button
                key={prod.id}
                type="button"
                onClick={() => handleWearProduct(prod)}
                className={`shrink-0 w-28 rounded-xl p-2 text-left backdrop-blur-md border transition-colors ${
                  isActive
                    ? 'bg-white border-[#1A1816]'
                    : 'bg-white/80 border-white/50'
                }`}
              >
                <div className="aspect-square rounded-lg bg-white p-1.5">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-[#1A1816] truncate">
                  {prod.name}
                </p>
                <p className="text-[10px] text-[#554F47] tabular-nums">
                  {formatCurrencyTRY(prod.price)}
                </p>
              </button>
            );
          })}
        </div>

        {/* Bottom Floating Glass Product Action Bar (Matches VARDE Screenshot Dock) */}
        <div className="relative z-20 pb-5 px-4 flex justify-center">
          <div className="w-full max-w-4xl rounded-2xl bg-[#F5F2EC]/92 backdrop-blur-md border border-white/60 shadow-xl px-4 py-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 sm:gap-4">
            {/* Active Product Summary */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-white border border-[#1A1816]/10 p-1 shrink-0">
                <img
                  src={focusedProduct.image}
                  alt={focusedProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-[#1A1816] truncate">
                  {focusedProduct.name}
                </h1>
                <p className="text-xs text-[#6A635A] tabular-nums whitespace-nowrap">
                  {formatCurrencyTRY(focusedProduct.price)} · {focusedProduct.categoryLabel}
                </p>
              </div>
            </div>

            {/* Size & Color Controls */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <div className="flex items-center gap-1.5" role="group" aria-label="Beden seçimi">
                {focusedProduct.sizes.map((sz) => {
                  const active = selectedSize === sz;
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleSizeChange(sz)}
                      aria-pressed={active}
                      className={`w-7 h-7 rounded-full text-[11px] font-medium transition-colors ${
                        active
                          ? 'bg-[#1A1816] text-[#F5F2EC]'
                          : 'bg-white/80 text-[#554F47] border border-[#1A1816]/15 hover:border-[#1A1816]'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5" role="group" aria-label="Renk seçimi">
                {focusedProduct.colors.map((color) => {
                  const active = selectedColor.name === color.name;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => handleColorChange(color)}
                      aria-label={`Renk: ${color.name}`}
                      aria-pressed={active}
                      style={{ backgroundColor: color.hex }}
                      className={`w-5 h-5 rounded-full border transition-transform ${
                        active
                          ? 'ring-2 ring-offset-2 ring-[#1A1816] border-white scale-105'
                          : 'border-[#1A1816]/25 hover:scale-105'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Primary Action: Save to Virtual Wardrobe (No Purchase Required) + Optional Bag */}
            <div className="flex items-center gap-2 shrink-0 ml-auto md:ml-0">
              <button
                type="button"
                onClick={() =>
                  onAddToWardrobe(focusedProduct, selectedSize, selectedColor)
                }
                className={`px-4 py-2 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  inWardrobe
                    ? 'bg-[#495A42] text-[#F5F2EC]'
                    : 'bg-[#1A1816] text-[#F5F2EC] hover:bg-[#312D29]'
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

              <button
                type="button"
                onClick={() => {
                  onAddToBag(focusedProduct, selectedSize, selectedColor);
                  setBagToast('Çantaya eklendi');
                  setTimeout(() => setBagToast(null), 1600);
                }}
                aria-label={`${focusedProduct.name} çantaya ekle`}
                className="px-3 py-2 rounded-xl border border-[#1A1816]/20 bg-white/80 text-[#1A1816] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-white transition-colors whitespace-nowrap shrink-0"
              >
                <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{bagToast ?? 'Sepete Ekle'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
