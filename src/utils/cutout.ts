const cutoutCache = new Map<string, string>();

/**
 * Strips near-white studio background pixels from isolated flat-lay garment photos
 * and erodes 1px white JPEG-compression halos so garments layer cleanly over user photos.
 */
export async function getTransparentGarmentCutout(imageUrl: string): Promise<string> {
  const cached = cutoutCache.get(imageUrl);
  if (cached) return cached;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const maxDim = 640;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const cornerBrightness = (data[0] + data[1] + data[2]) / 3;
        if (cornerBrightness < 220) {
          resolve(imageUrl);
          return;
        }

        const alphaMask = new Uint8ClampedArray(width * height);

        for (let p = 0; p < width * height; p++) {
          const i = p * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const minChannel = Math.min(r, g, b);
          const maxChannel = Math.max(r, g, b);
          const saturation = maxChannel - minChannel;

          if (minChannel > 232 && saturation < 24) {
            alphaMask[p] = 0;
          } else if (minChannel > 208 && saturation < 28) {
            const t = (232 - minChannel) / 24;
            alphaMask[p] = Math.round(Math.max(0, Math.min(1, t)) * 255);
          } else {
            alphaMask[p] = 255;
          }
        }

        // Erode 1px halo adjacent to transparent pixels when light-toned
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const p = y * width + x;
            if (alphaMask[p] === 0) continue;
            const hasTransparentNeighbor =
              alphaMask[p - 1] === 0 ||
              alphaMask[p + 1] === 0 ||
              alphaMask[p - width] === 0 ||
              alphaMask[p + width] === 0;
            if (hasTransparentNeighbor) {
              const i = p * 4;
              const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
              if (avg > 190) {
                alphaMask[p] = Math.min(alphaMask[p], 90);
              }
            }
          }
        }

        for (let p = 0; p < width * height; p++) {
          data[p * 4 + 3] = alphaMask[p];
        }

        ctx.putImageData(imageData, 0, 0);
        const cutoutDataUrl = canvas.toDataURL('image/png');
        cutoutCache.set(imageUrl, cutoutDataUrl);
        resolve(cutoutDataUrl);
      } catch {
        resolve(imageUrl);
      }
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}
