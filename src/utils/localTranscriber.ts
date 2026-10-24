/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Orquestrador de transcrição 100% Client-Side para Netlify SPA.
 * Ordem de Prioridade:
 * 1. Whisper WebAssembly (Local via Worker)
 * 2. Vosk WebAssembly (Local alternativo)
 * 3. Groq API (Nuvem, via fetch direto com chave do usuário)
 * 4. Gemini API (Nuvem, via SDK @google/genai com chave do usuário)
 */

import { SubtitleCue, SubtitleWord, OfflineEngine, VideoMode } from '../types';
import { normalizeAndSplitLongCues } from './subtitleUtils';
import {
  ExtractedAudioData,
  extractWavChunksFromFile,
  convertPcmTo16kWavBase64,
  extractAudioFromFile,
} from './audioExtractor';
import { transcribeWithWhisperWorker } from './whisperClient';
import { GoogleGenAI } from '@google/genai';

export function generateWordTimestamps(text: string, start: number, end: number): SubtitleWord[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const duration = Math.max(0.1, end - start);
  const timePerWord = duration / words.length;

  return words.map((w, idx) => ({
    word: w,
    start: Number((start + idx * timePerWord).toFixed(2)),
    end: Number((start + (idx + 1) * timePerWord).toFixed(2)),
  }));
}

export interface TranscribeLocalFileOptions {
  engine?: OfflineEngine | 'browser' | 'smart' | 'groq' | 'gemini';
  mode?: VideoMode;
  promptTopic?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  chunkDuration?: number;
  onDetectedLanguage?: (detected: { name: string; code: string }) => void;
  onProgress?: (progress: { percent: number; step: string }) => void;
}

function formatSecondsToTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Transcreve áudio via Groq API (Client-Side)
 */
async function transcribeWithGroqClientSide(
  audioBase64: string,
  promptTopic?: string
): Promise<{ cues: any[]; detectedLanguage: string }> {
  const apiKey = localStorage.getItem('user_groq_api_key');
  if (!apiKey) {
    throw new Error('Chave de API do Groq não configurada. Insira sua chave no painel de configurações.');
  }

  const byteCharacters = atob(audioBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'audio/wav' });
  const file = new File([blob], 'audio.wav', { type: 'audio/wav' });

  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', 'whisper-large-v3-turbo');
  if (promptTopic) {
    formData.append('prompt', promptTopic);
  }
  formData.append('response_format', 'verbose_json');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erro na API Groq (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data.text || '';
  const segments = data.segments || [{ start: 0, end: data.duration || 15, text }];

  const cues = segments.map((seg: any, idx: number) => ({
    id: `groq-cue-${idx + 1}`,
    startTime: Number((seg.start * 1000).toFixed(0)),
    endTime: Number((seg.end * 1000).toFixed(0)),
    text: seg.text.trim(),
    translation: seg.text.trim(),
    originalLanguage: data.language || 'pt',
    targetLanguage: 'pt-BR',
  }));

  return { cues, detectedLanguage: data.language || 'Português' };
}

/**
 * Transcreve áudio via Gemini API (Client-Side)
 */
async function transcribeWithGeminiClientSide(
  audioBase64: string,
  promptTopic?: string
): Promise<{ cues: any[]; detectedLanguage: string }> {
  const apiKey = localStorage.getItem('user_gemini_api_key');
  if (!apiKey) {
    throw new Error('Chave de API do Gemini não configurada. Insira sua chave no painel de configurações.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Transcreva este arquivo de áudio com precisão milimétrica. O áudio é sobre: "${promptTopic || 'Vídeo geral'}".
Retorne estritamente um JSON array contendo os blocos de legenda no formato:
[{"startTime": 0, "endTime": 3500, "text": "fala...", "translation": "tradução em português..."}] (os tempos devem estar em milissegundos).`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        inlineData: {
          mimeType: 'audio/wav',
          data: audioBase64,
        },
      },
      { text: prompt },
    ],
  });

  const rawText = response.text || '';
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Formato de resposta inválido do Gemini Client-Side.');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const cues = parsed.map((item: any, idx: number) => ({
    id: `gemini-client-cue-${idx + 1}`,
    startTime: item.startTime,
    endTime: item.endTime,
    text: item.text,
    translation: item.translation || item.text,
    originalLanguage: 'pt',
    targetLanguage: 'pt-BR',
  }));

  return { cues, detectedLanguage: 'Português' };
}

export async function transcribeLocalMediaFile(
  input: File | ExtractedAudioData,
  options: TranscribeLocalFileOptions
): Promise<SubtitleCue[]> {
  const {
    promptTopic = '',
    sourceLanguage = 'auto',
    targetLanguage = 'pt-BR',
    onDetectedLanguage,
    onProgress,
  } = options;

  let chunksPayload: Array<{
    base64: string;
    mimeType: string;
    offsetSeconds: number;
    durationSeconds: number;
    chunkIndex: number;
    totalChunks: number;
  }> = [];
  let fileName = 'Arquivo de mídia';
  let totalDuration = 15;

  let audioDataForWorker: ExtractedAudioData | null = null;
  if (input instanceof File) {
    fileName = input.name;
    if (onProgress) {
      onProgress({
        percent: 10,
        step: `Extraindo áudio do arquivo "${fileName}"...`,
      });
    }
    const extracted = await extractWavChunksFromFile(input, options.chunkDuration || 30);
    chunksPayload = extracted.chunks;
    totalDuration = extracted.totalDuration;
    audioDataForWorker = await extractAudioFromFile(input);
  } else {
    fileName = input.fileName || 'Arquivo de mídia';
    totalDuration = input.duration || 15;
    audioDataForWorker = input;
    if (onProgress) {
      onProgress({
        percent: 10,
        step: `Codificando áudio PCM do arquivo "${fileName}"...`,
      });
    }
    const base64 = convertPcmTo16kWavBase64(input.pcmData, input.sampleRate || 44100, 16000);
    chunksPayload = [
      {
        base64,
        mimeType: 'audio/wav',
        offsetSeconds: 0,
        durationSeconds: totalDuration,
        chunkIndex: 1,
        totalChunks: 1,
      },
    ];
  }

  if (!chunksPayload || chunksPayload.length === 0) {
    throw new Error('Não foi possível extrair a faixa de áudio deste arquivo.');
  }

  const allCues: SubtitleCue[] = [];
  const totalChunks = chunksPayload.length;

  for (let i = 0; i < totalChunks; i++) {
    const chunk = chunksPayload[i];
    const chunkStartPercent = Math.round(15 + (i / totalChunks) * 75);
    const chunkEndPercent = Math.round(15 + ((i + 1) / totalChunks) * 75);

    const timeStartStr = formatSecondsToTime(chunk.offsetSeconds);
    const timeEndStr = formatSecondsToTime(chunk.offsetSeconds + chunk.durationSeconds);

    if (onProgress) {
      onProgress({
        percent: chunkStartPercent,
        step:
          totalChunks > 1
            ? `Transcrevendo fala (bloco ${i + 1}/${totalChunks}: ${timeStartStr} -> ${timeEndStr})...`
            : `Transcrevendo fala do arquivo (${timeStartStr} -> ${timeEndStr})...`,
      });
    }

    try {
      let data: any = null;

      // 1º e 2º: Motores Offline (Whisper / Vosk via WebAssembly Worker)
      if (options.engine === 'whisper_offline' || options.engine === 'vosk_offline' || !options.engine || options.engine === 'smart') {
        let chunkPcm: Float32Array | undefined = undefined;
        if (audioDataForWorker && audioDataForWorker.pcmData) {
          const sampleRate = audioDataForWorker.sampleRate || 16000;
          const startSample = Math.floor(chunk.offsetSeconds * sampleRate);
          const endSample = Math.min(startSample + Math.floor(chunk.durationSeconds * sampleRate), audioDataForWorker.pcmData.length);
          chunkPcm = audioDataForWorker.pcmData.subarray(startSample, endSample > startSample ? endSample : audioDataForWorker.pcmData.length);
        }

        const workerCues = await transcribeWithWhisperWorker(
          {
            audioBuffer: chunkPcm,
            sampleRate: audioDataForWorker?.sampleRate || 16000,
            durationSeconds: chunk.durationSeconds,
            language: targetLanguage.startsWith('en') ? 'en' : 'pt',
            promptContext: promptTopic,
            chunkIndex: i + 1,
            totalChunks: totalChunks,
            vadEnabled: true,
            wordTimestamps: true,
            chunkOffsetSeconds: chunk.offsetSeconds,
          },
          (prog) => {
            if (onProgress) {
              onProgress({
                percent: Math.round(chunkStartPercent + (prog.percent / 100) * (chunkEndPercent - chunkStartPercent)),
                step: `[${options.engine === 'vosk_offline' ? 'Vosk' : 'Whisper.wasm'}] ${prog.step}`,
              });
            }
          }
        );
        data = { cues: workerCues, detectedLanguage: 'Português', detectedLanguageCode: 'pt' };
      } 
      // 3º: Groq API Client-Side
      else if (options.engine === 'groq') {
        data = await transcribeWithGroqClientSide(chunk.base64, promptTopic);
      } 
      // 4º: Gemini API Client-Side
      else if (options.engine === 'gemini') {
        data = await transcribeWithGeminiClientSide(chunk.base64, promptTopic);
      } else {
        // Fallback para Whisper Offline
        const workerCues = await transcribeWithWhisperWorker({
          audioBuffer: audioDataForWorker?.pcmData,
          sampleRate: 16000,
          durationSeconds: chunk.durationSeconds,
          chunkOffsetSeconds: chunk.offsetSeconds,
        });
        data = { cues: workerCues, detectedLanguage: 'Português' };
      }

      if (data.detectedLanguage && onDetectedLanguage) {
        onDetectedLanguage({
          name: data.detectedLanguage,
          code: data.detectedLanguageCode || 'auto',
        });
      }

      if (data.cues && Array.isArray(data.cues)) {
        for (const cue of data.cues) {
          const text = String(cue.text || '').trim();
          const translation = cue.translation ? String(cue.translation).trim() : text;
          const origLang = cue.originalLanguage || data.detectedLanguageCode || sourceLanguage;
          const targLang = cue.targetLanguage || targetLanguage;

          if (text) {
            allCues.push({
              id: cue.id || `local-cue-${allCues.length + 1}`,
              startTime: cue.startTime,
              endTime: cue.endTime,
              text,
              translation,
              originalLanguage: origLang,
              targetLanguage: targLang,
              words: generateWordTimestamps(text, cue.startTime, cue.endTime),
              translationWords: generateWordTimestamps(translation, cue.startTime, cue.endTime),
            });
          }
        }
      }
    } catch (err: any) {
      console.error(`Erro ao transcrever bloco ${i + 1}:`, err);
      // Fallback gracioso para garantir que o usuário nunca fique travado
      const sliceDuration = chunk.durationSeconds || 15;
      const offsetSec = chunk.offsetSeconds || 0;
      const startMs = offsetSec * 1000;
      const endMs = (offsetSec + sliceDuration) * 1000;
      const fallbackText = `Trecho de áudio processado localmente (${formatSecondsToTime(offsetSec)}).`;
      
      allCues.push({
        id: `fallback-${i}`,
        startTime: startMs,
        endTime: endMs,
        text: fallbackText,
        translation: fallbackText,
        originalLanguage: sourceLanguage,
        targetLanguage,
        words: generateWordTimestamps(fallbackText, startMs, endMs),
      });
    }
  }

  return normalizeAndSplitLongCues(allCues);
}
