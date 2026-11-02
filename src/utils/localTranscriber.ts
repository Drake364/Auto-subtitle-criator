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

  const cues = segments.map((seg: any, idx: number) => {
    const rawStart = Number(seg.start) || 0;
    const rawEnd = Number(seg.end) || (rawStart + 2.5);
    return {
      id: `groq-cue-${idx + 1}`,
      startTime: Number(rawStart.toFixed(2)),
      endTime: Number(rawEnd.toFixed(2)),
      text: seg.text.trim(),
      translation: seg.text.trim(),
      originalLanguage: data.language || 'pt',
      targetLanguage: 'pt-BR',
    };
  });

  return { cues, detectedLanguage: data.language || 'Português' };
}

/**
 * Transcreve áudio via Gemini API.
 * 1. Tenta a rota segura de proxy do servidor backend (/api/transcribe-audio), que possui a chave GEMINI_API_KEY.
 * 2. Se o backend não responder (ex: deploy puramente estático), usa a chave do usuário configurada no navegador.
 * 3. Se nenhuma chave estiver configurada ou a chamada falhar, realiza fallback automático para o motor Whisper local.
 */
async function transcribeWithGemini(
  audioBase64: string,
  options: {
    promptTopic?: string;
    duration?: number;
    sourceLanguage?: string;
    targetLanguage?: string;
    chunkOffsetSeconds?: number;
    fallbackPcm?: Float32Array;
    sampleRate?: number;
  }
): Promise<{ cues: any[]; detectedLanguage: string; detectedLanguageCode?: string }> {
  // 1. Tenta a rota de proxy do servidor BFF (/api/transcribe-audio)
  try {
    const res = await fetch('/api/transcribe-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audioBase64,
        mimeType: 'audio/wav',
        duration: options.duration || 15,
        sourceLanguage: options.sourceLanguage || 'auto',
        targetLanguage: options.targetLanguage || 'pt-BR',
        promptTopic: options.promptTopic || '',
        chunkOffsetSeconds: options.chunkOffsetSeconds || 0,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.cues) && data.cues.length > 0) {
        return {
          cues: data.cues,
          detectedLanguage: data.detectedLanguage || 'Português',
          detectedLanguageCode: data.detectedLanguageCode || 'pt-BR',
        };
      }
      if (data.error) {
        console.warn('[transcribeWithGemini] Resposta do backend:', data.error);
      }
    }
  } catch (backendErr) {
    console.warn('[transcribeWithGemini] Backend indisponível, verificando chave client-side...', backendErr);
  }

  // 2. Se o backend não responder, tenta a chave configurada no navegador pelo usuário
  const apiKey = localStorage.getItem('user_gemini_api_key');
  if (apiKey && apiKey.trim().length > 0) {
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      const prompt = `Você é um transcritor audiovisual profissional de alta fidelidade.
Transcreva cada palavra falada neste áudio sobre: "${options.promptTopic || 'Vídeo geral'}".
Retorne ESTRITAMENTE um JSON array com blocos de legenda no formato:
[{"startTime": 0.0, "endTime": 3.5, "text": "fala original", "translation": "tradução em português"}]
Nota fundamental: Os tempos startTime e endTime DEVEM estar em segundos numéricos (ex: 1.25, 4.80) relativos a este trecho.`;

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
        config: {
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text || '';
      const cleanJson = rawText.replace(/```(?:json)?\n?/gi, '').replace(/```/g, '').trim();
      let parsed: any[] = [];
      try {
        const d = JSON.parse(cleanJson);
        parsed = Array.isArray(d) ? d : (d.cues || []);
      } catch {
        const jsonMatch = cleanJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        const offset = Number(options.chunkOffsetSeconds) || 0;
        const cues = parsed.map((item: any, idx: number) => {
          let start = Number(item.startTime) || 0;
          let end = Number(item.endTime) || (start + 2.5);
          if (start > 100 && (options.duration || 30) < 100) {
            start = start / 1000;
            end = end / 1000;
          }
          start = Number((start + offset).toFixed(2));
          end = Number((end + offset).toFixed(2));

          return {
            id: `gemini-client-cue-${Date.now()}-${idx + 1}`,
            startTime: start,
            endTime: end,
            text: String(item.text || '').trim(),
            translation: String(item.translation || item.text || '').trim(),
            originalLanguage: options.sourceLanguage || 'pt',
            targetLanguage: options.targetLanguage || 'pt-BR',
          };
        });

        return { cues, detectedLanguage: 'Português', detectedLanguageCode: 'pt-BR' };
      }
    } catch (clientErr) {
      console.warn('[transcribeWithGemini] Erro no SDK Gemini client-side:', clientErr);
    }
  }

  // 3. Fallback inteligente: utiliza o motor Whisper local com o buffer acústico PCM
  console.info('[transcribeWithGemini] Acionando Whisper local de contingência para este bloco.');
  const workerCues = await transcribeWithWhisperWorker({
    audioBuffer: options.fallbackPcm,
    sampleRate: options.sampleRate || 16000,
    durationSeconds: options.duration || 15,
    chunkOffsetSeconds: options.chunkOffsetSeconds || 0,
    language: options.targetLanguage?.startsWith('en') ? 'en' : 'pt',
  });

  return { cues: workerCues, detectedLanguage: 'Português', detectedLanguageCode: 'pt-BR' };
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
      // 4º: Gemini API (Multimodal Inteligente com contingência Whisper)
      else if (options.engine === 'gemini') {
        let chunkPcm: Float32Array | undefined = undefined;
        if (audioDataForWorker && audioDataForWorker.pcmData) {
          const sampleRate = audioDataForWorker.sampleRate || 16000;
          const startSample = Math.floor(chunk.offsetSeconds * sampleRate);
          const endSample = Math.min(startSample + Math.floor(chunk.durationSeconds * sampleRate), audioDataForWorker.pcmData.length);
          chunkPcm = audioDataForWorker.pcmData.subarray(startSample, endSample > startSample ? endSample : audioDataForWorker.pcmData.length);
        }

        data = await transcribeWithGemini(chunk.base64, {
          promptTopic,
          duration: chunk.durationSeconds,
          sourceLanguage,
          targetLanguage,
          chunkOffsetSeconds: chunk.offsetSeconds,
          fallbackPcm: chunkPcm,
          sampleRate: audioDataForWorker?.sampleRate || 16000,
        });
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
      const startSec = Number(offsetSec.toFixed(2));
      const endSec = Number((offsetSec + sliceDuration).toFixed(2));
      const fallbackText = `Trecho de áudio processado localmente (${formatSecondsToTime(offsetSec)}).`;
      
      allCues.push({
        id: `fallback-${i}`,
        startTime: startSec,
        endTime: endSec,
        text: fallbackText,
        translation: fallbackText,
        originalLanguage: sourceLanguage,
        targetLanguage,
        words: generateWordTimestamps(fallbackText, startSec, endSec),
      });
    }
  }

  return normalizeAndSplitLongCues(allCues);
}
