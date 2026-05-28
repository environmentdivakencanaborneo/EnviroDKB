/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Initialize Google GenAI on the server to protect credentials
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // API endpoint for generating comprehensive regulatory compliance analyses
  app.post('/api/generate-compliance-report', async (req, res) => {
    try {
      const { environmentalRecords, wasteIncoming, wasteOutgoing, nursery, reclamation } = req.body;

      const prompt = `
Anda adalah seorang Auditor Lingkungan Pertambangan Batubara profesional khusus regulasi di Indonesia (Kepmen LH No. 113 Tahun 2003, standar air tambang, pengelolaan limbah B3, dan standar revegetasi areal reklamasi).
Analisis data pemantauan lingkungan dari PT Diva Kencana Borneo berikut ini:

1. Data Pemantauan Air & Curah Hujan (Pengolahan & Pemantauan Lingkungan):
${JSON.stringify(environmentalRecords || [], null, 2)}

2. Data Limbah B3 Masuk:
${JSON.stringify(wasteIncoming || [], null, 2)}

3. Data Limbah B3 Keluar:
${JSON.stringify(wasteOutgoing || [], null, 2)}

4. Data Inventaris Nursery:
${JSON.stringify(nursery || [], null, 2)}

5. Data Reklamasi Lahan Tambang:
${JSON.stringify(reclamation || [], null, 2)}

Buat analisis kepatuhan (Compliance Report) yang komprehensif, mencakup:
1. **Ringkasan Status Kepatuhan (Compliance Executive Summary)**: Apakah PT Diva Kencana Borneo mematuhi baku mutu lingkungan? Nyatakan status Kepatuhan secara tegas (e.g., Kepatuhan 100%, terdapat Deviasi, atau Tidak Patuh). Nyatakan dengan visualisasi/warna status kepatuhan.
2. **Evaluasi Kualitas Air Tambang & Curah Hujan**: Analisis nilai pH (apakah masuk range baku mutu air tambang batubara yaitu 6-9?), TSS (apakah di bawah atau sama dengan batas standar 200 mg/L?), debit air, dan korelasi intensitas curah hujan terhadap debit & penggunaan koagulan (PAC/Alum/Polymer/dll).
3. **Audit Pengelolaan Limbah B3**: Evaluasi keseimbangan neraca limbah (Limbah Masuk vs Limbah Keluar) untuk melihat sisa stok yang disimpan di Tempat Penyimpanan Sementara (TPS), serta kepatuhan jangka waktu penyimpanan (maksimal 90-365 hari tergantung jenis limbah).
4. **Analisis Nursery & Keberhasilan Reklamasi**: Evaluasi ketersediaan bibit di pembibitan (nursery) terhadap kebutuhan/rencana penanaman di lapangan reklamasi, luasan lahan reklamasi, ketebalan topsoil (standar minimum >30 cm untuk tanaman keras), persentase kemajuan lereng, dan kesehatan revegetasi.
5. **Rekomendasi Tindakan Korektif (Corrective Actions)**: Berikan saran teknis operasional yang realistis (misal penyesuaian dosis koagulan, perbaikan drainase sediment pond, percepatan pemindahan limbah B3, atau peningkatan kapasitas nursery).

Gunakan bahasa Indonesia yang profesional, formal, dan mudah dipahami oleh manajemen operasional tambang batubara. Format respons dengan menggunakan Markdown yang rapi dengan heading, list, dan tabel jika diperlukan.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      res.json({ report: response.text });
    } catch (error: any) {
      console.error('Gemini API Error in generating report:', error);
      res.status(500).json({ error: error.message || 'Failed to generate report.' });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
});
