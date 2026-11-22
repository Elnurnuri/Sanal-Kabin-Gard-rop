import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '../data/catalog';
import { WardrobeItem } from '../types';
import {
  COLOR_COMBINATION_RULES,
  hexToHsl,
  recommendOutfits,
  scoreAgainstColorRule,
  scoreColorCombination,
  scoreWeatherFit,
} from './recommender';

function makeWardrobeItem(productId: string, colorIndex = 0): WardrobeItem {
  const product = PRODUCTS.find((p) => p.id === productId)!;
  return {
    id: `w-${productId}`,
    productId,
    selectedSize: product.sizes[0],
    selectedColor: product.colors[colorIndex] ?? product.colors[0],
    addedAt: '2026-11-22T11:30:00Z',
  };
}

test('hexToHsl converts neutral and chromatic colors accurately', () => {
  const black = hexToHsl('#141414');
  assert.equal(black.s, 0);
  assert.ok(black.l < 15);

  const blue = hexToHsl('#88B4DC');
  assert.ok(blue.h >= 195 && blue.h <= 220);
  assert.ok(blue.s > 30);
});

test('scoreColorCombination rewards monochrome neutral pairs under monochrome style', () => {
  const result = scoreColorCombination(
    [
      { name: 'Derin Siyah', hex: '#141414' },
      { name: 'Kireç Beyazı', hex: '#ECE8DF' },
    ],
    'monochrome'
  );
  assert.ok(result.score >= 90);
  assert.ok(result.harmonyLabel.length > 0);
});

test('scoreWeatherFit prefers water-resistant outerwear in rainy weather and lightweight base in warm weather', () => {
  const bomber = PRODUCTS.find((p) => p.id === 'nylon-bomber-navy')!;
  const linen = PRODUCTS.find((p) => p.id === 'linen-shirt-sky')!;

  const rainyBomber = scoreWeatherFit(
    [
      {
        product: bomber,
        size: 'M',
        color: bomber.colors[0],
        slot: 'outerwear',
        source: 'wardrobe',
      },
    ],
    'rainy'
  );

  const rainyLinen = scoreWeatherFit(
    [
      {
        product: linen,
        size: 'M',
        color: linen.colors[0],
        slot: 'base',
        source: 'wardrobe',
      },
    ],
    'rainy'
  );

  assert.ok(rainyBomber > rainyLinen);

  const warmLinen = scoreWeatherFit(
    [
      {
        product: linen,
        size: 'M',
        color: linen.colors[0],
        slot: 'base',
        source: 'wardrobe',
      },
    ],
    'warm'
  );
  assert.ok(warmLinen >= 90);
});

test('recommendOutfits prioritizes user wardrobe pieces and returns color palettes', () => {
  const wardrobe: WardrobeItem[] = [
    makeWardrobeItem('linen-shirt-sky'),
    makeWardrobeItem('chore-jacket-olive'),
    makeWardrobeItem('cocoa-crescent-bag'),
  ];

  const recommendations = recommendOutfits(wardrobe, PRODUCTS, {
    weather: 'breezy',
    occasion: 'gallery',
    style: 'smart-casual',
    allowCatalogFill: true,
    maxResults: 3,
  });

  assert.equal(recommendations.length, 3);
  assert.ok(recommendations[0].wardrobeMatchCount >= 2);
  assert.ok(recommendations[0].colorPalette.length >= 2);
  assert.ok(recommendations[0].rationale.includes('Serin & Rüzgarlı'));
  assert.equal(new Set(recommendations.map((r) => r.title)).size, 3);
});

test('recommendOutfits respects allowCatalogFill=false when wardrobe is empty', () => {
  const none = recommendOutfits([], PRODUCTS, {
    weather: 'cold',
    occasion: 'evening',
    style: 'monochrome',
    allowCatalogFill: false,
  });
  assert.equal(none.length, 0);

  const withFill = recommendOutfits([], PRODUCTS, {
    weather: 'cold',
    occasion: 'evening',
    style: 'monochrome',
    allowCatalogFill: true,
    maxResults: 2,
  });
  assert.equal(withFill.length, 2);
  assert.equal(withFill[0].wardrobeMatchCount, 0);
});

test('COLOR_COMBINATION_RULES includes signature pairings and scores matching outfits cleanly', () => {
  const requiredIds = [
    'kahve-krem',
    'bordo-siyah',
    'kamel-krem',
    'kamel-siyah',
    'mavi-kahve',
    'hardal-kahve',
    'lacivert-gri',
    'sari-lacivert',
  ];
  for (const id of requiredIds) {
    assert.ok(
      COLOR_COMBINATION_RULES.some((r) => r.id === id),
      `Missing rule ${id}`
    );
  }

  const bordoSiyah = COLOR_COMBINATION_RULES.find((r) => r.id === 'bordo-siyah')!;
  const matchedScore = scoreAgainstColorRule(
    [
      { name: 'Bordo', hex: '#6B1D2B' },
      { name: 'Derin Siyah', hex: '#141414' },
    ],
    bordoSiyah
  );
  assert.ok(matchedScore >= 95);

  const recs = recommendOutfits([], PRODUCTS, {
    weather: 'breezy',
    occasion: 'evening',
    style: 'tonal-contrast',
    colorRuleId: 'bordo-siyah',
    allowCatalogFill: true,
    maxResults: 3,
  });
  assert.equal(recs.length, 3);
  assert.equal(recs[0].harmonyLabel, 'Bordo + Siyah');
  assert.ok(recs[0].rationale.includes(bordoSiyah.styleTip));
  assert.ok(
    recs[0].colorPalette.some((c) => c.name === 'Bordo'),
    'Expected Bordo colorway in top recommendation'
  );
});
