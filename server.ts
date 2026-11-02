/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  translateSubtitlesWithGemini,
  generateSubtitlesWithGemini,
  transcribeAudioWithGemini,
} from './server/apiRouter.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Reduz limite de payload para 25MB por segurança
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Rotas de API
app.get('/api/status', (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.json({
    status: 'ok',
    hasGeminiKey: isProd ? undefined : Boolean(process.env.GEMINI_API_KEY),
    service: 'LegendaFácil AI Core',
  });
});

app.post('/api/transcribe-audio', async (req, res) => {
  try {
    const {
      audioBase64,
      mimeType,
      duration,
      language,
      sourceLanguage,
      targetLanguage,
      promptTopic,
      chunkOffsetSeconds,
    } = req.body;
    const result = await transcribeAudioWithGemini({
      audioBase64,
      mimeType: mimeType || 'audio/wav',
      duration: Number(duration) || 0,
      language: language || 'pt-BR',
      sourceLanguage: sourceLanguage || 'auto',
      targetLanguage: targetLanguage || 'pt-BR',
      promptTopic,
      chunkOffsetSeconds: Number(chunkOffsetSeconds) || 0,
    });
    res.json(result);
  } catch (error: any) {
    console.error('Erro ao transcrever áudio com IA:', error);
    res.status(500).json({ error: error.message || 'Erro ao transcrever áudio' });
  }
});

app.post('/api/translate', async (req, res) => {
  try {
    const { cues, targetLanguage, sourceLanguage } = req.body;
    const result = await translateSubtitlesWithGemini(
      cues || [],
      targetLanguage || 'pt-BR',
      sourceLanguage || 'auto'
    );
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao traduzir legendas' });
  }
});

app.post('/api/generate', async (req, res) => {
  try {
    const { topicOrText, duration, language, engine } = req.body;
    const result = await generateSubtitlesWithGemini({
      topicOrText: topicOrText || 'Vídeo promocional para redes sociais',
      duration: Number(duration) || 15,
      language: language || 'pt-BR',
      engine: engine || 'gemini',
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao gerar legendas' });
  }
});

// Handler 404 para rotas de API não encontradas
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'not_found' });
});

// Arquivos estáticos gerados pelo Vite
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Guard para rotas SPA (não intercepta /api/)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor BFF LegendaFácil AI rodando na porta ${port}`);
});

// Timeout global de 60 segundos
server.setTimeout(60_000);
