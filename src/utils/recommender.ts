import {
  ActiveLayers,
  ColorOption,
  GarmentSize,
  LayerSlot,
  Product,
  WardrobeItem,
} from '../types';
import { applyProductToLayers, getLayerSlotForCategory } from './wardrobe';

export type WeatherCondition = 'warm' | 'breezy' | 'rainy' | 'cold';
export type OccasionType = 'daily' | 'gallery' | 'evening' | 'travel';
export type StyleProfile = 'monochrome' | 'quiet-luxury' | 'smart-casual' | 'tonal-contrast';

export type ColorRuleCategory = 'all' | 'luxury-neutral' | 'bold-contrast' | 'classic-shirt';

export interface ColorCombinationRule {
  id: string;
  label: string;
  category: Exclude<ColorRuleCategory, 'all'>;
  primary: ColorOption;
  secondary: ColorOption;
  styleTip: string;
  menLook: string;
  womenLook: string;
  preferredStyle: StyleProfile;
  preferredOccasions: OccasionType[];
}

export interface RecommendationOptions {
  weather: WeatherCondition;
  occasion: OccasionType;
  style: StyleProfile;
  colorRuleId?: string | null;
  allowCatalogFill?: boolean;
  maxResults?: number;
}

export interface RecommendedPiece {
  product: Product;
  size: GarmentSize;
  color: ColorOption;
  slot: LayerSlot;
  source: 'wardrobe' | 'catalog';
}

export interface OutfitRecommendation {
  id: string;
  title: string;
  score: number;
  harmonyLabel: string;
  rationale: string;
  colorPalette: ColorOption[];
  pieces: RecommendedPiece[];
  layers: ActiveLayers;
  wardrobeMatchCount: number;
  ruleUsed?: ColorCombinationRule | null;
}

interface ProductProfile {
  /** 1 = lightweight/warm weather, 2 = all-season, 3 = layered/cool, 4 = cold/evening */
  warmth: 1 | 2 | 3 | 4;
  waterResistant?: boolean;
  occasions: OccasionType[];
  styles: StyleProfile[];
}

const PRODUCT_PROFILES: Record<string, ProductProfile> = {
  'chore-jacket-olive': {
    warmth: 3,
    occasions: ['daily', 'gallery', 'travel'],
    styles: ['smart-casual', 'quiet-luxury', 'tonal-contrast'],
  },
  'linen-shirt-sky': {
    warmth: 1,
    occasions: ['daily', 'gallery', 'travel'],
    styles: ['smart-casual', 'quiet-luxury'],
  },
  'breton-knit-ecru': {
    warmth: 2,
    occasions: ['daily', 'travel', 'gallery'],
    styles: ['smart-casual', 'monochrome', 'quiet-luxury'],
  },
  'nylon-bomber-navy': {
    warmth: 3,
    waterResistant: true,
    occasions: ['daily', 'travel'],
    styles: ['smart-casual', 'monochrome'],
  },
  'sage-satin-dress': {
    warmth: 2,
    occasions: ['gallery', 'evening'],
    styles: ['quiet-luxury', 'tonal-contrast'],
  },
  'cocoa-crescent-bag': {
    warmth: 2,
    occasions: ['daily', 'gallery', 'evening', 'travel'],
    styles: ['quiet-luxury', 'tonal-contrast', 'smart-casual', 'monochrome'],
  },
  'velvet-blazer-night': {
    warmth: 4,
    occasions: ['evening', 'gallery'],
    styles: ['monochrome', 'quiet-luxury'],
  },
  'chalk-denim-set': {
    warmth: 2,
    occasions: ['daily', 'gallery', 'travel'],
    styles: ['monochrome', 'quiet-luxury', 'smart-casual'],
  },
};

export const WEATHER_OPTIONS: { id: WeatherCondition; label: string; hint: string }[] = [
  { id: 'warm', label: 'Güneşli & Ilık', hint: 'Nefes alan tek katmanlar' },
  { id: 'breezy', label: 'Serin & Rüzgarlı', hint: 'Ceket ve triko katmanları' },
  { id: 'rainy', label: 'Yağmurlu', hint: 'Koruyucu dış giyim' },
  { id: 'cold', label: 'Soğuk Akşam', hint: 'Kalın dokular ve blazer' },
];

export const OCCASION_OPTIONS: { id: OccasionType; label: string }[] = [
  { id: 'daily', label: 'Günlük Şehir' },
  { id: 'gallery', label: 'Ofis & Galeri' },
  { id: 'evening', label: 'Akşam Daveti' },
  { id: 'travel', label: 'Hafta Sonu Seyahat' },
];

export const STYLE_OPTIONS: { id: StyleProfile; label: string; colorFocus: string }[] = [
  {
    id: 'quiet-luxury',
    label: 'Sessiz Lüks',
    colorFocus: 'Kireç, adaçayı, kakao ve sıcak taş tonları',
  },
  {
    id: 'monochrome',
    label: 'Minimalist Monokrom',
    colorFocus: 'Aynı renk ailesinden derinlikli ton geçişleri',
  },
  {
    id: 'smart-casual',
    label: 'Rahat Smart-Casual',
    colorFocus: 'Gök mavisi, zeytin haki ve lacivert dengesi',
  },
  {
    id: 'tonal-contrast',
    label: 'Toprak & Saten Kontrast',
    colorFocus: 'Mat kanvas veya deri ile akıcı saten uyumu',
  },
];

export const COLOR_RULE_CATEGORIES: { id: ColorRuleCategory; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'luxury-neutral', label: 'Lüks & Nötr' },
  { id: 'bold-contrast', label: 'Güçlü Kontrast' },
  { id: 'classic-shirt', label: 'Klasik Gömlek & Pantolon' },
];

export const COLOR_COMBINATION_RULES: ColorCombinationRule[] = [
  {
    id: 'kahve-krem',
    label: 'Kahve + Krem',
    category: 'luxury-neutral',
    primary: { name: 'Kahve Espresso', hex: '#492E23' },
    secondary: { name: 'Krem', hex: '#EFE9DE' },
    styleTip: 'Kahverengi ve krem her zaman zahmetsizce lüks durur.',
    menLook: 'Espresso triko veya polo + krem pileli pantolon',
    womenLook: 'Krem drapeli üst + koyu kahve geniş paça pantolon',
    preferredStyle: 'quiet-luxury',
    preferredOccasions: ['gallery', 'daily', 'evening'],
  },
  {
    id: 'kamel-krem',
    label: 'Kamel + Krem',
    category: 'luxury-neutral',
    primary: { name: 'Kamel', hex: '#B08962' },
    secondary: { name: 'Krem', hex: '#EFE9DE' },
    styleTip: 'Kamel ve krem sıcak ton geçişiyle sofistike bir görünüm kurar.',
    menLook: 'Kamel ceket + krem gömlek ve ekru pantolon',
    womenLook: 'Ekru üst + kamel pantolon ve omuz çantası',
    preferredStyle: 'quiet-luxury',
    preferredOccasions: ['gallery', 'travel', 'daily'],
  },
  {
    id: 'kamel-siyah',
    label: 'Kamel + Siyah',
    category: 'bold-contrast',
    primary: { name: 'Kamel', hex: '#B08962' },
    secondary: { name: 'Derin Siyah', hex: '#161616' },
    styleTip: 'Kamel ve siyah şıklığı bir üst seviyeye taşır.',
    menLook: 'Kamel dış ceket + siyah gömlek ve siyah pantolon',
    womenLook: 'Kamel triko + siyah geniş paça pantolon',
    preferredStyle: 'quiet-luxury',
    preferredOccasions: ['evening', 'gallery'],
  },
  {
    id: 'bordo-siyah',
    label: 'Bordo + Siyah',
    category: 'bold-contrast',
    primary: { name: 'Bordo', hex: '#6B1D2B' },
    secondary: { name: 'Derin Siyah', hex: '#141414' },
    styleTip: 'Bordo, siyah zeminle birleştiğinde çok daha güçlü görünür.',
    menLook: 'Bordo üst + siyah kesim pantolon ve kemer',
    womenLook: 'Bordo tek omuz veya bluz + siyah yüksek bel pantolon',
    preferredStyle: 'tonal-contrast',
    preferredOccasions: ['evening', 'gallery'],
  },
  {
    id: 'bordo-krem',
    label: 'Bordo + Krem',
    category: 'luxury-neutral',
    primary: { name: 'Bordo', hex: '#6B1D2B' },
    secondary: { name: 'Krem', hex: '#EFE9DE' },
    styleTip: 'Bordo ve krem klasik ve zamansız bir kontrast yaratır.',
    menLook: 'Bordo polo + omuzda krem triko ve krem pantolon',
    womenLook: 'Krem büstiyer/bluz + bordo geniş paça pantolon',
    preferredStyle: 'quiet-luxury',
    preferredOccasions: ['evening', 'gallery'],
  },
  {
    id: 'kahve-siyah',
    label: 'Kahve + Siyah',
    category: 'bold-contrast',
    primary: { name: 'Kahve Espresso', hex: '#492E23' },
    secondary: { name: 'Derin Siyah', hex: '#161616' },
    styleTip: 'Koyu kahve ve siyah ikilisi son derece pahalı ve net durur.',
    menLook: 'Siyah fit üst + koyu kahve pantolon ve çapraz çanta',
    womenLook: 'Siyah uzun kollu üst + koyu kahve pantolon',
    preferredStyle: 'tonal-contrast',
    preferredOccasions: ['evening', 'gallery', 'daily'],
  },
  {
    id: 'mavi-kahve',
    label: 'Mavi + Kahve',
    category: 'classic-shirt',
    primary: { name: 'Gök Mavisi', hex: '#88B4DC' },
    secondary: { name: 'Kahve Espresso', hex: '#492E23' },
    styleTip: 'Serin gök mavisi, koyu kahvenin sıcaklığıyla dengelenir.',
    menLook: 'Gök mavisi keten gömlek + koyu kahve pileli pantolon',
    womenLook: 'Koyu kahve ceket/bluz + açık mavi akıcı pantolon',
    preferredStyle: 'smart-casual',
    preferredOccasions: ['gallery', 'daily', 'travel'],
  },
  {
    id: 'mavi-beyaz',
    label: 'Mavi + Beyaz',
    category: 'classic-shirt',
    primary: { name: 'Gök Mavisi', hex: '#88B4DC' },
    secondary: { name: 'Saf Beyaz', hex: '#F4F3EF' },
    styleTip: 'Ferah mavi ve beyaz her mevsim temiz ve aydınlık durur.',
    menLook: 'Buz mavisi üst + beyaz keten pantolon ve sneaker',
    womenLook: 'Beyaz dokulu bluz + açık mavi pantolon ve çanta',
    preferredStyle: 'smart-casual',
    preferredOccasions: ['daily', 'travel'],
  },
  {
    id: 'yesil-beyaz',
    label: 'Yeşil + Beyaz',
    category: 'luxury-neutral',
    primary: { name: 'Zeytin Haki', hex: '#555E3F' },
    secondary: { name: 'Saf Beyaz', hex: '#F4F3EF' },
    styleTip: 'Zeytin yeşili ve beyaz birleştiğinde kombin bir üst seviyeye taşınır.',
    menLook: 'Zeytin keten gömlek + beyaz pileli pantolon',
    womenLook: 'Saf beyaz peplum/gömlek + zeytin geniş paça pantolon',
    preferredStyle: 'quiet-luxury',
    preferredOccasions: ['gallery', 'daily'],
  },
  {
    id: 'yesil-kahve',
    label: 'Yeşil + Kahve',
    category: 'luxury-neutral',
    primary: { name: 'Zeytin Haki', hex: '#555E3F' },
    secondary: { name: 'Kahve Espresso', hex: '#492E23' },
    styleTip: 'Toprak alt tonlu zeytin ve kahve doğal lüksü vurgular.',
    menLook: 'Zeytin gömlek + koyu kahve pantolon ve deri loafer',
    womenLook: 'Espresso üst + zeytin pantolon ve kapitone çanta',
    preferredStyle: 'tonal-contrast',
    preferredOccasions: ['gallery', 'evening', 'travel'],
  },
  {
    id: 'hardal-kahve',
    label: 'Hardal + Kahve',
    category: 'bold-contrast',
    primary: { name: 'Hardal Sarısı', hex: '#CFA04C' },
    secondary: { name: 'Kahve Espresso', hex: '#492E23' },
    styleTip: 'Hardal gömlek ve koyu kahve pantolon sıcak sonbahar katmanı kurar.',
    menLook: 'Hardal gömlek + beyaz tişört + koyu kahve bol pantolon',
    womenLook: 'Hardal gömlek + omuzda kahve triko + espresso pantolon',
    preferredStyle: 'tonal-contrast',
    preferredOccasions: ['daily', 'gallery', 'travel'],
  },
  {
    id: 'sari-lacivert',
    label: 'Sarı + Lacivert',
    category: 'bold-contrast',
    primary: { name: 'Tereyağı Sarısı', hex: '#E5C86B' },
    secondary: { name: 'Gece Laciverti', hex: '#1C2636' },
    styleTip: 'Tereyağı sarısı, derin lacivertle net ve modern bir kontrast yakalar.',
    menLook: 'Soft sarı tişört + lacivert pileli pantolon',
    womenLook: 'Lacivert kolsuz üst + sarı geniş paça pantolon',
    preferredStyle: 'smart-casual',
    preferredOccasions: ['daily', 'gallery'],
  },
  {
    id: 'bej-bordo',
    label: 'Bej + Bordo',
    category: 'luxury-neutral',
    primary: { name: 'Bej', hex: '#DFD5C3' },
    secondary: { name: 'Bordo', hex: '#6B1D2B' },
    styleTip: 'Sıcak bej, derin bordonun yoğunluğunu yumuşatarak öne çıkarır.',
    menLook: 'Bordo triko + omuzda bej kazak + bej pantolon',
    womenLook: 'Bej tül/korsaj bluz + bordo geniş pantolon',
    preferredStyle: 'quiet-luxury',
    preferredOccasions: ['gallery', 'evening'],
  },
  {
    id: 'bej-beyaz',
    label: 'Bej + Beyaz',
    category: 'luxury-neutral',
    primary: { name: 'Kum Beji', hex: '#C7B69B' },
    secondary: { name: 'Saf Beyaz', hex: '#F4F3EF' },
    styleTip: 'Bej ve beyaz en sade ve zahmetsiz monokrom lükslerden biridir.',
    menLook: 'Beyaz polo/sweat + bej pileli pantolon ve beyaz sneaker',
    womenLook: 'Bej blazer veya bluz + beyaz kesim pantolon',
    preferredStyle: 'monochrome',
    preferredOccasions: ['daily', 'travel', 'gallery'],
  },
  {
    id: 'sari-beyaz',
    label: 'Sarı + Beyaz',
    category: 'luxury-neutral',
    primary: { name: 'Tereyağı Sarısı', hex: '#E5C86B' },
    secondary: { name: 'Saf Beyaz', hex: '#F4F3EF' },
    styleTip: 'Pastel sarı ve beyaz güneşli günler için enerjik ve temiz bir seçimdir.',
    menLook: 'Pastel sarı tişört + beyaz denim pantolon',
    womenLook: 'Beyaz korse form bluz + sarı kumaş pantolon',
    preferredStyle: 'smart-casual',
    preferredOccasions: ['daily', 'travel'],
  },
  {
    id: 'lacivert-gri',
    label: 'Lacivert + Gri',
    category: 'classic-shirt',
    primary: { name: 'Gece Laciverti', hex: '#1C2636' },
    secondary: { name: 'Soğuk Gri', hex: '#9A9CA0' },
    styleTip: 'Mavi gömlek üstü lacivert triko ve gri pantolon şehirli katman sağlar.',
    menLook: 'Lacivert yarım fermuarlı triko + açık mavi gömlek + gri pantolon',
    womenLook: 'Lacivert triko süveter + mavi gömlek + gri pileli pantolon',
    preferredStyle: 'smart-casual',
    preferredOccasions: ['gallery', 'daily', 'travel'],
  },
  {
    id: 'lacivert-krem',
    label: 'Lacivert + Krem',
    category: 'classic-shirt',
    primary: { name: 'Gece Laciverti', hex: '#1C2636' },
    secondary: { name: 'Krem', hex: '#EFE9DE' },
    styleTip: 'Klasik denizci paleti her mevsim düzenli ve sofistike bir denge sunar.',
    menLook: 'Lacivert gömlek veya bomber + krem chino pantolon',
    womenLook: 'Krem saten veya triko katman + lacivert ceket',
    preferredStyle: 'smart-casual',
    preferredOccasions: ['daily', 'gallery', 'travel'],
  },
  {
    id: 'siyah-gri',
    label: 'Siyah + Gri',
    category: 'classic-shirt',
    primary: { name: 'Derin Siyah', hex: '#141414' },
    secondary: { name: 'Soğuk Gri', hex: '#9A9CA0' },
    styleTip: 'Keskin siyah ve soğuk gri zamansız minimalist şehir silueti kurar.',
    menLook: 'Siyah gömlek veya blazer + gri kumaş pantolon',
    womenLook: 'Siyah triko + gri geniş paça pantolon',
    preferredStyle: 'monochrome',
    preferredOccasions: ['gallery', 'evening', 'daily'],
  },
  {
    id: 'kiremit-lacivert',
    label: 'Kiremit + Lacivert',
    category: 'classic-shirt',
    primary: { name: 'Kiremit', hex: '#A64B2A' },
    secondary: { name: 'Gece Laciverti', hex: '#1C2636' },
    styleTip: 'Sıcak kiremit tonu, koyu lacivertle dinamik ama oturaklı durur.',
    menLook: 'Kiremit tonlu üst + koyu lacivert ceket veya pantolon',
    womenLook: 'Kiremit ceket + ekru iç katman + lacivert detaylar',
    preferredStyle: 'tonal-contrast',
    preferredOccasions: ['daily', 'gallery', 'travel'],
  },
  {
    id: 'orman-krem',
    label: 'Orman Yeşili + Krem',
    category: 'classic-shirt',
    primary: { name: 'Orman Yeşili', hex: '#1F4E37' },
    secondary: { name: 'Krem', hex: '#EFE9DE' },
    styleTip: 'Derin zümrüt/orman yeşili, krem nötrüyle seçkin bir kontrast oluşturur.',
    menLook: 'Koyu yeşil gömlek/bomber + krem pantolon',
    womenLook: 'Krem kireç set + orman yeşili dış katman',
    preferredStyle: 'quiet-luxury',
    preferredOccasions: ['gallery', 'evening', 'daily'],
  },
  {
    id: 'adacayi-gri',
    label: 'Adaçayı + Gri',
    category: 'classic-shirt',
    primary: { name: 'Adaçayı Yeşili', hex: '#8FA086' },
    secondary: { name: 'Soğuk Gri', hex: '#9A9CA0' },
    styleTip: 'Pastel adaçayı ve orta gri ton-sür-ton sakin bir atmosfer kurar.',
    menLook: 'Adaçayı dış giyim + gri gömlek/triko',
    womenLook: 'Adaçayı saten elbise + soğuk gri katman',
    preferredStyle: 'monochrome',
    preferredOccasions: ['gallery', 'daily'],
  },
  {
    id: 'antrasit-beyaz',
    label: 'Antrasit + Beyaz',
    category: 'classic-shirt',
    primary: { name: 'Antrasit', hex: '#2D2E30' },
    secondary: { name: 'Saf Beyaz', hex: '#F4F3EF' },
    styleTip: 'Kömür antrasit ve net beyaz keskin mimari kontrast sağlar.',
    menLook: 'Antrasit gömlek/ceket + beyaz alt katman',
    womenLook: 'Beyaz kesim set + antrasit dış giyim',
    preferredStyle: 'monochrome',
    preferredOccasions: ['gallery', 'evening', 'daily'],
  },
  {
    id: 'hardal-siyah',
    label: 'Hardal + Siyah',
    category: 'classic-shirt',
    primary: { name: 'Hardal Sarısı', hex: '#CFA04C' },
    secondary: { name: 'Derin Siyah', hex: '#141414' },
    styleTip: 'Sıcak hardal tonunu siyahla çerçevelemek modern ve iddialı görünür.',
    menLook: 'Hardal keten gömlek + siyah blazer veya bomber',
    womenLook: 'Hardal üst + siyah dış giyim ve deri çanta',
    preferredStyle: 'tonal-contrast',
    preferredOccasions: ['evening', 'gallery', 'daily'],
  },
  {
    id: 'lavanta-gri',
    label: 'Lavanta + Gri',
    category: 'classic-shirt',
    primary: { name: 'Lavanta', hex: '#C6AEE0' },
    secondary: { name: 'Soğuk Gri', hex: '#9A9CA0' },
    styleTip: 'Soft lavanta ve gri, gündüzden galeri açılışlarına uzanan taze bir dengedir.',
    menLook: 'Lavanta keten gömlek + soğuk gri katman',
    womenLook: 'Lavanta gömlek + gri ceket ve nötr aksesuar',
    preferredStyle: 'smart-casual',
    preferredOccasions: ['daily', 'gallery'],
  },
];

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

export function hexToHsl(hex: string): HslColor {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0');
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) {
    h = (g - b) / d + (g < b ? 6 : 0);
  } else if (max === g) {
    h = (b - r) / d + 2;
  } else {
    h = (r - g) / d + 4;
  }
  h /= 6;

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function isNeutralColor(hsl: HslColor): boolean {
  return hsl.s <= 20 || hsl.l <= 18 || hsl.l >= 86;
}

export function scoreColorCombination(
  colors: ColorOption[],
  style: StyleProfile
): { score: number; harmonyLabel: string } {
  if (colors.length === 0) {
    return { score: 0, harmonyLabel: 'Tek Parça' };
  }
  if (colors.length === 1) {
    return { score: 78, harmonyLabel: 'Tek Ton Sade Uyum' };
  }

  const hsls = colors.map((c) => hexToHsl(c.hex));
  const neutralCount = hsls.filter(isNeutralColor).length;

  let hueDiffSum = 0;
  let pairs = 0;
  let lightnessSpread = 0;

  for (let i = 0; i < hsls.length; i++) {
    for (let j = i + 1; j < hsls.length; j++) {
      const rawDiff = Math.abs(hsls[i].h - hsls[j].h);
      const circularDiff = Math.min(rawDiff, 360 - rawDiff);
      hueDiffSum += circularDiff;
      lightnessSpread = Math.max(lightnessSpread, Math.abs(hsls[i].l - hsls[j].l));
      pairs++;
    }
  }

  const avgHueDiff = pairs > 0 ? hueDiffSum / pairs : 0;

  if (neutralCount === hsls.length) {
    const bonus = style === 'monochrome' || style === 'quiet-luxury' ? 96 : 89;
    return {
      score: bonus,
      harmonyLabel:
        lightnessSpread >= 35
          ? 'Açık & Koyu Nötr Kontrast'
          : 'Monokrom Nötr Denge',
    };
  }

  if (neutralCount >= hsls.length - 1) {
    const bonus = style === 'quiet-luxury' || style === 'smart-casual' ? 94 : 88;
    return {
      score: bonus,
      harmonyLabel: 'Nötr Zemin + Vurgu Tonu',
    };
  }

  if (avgHueDiff <= 45) {
    return {
      score: style === 'tonal-contrast' ? 93 : 87,
      harmonyLabel: 'Analog Sıcak-Soğuk Geçiş',
    };
  }

  if (avgHueDiff >= 120) {
    return {
      score: style === 'tonal-contrast' ? 91 : 84,
      harmonyLabel: 'Tamamlayıcı Renk Kontrastı',
    };
  }

  return { score: 82, harmonyLabel: 'Dengeli Ton Uyumu' };
}

export function scoreWeatherFit(
  pieces: RecommendedPiece[],
  weather: WeatherCondition
): number {
  const hasOuterwear = pieces.some((p) => p.slot === 'outerwear');
  const maxWarmth = Math.max(
    ...pieces.map((p) => PRODUCT_PROFILES[p.product.id]?.warmth ?? 2)
  );
  const hasWaterResistant = pieces.some(
    (p) => PRODUCT_PROFILES[p.product.id]?.waterResistant
  );

  if (weather === 'warm') {
    if (!hasOuterwear && maxWarmth <= 2) return 96;
    if (maxWarmth <= 2) return 86;
    return 60;
  }
  if (weather === 'breezy') {
    if (hasOuterwear || maxWarmth === 3) return 94;
    if (pieces.length >= 2) return 85;
    return 72;
  }
  if (weather === 'rainy') {
    if (hasWaterResistant) return 98;
    if (hasOuterwear) return 86;
    return 62;
  }
  // cold
  if (hasOuterwear && maxWarmth >= 3) return 96;
  if (maxWarmth >= 3) return 85;
  return 64;
}

export function scoreOccasionFit(
  pieces: RecommendedPiece[],
  occasion: OccasionType,
  style: StyleProfile
): number {
  let total = 0;
  for (const piece of pieces) {
    const profile = PRODUCT_PROFILES[piece.product.id];
    if (!profile) {
      total += 70;
      continue;
    }
    const occMatch = profile.occasions.includes(occasion) ? 95 : 65;
    const styleMatch = profile.styles.includes(style) ? 96 : 74;
    total += (occMatch + styleMatch) / 2;
  }
  return Math.round(total / Math.max(1, pieces.length));
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0');
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

export function hexDistance(hexA: string, hexB: string): number {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function findClosestColorForRule(
  product: Product,
  rule: ColorCombinationRule,
  preferSecondary: boolean
): ColorOption {
  const targetHex = preferSecondary ? rule.secondary.hex : rule.primary.hex;
  const altHex = preferSecondary ? rule.primary.hex : rule.secondary.hex;
  let best = product.colors[0];
  let bestDist = Infinity;

  for (const c of product.colors) {
    const d1 = hexDistance(c.hex, targetHex);
    const d2 = hexDistance(c.hex, altHex) * 1.15;
    const score = Math.min(d1, d2);
    if (score < bestDist) {
      bestDist = score;
      best = c;
    }
  }
  return best;
}

export function scoreAgainstColorRule(
  colors: ColorOption[],
  rule: ColorCombinationRule
): number {
  if (colors.length === 0) return 50;
  let minPrimary = Infinity;
  let minSecondary = Infinity;
  let totalFit = 0;

  for (const c of colors) {
    const dPrimary = hexDistance(c.hex, rule.primary.hex);
    const dSecondary = hexDistance(c.hex, rule.secondary.hex);
    minPrimary = Math.min(minPrimary, dPrimary);
    minSecondary = Math.min(minSecondary, dSecondary);
    const bestForPiece = Math.min(dPrimary, dSecondary);
    totalFit += Math.max(40, 100 - bestForPiece * 0.35);
  }

  const avgPieceFit = totalFit / colors.length;
  const coversBoth = minPrimary < 95 && minSecondary < 95;
  const coversOne = minPrimary < 95 || minSecondary < 95;
  const coverageBonus = coversBoth ? 14 : coversOne ? 4 : -10;

  return Math.min(99, Math.max(45, Math.round(avgPieceFit + coverageBonus)));
}

function buildTurkishRationale(
  pieces: RecommendedPiece[],
  weather: WeatherCondition,
  occasion: OccasionType,
  style: StyleProfile,
  harmonyLabel: string,
  ruleUsed?: ColorCombinationRule | null
): string {
  const weatherLabel =
    WEATHER_OPTIONS.find((w) => w.id === weather)?.label ?? 'mevsim şartları';
  const occasionLabel =
    OCCASION_OPTIONS.find((o) => o.id === occasion)?.label ?? 'günlük plan';
  const styleLabel =
    STYLE_OPTIONS.find((s) => s.id === style)?.label ?? 'seçili stil';

  const colorNames = pieces.map((p) => p.color.name.toLocaleLowerCase('tr-TR'));
  const uniqueColors = Array.from(new Set(colorNames)).join(' ve ');
  const fabrics = Array.from(new Set(pieces.map((p) => p.product.fabric))).slice(0, 2);

  if (ruleUsed) {
    return `${ruleUsed.styleTip} ${weatherLabel} ve ${occasionLabel.toLocaleLowerCase('tr-TR')} için ${uniqueColors} tonlarıyla kurgulandı; ${fabrics.join(' ile ')} dokuları silueti dengeler.`;
  }

  return `${weatherLabel} ve ${occasionLabel.toLocaleLowerCase('tr-TR')} için ${styleLabel.toLocaleLowerCase('tr-TR')} çizgisinde ${uniqueColors} tonlarıyla kurulan ${harmonyLabel.toLocaleLowerCase('tr-TR')}. ${fabrics.join(' ile ')} dokuları bir arada dengeli bir siluet sunar.`;
}

function createCandidatePool(
  wardrobe: WardrobeItem[],
  catalog: Product[],
  allowCatalogFill: boolean,
  activeRule?: ColorCombinationRule | null
): RecommendedPiece[] {
  const pool: RecommendedPiece[] = [];
  const seenKeys = new Set<string>();

  for (const w of wardrobe) {
    const product = catalog.find((p) => p.id === w.productId);
    if (!product) continue;
    const key = `${product.id}::${w.selectedColor.name}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    pool.push({
      product,
      size: w.selectedSize,
      color: w.selectedColor,
      slot: getLayerSlotForCategory(product.category),
      source: 'wardrobe',
    });
  }

  if (allowCatalogFill) {
    for (const product of catalog) {
      const slot = getLayerSlotForCategory(product.category);
      const chosenColor = activeRule
        ? findClosestColorForRule(product, activeRule, slot === 'outerwear' || slot === 'accessory')
        : product.colors[0];

      const key = `${product.id}::${chosenColor.name}`;
      if (seenKeys.has(key)) continue;
      const hasAnyFromProduct = pool.some((item) => item.product.id === product.id);
      if (hasAnyFromProduct && !activeRule) continue;

      seenKeys.add(key);
      pool.push({
        product,
        size: product.sizes[1] ?? product.sizes[0],
        color: chosenColor,
        slot,
        source: 'catalog',
      });
    }
  }

  return pool;
}

export function recommendOutfits(
  wardrobe: WardrobeItem[],
  catalog: Product[],
  options: RecommendationOptions
): OutfitRecommendation[] {
  const {
    weather,
    occasion,
    style,
    colorRuleId = null,
    allowCatalogFill = true,
    maxResults = 3,
  } = options;

  const activeRule =
    colorRuleId && colorRuleId !== 'auto'
      ? COLOR_COMBINATION_RULES.find((r) => r.id === colorRuleId) ?? null
      : null;

  const pool = createCandidatePool(wardrobe, catalog, allowCatalogFill, activeRule);
  if (pool.length === 0) return [];

  const bases = pool.filter((p) => p.slot === 'base');
  const outers = pool.filter((p) => p.slot === 'outerwear');
  const accessories = pool.filter((p) => p.slot === 'accessory');

  const baseCandidates: (RecommendedPiece | null)[] = bases.length > 0 ? bases : [null];
  const outerCandidates: (RecommendedPiece | null)[] =
    weather === 'warm'
      ? [null, ...outers]
      : outers.length > 0
        ? [...outers, null]
        : [null];
  const accCandidates: (RecommendedPiece | null)[] =
    accessories.length > 0 ? [...accessories, null] : [null];

  const combinations: RecommendedPiece[][] = [];

  for (const base of baseCandidates) {
    for (const outer of outerCandidates) {
      for (const acc of accCandidates) {
        const combo = [base, outer, acc].filter(
          (item): item is RecommendedPiece => Boolean(item)
        );
        if (combo.length === 0) continue;
        // Avoid mixing dress-sets with unrelated menswear outerwear unless color/style aligns
        if (
          base?.product.category === 'dresses' &&
          outer &&
          outer.product.preferredModel !== base.product.preferredModel
        ) {
          continue;
        }
        combinations.push(combo);
      }
    }
  }

  const ranked: OutfitRecommendation[] = [];
  const seenSignatures = new Set<string>();

  for (const pieces of combinations) {
    const wardrobeMatchCount = pieces.filter((p) => p.source === 'wardrobe').length;
    if (wardrobe.length > 0 && !activeRule && wardrobeMatchCount === 0) {
      continue;
    }

    const signature = pieces
      .map((p) => `${p.product.id}:${p.color.name}`)
      .sort()
      .join('|');
    if (seenSignatures.has(signature)) continue;
    seenSignatures.add(signature);

    const colors = pieces.map((p) => p.color);
    const baseHarmony = scoreColorCombination(colors, style);
    const colorScore = activeRule
      ? scoreAgainstColorRule(colors, activeRule)
      : baseHarmony.score;
    const harmonyLabel = activeRule ? activeRule.label : baseHarmony.harmonyLabel;

    const weatherScore = scoreWeatherFit(pieces, weather);
    const occasionScore = scoreOccasionFit(pieces, occasion, style);

    // Reward multi-layer completeness (except warm weather where 1-2 pieces is ideal)
    const layerBonus =
      weather === 'warm'
        ? pieces.length <= 2
          ? 6
          : 0
        : pieces.length >= 2
          ? 8
          : -6;

    // Prioritize outfits built from the user's actual wardrobe
    const wardrobeRatio = wardrobeMatchCount / pieces.length;
    const wardrobeBonus =
      wardrobe.length > 0 ? Math.round(wardrobeRatio * (activeRule ? 6 : 12)) : 0;

    const finalScore = Math.min(
      99,
      Math.max(
        50,
        Math.round(
          colorScore * (activeRule ? 0.45 : 0.35) +
            weatherScore * (activeRule ? 0.25 : 0.3) +
            occasionScore * (activeRule ? 0.3 : 0.35) +
            layerBonus +
            wardrobeBonus -
            8
        )
      )
    );

    let layers: ActiveLayers = {};
    for (const p of pieces) {
      layers = applyProductToLayers(layers, p.product, p.size, p.color);
    }

    const title =
      pieces.length === 1
        ? pieces[0].product.name
        : pieces.length === 2
          ? `${pieces[0].product.name} & ${pieces[1].product.name}`
          : `${pieces[0].product.name} & ${pieces[1].product.name} · Tam Set`;

    ranked.push({
      id: `rec-${activeRule?.id ?? 'auto'}-${signature}`,
      title,
      score: finalScore,
      harmonyLabel,
      rationale: buildTurkishRationale(
        pieces,
        weather,
        occasion,
        style,
        harmonyLabel,
        activeRule
      ),
      colorPalette: colors,
      pieces,
      layers,
      wardrobeMatchCount,
      ruleUsed: activeRule,
    });
  }

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.wardrobeMatchCount - a.wardrobeMatchCount;
  });

  // Prefer diverse garment silhouettes before repeating the same base+outer pair
  const diverse: OutfitRecommendation[] = [];
  const usedCorePairs = new Set<string>();

  for (const item of ranked) {
    const coreKey = item.pieces
      .filter((p) => p.slot !== 'accessory')
      .map((p) => p.product.id)
      .sort()
      .join('+');
    if (!usedCorePairs.has(coreKey)) {
      usedCorePairs.add(coreKey);
      diverse.push(item);
      if (diverse.length >= maxResults) return diverse;
    }
  }

  for (const item of ranked) {
    if (!diverse.some((d) => d.id === item.id)) {
      diverse.push(item);
      if (diverse.length >= maxResults) break;
    }
  }

  return diverse;
}
