import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/analyze-fit', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error:
          'Akıllı beden hizalama servisi için sunucu API anahtarı yapılandırılmamış. Manuel ölçek ve konum kaydırıcıları ile kıyafeti üzerinize yerleştirebilirsiniz.',
      });
      return;
    }

    const { imageDataUrl, productName, categoryLabel, category } = req.body ?? {};
    if (typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/')) {
      res.status(400).json({ error: 'Geçerli bir fotoğraf yüklenmedi.' });
      return;
    }

    const match = imageDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      res.status(400).json({ error: 'Fotoğraf formatı okunamadı.' });
      return;
    }

    const mimeType = match[1];
    const base64Data = match[2];

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = [
        `Sen lüks bir moda stüdyosunda çalışan sanal terzi asistanısın.`,
        `Kullanıcının yüklediği fotoğraftaki kişinin duruşunu analiz et ve "${productName}" (${categoryLabel}, kategori: ${category}) parçasını kişinin üzerine yerleştirmek için en uygun normalize edilmiş kanvas koordinatlarını hesapla.`,
        `Koordinatlar görüntünün yüzdesi (0-100) cinsindendir:`,
        `- xPct: Ürünün yatay merkez konumu (genelde kişinin gövde merkezi, 15 ile 85 arası)`,
        `- yPct: Ürünün üst kenarının dikey konumu (üst giyim/dış giyim/elbise için omuz hizası, çanta/aksesuar için kol veya omuz yanı, 5 ile 75 arası)`,
        `- widthPct: Ürünün kanvas genişliğine oranı (üst giyim için omuz genişliğinin ~1.15 katı; aksesuar çanta için ~18-28 arası)`,
        `- rotationDeg: Omuz eğimine göre hafif açı (-15 ile 15 arası)`,
        `- recommendedSize: S, M, L veya XL`,
        `- fitNote: Türkçe kısa, samimi ve profesyonel 1-2 cümlelik kalıp ve kombin önerisi.`,
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              xPct: { type: Type.NUMBER },
              yPct: { type: Type.NUMBER },
              widthPct: { type: Type.NUMBER },
              rotationDeg: { type: Type.NUMBER },
              recommendedSize: { type: Type.STRING },
              fitNote: { type: Type.STRING },
            },
            required: ['xPct', 'yPct', 'widthPct', 'rotationDeg', 'recommendedSize', 'fitNote'],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      const validSizes = ['S', 'M', 'L', 'XL'];
      const recommendedSize = validSizes.includes(parsed.recommendedSize)
        ? parsed.recommendedSize
        : 'M';

      res.json({
        placement: {
          xPct: Number(parsed.xPct) || 50,
          yPct: Number(parsed.yPct) || 26,
          widthPct: Number(parsed.widthPct) || 48,
          rotationDeg: Number(parsed.rotationDeg) || 0,
          opacity: 0.96,
        },
        recommendedSize,
        fitNote:
          typeof parsed.fitNote === 'string' && parsed.fitNote.trim()
            ? parsed.fitNote.trim()
            : 'Omuz hattına göre dengeli bir kalıp önerildi.',
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Beden analizi sırasında bir hata oluştu.';
      res.status(502).json({
        error: `Akıllı hizalama tamamlanamadı: ${message}`,
      });
    }
  });

  if (isProduction) {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VARDE server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
