import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTS } from '../data/catalog';
import {
  addItemToBag,
  addToWardrobe,
  applyProductToLayers,
  calculateBagTotal,
  calculateOutfitTotal,
  clampPlacement,
  createSavedOutfit,
  filterProducts,
  isProductInWardrobe,
  removeFromWardrobe,
  removeLayerSlot,
  updateBagQuantity,
} from './wardrobe';

test('filterProducts filters by category and Turkish search query', () => {
  const outerwear = filterProducts(PRODUCTS, 'outerwear');
  assert.ok(outerwear.length >= 2);
  assert.ok(outerwear.every((item) => item.category === 'outerwear'));

  const searchMatches = filterProducts(PRODUCTS, 'all', 'kanvas');
  assert.equal(searchMatches.length, 1);
  assert.equal(searchMatches[0].id, 'chore-jacket-olive');
});

test('clampPlacement bounds garment overlay coordinates safely', () => {
  const clamped = clampPlacement({
    xPct: 120,
    yPct: -5,
    widthPct: 5,
    rotationDeg: 45,
    opacity: 0.2,
  });
  assert.deepEqual(clamped, {
    xPct: 85,
    yPct: 5,
    widthPct: 15,
    rotationDeg: 20,
    opacity: 0.65,
  });
});

test('wardrobe prevents duplicate size+color entries and supports removal', () => {
  const jacket = PRODUCTS[0];
  let wardrobe = addToWardrobe([], jacket, 'L', jacket.colors[0], '2026-11-22T10:00:00Z');
  assert.equal(wardrobe.length, 1);
  assert.equal(isProductInWardrobe(wardrobe, jacket.id, 'L', jacket.colors[0].name), true);

  // Adding exact same item+size+color should not duplicate
  wardrobe = addToWardrobe(wardrobe, jacket, 'L', jacket.colors[0], '2026-11-22T10:01:00Z');
  assert.equal(wardrobe.length, 1);

  // Different size adds a distinct wardrobe entry
  wardrobe = addToWardrobe(wardrobe, jacket, 'M', jacket.colors[0], '2026-11-22T10:02:00Z');
  assert.equal(wardrobe.length, 2);

  wardrobe = removeFromWardrobe(wardrobe, wardrobe[0].id);
  assert.equal(wardrobe.length, 1);
});

test('applyProductToLayers combines base, outerwear, and accessory layers without overwriting distinct slots', () => {
  const shirt = PRODUCTS.find((p) => p.id === 'linen-shirt-sky')!;
  const jacket = PRODUCTS.find((p) => p.id === 'chore-jacket-olive')!;
  const bag = PRODUCTS.find((p) => p.id === 'cocoa-crescent-bag')!;

  let layers = applyProductToLayers({}, shirt, 'M', shirt.colors[0]);
  layers = applyProductToLayers(layers, jacket, 'L', jacket.colors[0]);
  layers = applyProductToLayers(layers, bag, 'M', bag.colors[0]);

  assert.equal(layers.base?.productId, 'linen-shirt-sky');
  assert.equal(layers.outerwear?.productId, 'chore-jacket-olive');
  assert.equal(layers.accessory?.productId, 'cocoa-crescent-bag');

  const total = calculateOutfitTotal(layers, PRODUCTS);
  assert.equal(total, shirt.price + jacket.price + bag.price);

  const withoutOuterwear = removeLayerSlot(layers, 'outerwear');
  assert.equal(withoutOuterwear.outerwear, undefined);
  assert.equal(withoutOuterwear.base?.productId, 'linen-shirt-sky');
});

test('createSavedOutfit validates non-empty name and at least one layer', () => {
  const shirt = PRODUCTS.find((p) => p.id === 'linen-shirt-sky')!;
  const emptyName = createSavedOutfit([], '   ', { base: { productId: shirt.id, size: 'M', color: shirt.colors[0], placement: shirt.defaultPlacement } }, false);
  assert.ok(emptyName.error);
  assert.equal(emptyName.outfits.length, 0);

  const emptyLayers = createSavedOutfit([], 'Galeri Kombini', {}, false);
  assert.ok(emptyLayers.error);

  const valid = createSavedOutfit(
    [],
    'Galeri Kombini',
    { base: { productId: shirt.id, size: 'M', color: shirt.colors[0], placement: shirt.defaultPlacement } },
    true,
    '2026-11-22T11:00:00Z'
  );
  assert.equal(valid.error, undefined);
  assert.equal(valid.outfits.length, 1);
  assert.equal(valid.outfits[0].usingCustomPhoto, true);
});

test('bag quantity and subtotal calculations stay accurate', () => {
  const shirt = PRODUCTS.find((p) => p.id === 'linen-shirt-sky')!;
  let bag = addItemToBag([], shirt.id, 'M', shirt.colors[0]);
  bag = addItemToBag(bag, shirt.id, 'M', shirt.colors[0]);
  assert.equal(bag[0].quantity, 2);
  assert.equal(calculateBagTotal(bag, PRODUCTS), shirt.price * 2);

  bag = updateBagQuantity(bag, 0, -2);
  assert.equal(bag.length, 0);
  assert.equal(calculateBagTotal(bag, PRODUCTS), 0);
});
