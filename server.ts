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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rotas de API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
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

// Arquivos estáticos gerados pelo Vite
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor LegendaFácil AI rodando na porta ${port}`);
});
