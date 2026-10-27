import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import {
  translateSubtitlesWithGemini,
  generateSubtitlesWithGemini,
  transcribeAudioWithGemini,
} from './server/apiRouter.ts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function apiPlugin(): Plugin {
  return {
    name: 'api-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const data = body ? JSON.parse(body) : {};

            if (req.url === '/api/transcribe-audio' && req.method === 'POST') {
              const result = await transcribeAudioWithGemini({
                audioBase64: data.audioBase64,
                mimeType: data.mimeType || 'audio/wav',
                duration: Number(data.duration) || 0,
                language: data.language || 'pt-BR',
                promptTopic: data.promptTopic || '',
                chunkOffsetSeconds: Number(data.chunkOffsetSeconds) || 0,
              });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
              return;
            }

            if (req.url === '/api/translate' && req.method === 'POST') {
              const result = await translateSubtitlesWithGemini(data.cues || [], data.targetLanguage || 'pt-BR');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
              return;
            }

            if (req.url === '/api/generate' && req.method === 'POST') {
              const result = await generateSubtitlesWithGemini({
                topicOrText: data.topicOrText || 'Vídeo promocional para redes sociais',
                duration: data.duration || 15,
                language: data.language || 'pt-BR',
                engine: data.engine || 'gemini',
              });
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
              return;
            }

            if (req.url === '/api/status' || req.url === '/api/health') {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) }));
              return;
            }

            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Endpoint não encontrado' }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Erro interno no servidor' }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
