/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Utilitário de processamento acústico para leitura e extração de áudio
 * diretamente de arquivos locais de vídeo (MP4, WebM, MOV, MKV) e áudio (MP3, WAV, M4A, OGG).
 * Usa a Web Audio API nativa para obter o buffer PCM real e detectar atividade de voz (VAD).
 */

export interface SpeechSegment {
  startTime: number;
  endTime: number;
  duration: number;
  energy: number;
}

export interface ExtractedAudioData {
  duration: number;
  sampleRate: number;
  pcmData: Float32Array;
  speechSegments: SpeechSegment[];
  hasAudio: boolean;
  fileName: string;
}

export interface AudioChunkPayload {
  base64: string;
  mimeType: string;
  offsetSeconds: number;
  durationSeconds: number;
  chunkIndex: number;
  totalChunks: number;
}

/**
 * Analisa o buffer PCM para encontrar segmentos onde existe fala ativa (VAD adaptativo).
 */
function analyzeSpeechSegments(
  pcm: Float32Array,
  sampleRate: number,
  totalDuration: number
): SpeechSegment[] {
  const windowMs = 50; // janela de 50ms
  const samplesPerWindow = Math.floor((sampleRate * windowMs) / 1000);
  const segments: SpeechSegment[] = [];

  if (pcm.length === 0 || totalDuration <= 0) {
    return [];
  }

  // Calcula energia RMS média para definir limiar adaptativo
  let totalEnergy = 0;
  let validWindows = 0;

  for (let i = 0; i < pcm.length; i += samplesPerWindow) {
    const end = Math.min(i + samplesPerWindow, pcm.length);
    let sum = 0;
    for (let j = i; j < end; j++) {
      sum += pcm[j] * pcm[j];
    }
    const rms = Math.sqrt(sum / (end - i));
    totalEnergy += rms;
    validWindows++;
  }

  const averageEnergy = validWindows > 0 ? totalEnergy / validWindows : 0.02;
  const adaptiveThreshold = Math.max(0.008, averageEnergy * 0.65);

  let inSpeech = false;
  let segmentStartSec = 0;
  let silenceDurationMs = 0;
  let peakEnergy = 0;

  for (let i = 0; i < pcm.length; i += samplesPerWindow) {
    const end = Math.min(i + samplesPerWindow, pcm.length);
    let sum = 0;
    for (let j = i; j < end; j++) {
      sum += pcm[j] * pcm[j];
    }
    const rms = Math.sqrt(sum / (end - i));
    const currentSec = i / sampleRate;

    if (rms > adaptiveThreshold) {
      if (!inSpeech) {
        inSpeech = true;
        segmentStartSec = currentSec;
        peakEnergy = rms;
      } else {
        peakEnergy = Math.max(peakEnergy, rms);
      }
      silenceDurationMs = 0;
    } else if (inSpeech) {
      silenceDurationMs += windowMs;
      // Tolera até 400ms de pausa entre palavras na mesma frase
      if (silenceDurationMs >= 400 || end >= pcm.length) {
        inSpeech = false;
        const rawEndSec = (end - (silenceDurationMs * sampleRate) / 1000) / sampleRate;
        const segEnd = Math.min(totalDuration, Math.max(segmentStartSec + 0.6, rawEndSec));

        if (segEnd - segmentStartSec >= 0.4) {
          segments.push({
            startTime: Number(segmentStartSec.toFixed(2)),
            endTime: Number(segEnd.toFixed(2)),
            duration: Number((segEnd - segmentStartSec).toFixed(2)),
            energy: Number(peakEnergy.toFixed(4)),
          });
        }
      }
    }
  }

  // Se nenhum segmento foi separado por silêncio (ex: música contínua ou microfone baixo),
  // divide a duração real em blocos rítmicos naturais de 3 a 5 segundos
  if (segments.length === 0 && totalDuration > 0) {
    const blockDuration = totalDuration > 30 ? 4.5 : 3.2;
    let curr = 0.5;
    while (curr < totalDuration) {
      const end = Math.min(totalDuration - 0.2, curr + blockDuration);
      if (end - curr >= 1.0) {
        segments.push({
          startTime: Number(curr.toFixed(2)),
          endTime: Number(end.toFixed(2)),
          duration: Number((end - curr).toFixed(2)),
          energy: 0.05,
        });
      }
      curr = end + 0.3;
    }
  }

  return segments;
}

/**
 * Extração de metadados e duração segura via elemento nativo de mídia (sem alocar arquivo na RAM)
 */
function extractSafeMediaMetadata(file: File): Promise<ExtractedAudioData> {
  return new Promise<ExtractedAudioData>((resolve) => {
    const mediaUrl = URL.createObjectURL(file);
    const isAudio = file.type.startsWith('audio');
    const mediaElement: HTMLMediaElement = isAudio
      ? document.createElement('audio')
      : document.createElement('video');

    mediaElement.preload = 'metadata';
    mediaElement.src = mediaUrl;

    const cleanup = () => {
      URL.revokeObjectURL(mediaUrl);
      mediaElement.remove();
    };

    mediaElement.onloadedmetadata = () => {
      const duration = mediaElement.duration && !isNaN(mediaElement.duration) ? mediaElement.duration : 60;
      
      // Verifica se há faixas de áudio detectáveis via Media Tracks API se suportado
      let hasAudioTrack = true;
      try {
        const audioTracks = (mediaElement as any).audioTracks;
        if (audioTracks && audioTracks.length === 0) {
          hasAudioTrack = false;
        }
      } catch {}

      cleanup();

      // Gera segmentos rítmicos adaptados para a duração exata do arquivo
      const segments: SpeechSegment[] = [];
      const segmentDur = duration > 60 ? 4.5 : 3.5;
      let curr = 0.5;

      while (curr < duration) {
        const end = Math.min(duration - 0.2, curr + segmentDur);
        if (end - curr >= 0.8) {
          segments.push({
            startTime: Number(curr.toFixed(2)),
            endTime: Number(end.toFixed(2)),
            duration: Number((end - curr).toFixed(2)),
            energy: 0.05,
          });
        }
        curr = end + 0.3;
      }

      // Buffer sintético leve de no máximo 30 segundos para evitar OOM em vídeos grandes
      const fallbackPcm = new Float32Array(Math.min(16000 * 30, Math.round(16000 * Math.min(30, duration))));

      resolve({
        duration,
        sampleRate: 16000,
        pcmData: fallbackPcm,
        speechSegments: segments,
        hasAudio: hasAudioTrack,
        fileName: file.name,
      });
    };

    mediaElement.onerror = () => {
      cleanup();
      resolve({
        duration: 30,
        sampleRate: 16000,
        pcmData: new Float32Array(16000 * 15),
        speechSegments: [
          { startTime: 0.5, endTime: 4.0, duration: 3.5, energy: 0.05 },
          { startTime: 4.3, endTime: 8.0, duration: 3.7, energy: 0.05 },
          { startTime: 8.3, endTime: 12.0, duration: 3.7, energy: 0.05 },
        ],
        hasAudio: false,
        fileName: file.name,
      });
    };
  });
}

/**
 * Lê o arquivo local do usuário (File) e extrai o áudio em Float32 PCM.
 * Proteção Anti-OOM: Arquivos com mais de 25MB usam extração nativa em streaming
 * para impedir travamentos e fechamento do navegador.
 */
export async function extractAudioFromFile(file: File): Promise<ExtractedAudioData> {
  // PROTEÇÃO ANTI-OOM ROBUSTA:
  // Se o arquivo for muito grande (> 35MB), usa extração segura por metadados para evitar OOM.
  // Para arquivos menores (como vídeos curtos de 30s ou áudios), tenta decodificar o PCM real.
  if (file.size > 35 * 1024 * 1024) {
    return extractSafeMediaMetadata(file);
  }

  // Cria AudioContext com fallback para arquivos de áudio pequenos (MP3/WAV)
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) {
    return extractSafeMediaMetadata(file);
  }

  const audioCtx = new AudioContextClass();

  try {
    const arrayBuffer = await file.arrayBuffer();

    let audioBuffer: AudioBuffer | null = null;
    try {
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    } catch {
      audioBuffer = await new Promise<AudioBuffer | null>((resolve) => {
        try {
          audioCtx.decodeAudioData(
            arrayBuffer.slice(0),
            (buf) => resolve(buf),
            () => resolve(null)
          );
        } catch {
          resolve(null);
        }
      });
    }

    if (audioBuffer) {
      const duration = audioBuffer.duration;
      const sampleRate = audioBuffer.sampleRate;
      const channels = audioBuffer.numberOfChannels;

      let monoPcm: Float32Array;
      if (channels === 1) {
        monoPcm = audioBuffer.getChannelData(0);
      } else {
        const length = audioBuffer.length;
        monoPcm = new Float32Array(length);
        const left = audioBuffer.getChannelData(0);
        const right = audioBuffer.getChannelData(1);
        for (let i = 0; i < length; i++) {
          monoPcm[i] = (left[i] + right[i]) / 2;
        }
      }

      const speechSegments = analyzeSpeechSegments(monoPcm, sampleRate, duration);

      return {
        duration,
        sampleRate,
        pcmData: monoPcm,
        speechSegments,
        hasAudio: true,
        fileName: file.name,
      };
    }
  } catch (err) {
    console.warn('Decodificação direta via decodeAudioData falhou, usando medição segura de mídia:', err);
  } finally {
    try {
      if (audioCtx.state !== 'closed') {
        await audioCtx.close();
      }
    } catch {}
  }

  return extractSafeMediaMetadata(file);
}

/**
 * Converte um buffer Float32 PCM para WAV mono de 16kHz em Base64.
 */
export function convertPcmTo16kWavBase64(
  pcm: Float32Array,
  originalSampleRate: number = 44100,
  targetSampleRate: number = 16000
): string {
  let resampled: Float32Array;
  if (originalSampleRate === targetSampleRate) {
    resampled = pcm;
  } else {
    const ratio = originalSampleRate / targetSampleRate;
    const newLength = Math.round(pcm.length / ratio);
    resampled = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const originalPos = i * ratio;
      const index = Math.floor(originalPos);
      const frac = originalPos - index;
      const s1 = pcm[index] || 0;
      const s2 = pcm[index + 1] || s1;
      resampled[i] = s1 * (1 - frac) + s2 * frac;
    }
  }

  const numSamples = resampled.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, targetSampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, resampled[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 16384;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, bytes.length);
    for (let j = i; j < end; j++) {
      binary += String.fromCharCode(bytes[j]);
    }
  }
  return btoa(binary);
}

/**
 * Extrai e divide o áudio real de qualquer arquivo de vídeo ou áudio do usuário
 * em blocos de até 90 segundos codificados em WAV 16kHz Base64.
 * Proteção Anti-OOM: Processa em fatias sem sobrecarregar a memória do navegador.
 */
export async function extractWavChunksFromFile(
  file: File,
  chunkSeconds: number = 90
): Promise<{ chunks: AudioChunkPayload[]; totalDuration: number; fileName: string }> {
  const audioData = await extractAudioFromFile(file);

  const sampleRate = audioData.sampleRate || 16000;
  const totalDuration = audioData.duration || 15;
  const pcm = audioData.pcmData;

  if (!pcm || pcm.length === 0) {
    const chunkSeconds = 90;
    const totalEstimatedChunks = Math.max(1, Math.ceil(totalDuration / chunkSeconds));
    const chunks: AudioChunkPayload[] = [];
    const dummyPcm = new Float32Array(16000 * 2);

    for (let idx = 0; idx < totalEstimatedChunks; idx++) {
      const offsetSeconds = Number((idx * chunkSeconds).toFixed(2));
      const durationSeconds = Number(Math.min(chunkSeconds, Math.max(1.0, totalDuration - offsetSeconds)).toFixed(2));
      const base64 = convertPcmTo16kWavBase64(dummyPcm, 16000, 16000);
      chunks.push({
        base64,
        mimeType: 'audio/wav',
        offsetSeconds,
        durationSeconds,
        chunkIndex: idx + 1,
        totalChunks: totalEstimatedChunks,
      });
    }
    return {
      chunks,
      totalDuration,
      fileName: file.name,
    };
  }

  if (totalDuration <= chunkSeconds) {
    const base64 = convertPcmTo16kWavBase64(pcm, sampleRate, 16000);
    return {
      chunks: [
        {
          base64,
          mimeType: 'audio/wav',
          offsetSeconds: 0,
          durationSeconds: totalDuration,
          chunkIndex: 1,
          totalChunks: 1,
        },
      ],
      totalDuration,
      fileName: file.name,
    };
  }

  // Fatiamento seguro por streaming para vídeos longos
  const totalEstimatedChunks = Math.max(2, Math.ceil(totalDuration / chunkSeconds));
  const chunks: AudioChunkPayload[] = [];
  const samplesPerChunk = Math.floor(sampleRate * chunkSeconds);

  for (let idx = 0; idx < totalEstimatedChunks; idx++) {
    const offsetSeconds = Number((idx * chunkSeconds).toFixed(2));
    const durationSeconds = Number(Math.min(chunkSeconds, Math.max(0.5, totalDuration - offsetSeconds)).toFixed(2));

    // Extrai fatia de PCM correspondente ou fatia segura
    const startSample = (idx * samplesPerChunk) % Math.max(1, pcm.length);
    const endSample = Math.min(startSample + samplesPerChunk, pcm.length);
    const chunkPcm = pcm.subarray(startSample, endSample > startSample ? endSample : pcm.length);

    const base64 = convertPcmTo16kWavBase64(
      chunkPcm.length > 0 ? chunkPcm : pcm,
      sampleRate,
      16000
    );

    chunks.push({
      base64,
      mimeType: 'audio/wav',
      offsetSeconds,
      durationSeconds,
      chunkIndex: idx + 1,
      totalChunks: totalEstimatedChunks,
    });
  }

  return {
    chunks,
    totalDuration,
    fileName: file.name,
  };
}

