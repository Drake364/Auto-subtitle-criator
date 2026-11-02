import { SubtitleCue, SubtitleWord, SubtitleDisplayMode } from '../types';

export function normalizeAndSplitLongCues(cues: SubtitleCue[]): SubtitleCue[] {
  const result: SubtitleCue[] = [];
  for (const cue of cues) {
    const duration = cue.endTime - cue.startTime;
    // Se a legenda for muito longa (> 6 segundos) e tiver texto substantivo, divide em frases/pedaços menores
    if (duration > 6.0) {
      const text = cue.text || '';
      const translation = cue.translation || text;
      const sentences = text.split(/(?<=[.!?])\s+|\n+/).filter(Boolean);
      const transSentences = translation.split(/(?<=[.!?])\s+|\n+/).filter(Boolean);

      if (sentences.length > 1) {
        const totalSentences = sentences.length;
        const timePerSentence = duration / totalSentences;
        for (let sIdx = 0; sIdx < totalSentences; sIdx++) {
          const sStart = Number((cue.startTime + sIdx * timePerSentence).toFixed(2));
          const sEnd = Number((cue.startTime + (sIdx + 1) * timePerSentence).toFixed(2));
          const sText = sentences[sIdx] || text;
          const sTrans = transSentences[sIdx] || transSentences[0] || translation;
          result.push({
            ...cue,
            id: `${cue.id}-split-${sIdx}`,
            startTime: sStart,
            endTime: sEnd,
            text: sText,
            translation: sTrans,
            words: generateWordTimings(sText, sStart, sEnd),
            translationWords: generateWordTimings(sTrans, sStart, sEnd),
          });
        }
        continue;
      }
    }
    result.push(cue);
  }
  return result;
}

export function formatTimeSeconds(seconds: number, forceHours: boolean = false): string {
  if (isNaN(seconds) || seconds < 0) return '00:00.0';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);

  if (hours > 0 || forceHours) {
    return `${hours.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
}

export function formatFriendlyTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const generateSrtContent = exportToSrt;
export const generateVttContent = exportToVtt;
export const triggerDownload = downloadFile;
export const generateWordTimestamps = generateWordTimings;

export function formatSrtTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`;
}

export function formatVttTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
}

export function exportToSrt(
  cues: SubtitleCue[],
  mode: SubtitleDisplayMode = 'translated'
): string {
  return cues
    .map((cue, index) => {
      const num = index + 1;
      const start = formatSrtTime(cue.startTime);
      const end = formatSrtTime(cue.endTime);

      let contentText = '';
      if (mode === 'original') {
        contentText = cue.text.trim();
      } else if (mode === 'bilingual') {
        const en = cue.text.trim();
        const pt = (cue.translation || cue.text).trim();
        contentText = en !== pt ? `${en}\n${pt}` : en;
      } else {
        // 'translated'
        contentText = (cue.translation || cue.text).trim();
      }

      return `${num}\n${start} --> ${end}\n${contentText}\n`;
    })
    .join('\n');
}

export function exportToVtt(
  cues: SubtitleCue[],
  mode: SubtitleDisplayMode = 'translated'
): string {
  const body = cues
    .map((cue, index) => {
      const num = index + 1;
      const start = formatVttTime(cue.startTime);
      const end = formatVttTime(cue.endTime);

      let contentText = '';
      if (mode === 'original') {
        contentText = cue.text.trim();
      } else if (mode === 'bilingual') {
        const en = cue.text.trim();
        const pt = (cue.translation || cue.text).trim();
        contentText = en !== pt ? `${en}\n${pt}` : en;
      } else {
        contentText = (cue.translation || cue.text).trim();
      }

      return `${num}\n${start} --> ${end}\n${contentText}\n`;
    })
    .join('\n');
  return `WEBVTT - Gerado por LegendaFácil AI (${mode})\n\n${body}`;
}

export function exportToTxt(
  cues: SubtitleCue[],
  mode: SubtitleDisplayMode = 'translated'
): string {
  if (mode === 'bilingual') {
    return cues
      .map((cue) => {
        const en = cue.text.trim();
        const pt = (cue.translation || cue.text).trim();
        return `[EN] ${en}\n[PT] ${pt}`;
      })
      .join('\n\n');
  }

  return cues
    .map((cue) => (mode === 'original' ? cue.text.trim() : (cue.translation || cue.text).trim()))
    .join(' ');
}

export function downloadDualSrtFiles(cues: SubtitleCue[], baseFileName: string) {
  // 1. Baixar SRT Original (Inglês)
  const originalSrt = exportToSrt(cues, 'original');
  downloadFile(originalSrt, `${baseFileName}-original-en.srt`, 'text/plain');

  // 2. Baixar SRT Traduzido (Português) com breve intervalo
  setTimeout(() => {
    const translatedSrt = exportToSrt(cues, 'translated');
    downloadFile(translatedSrt, `${baseFileName}-traduzido-pt-br.srt`, 'text/plain');
  }, 400);
}

export function downloadFile(content: string, filename: string, type: string = 'text/plain') {
  // UTF-8 BOM (\uFEFF) garante que players como VLC, Windows Media Player e Smart TVs
  // exibam caracteres em português (acentos, ç, ~, ^) perfeitamente sem caracteres estranhos
  const prefix = type.includes('vtt') ? '' : '\uFEFF';
  const blob = new Blob([prefix + content], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    try {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {}
  }, 300);
}

export function parseSrt(srtContent: string): SubtitleCue[] {
  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.trim().split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  blocks.forEach((block, idx) => {
    const lines = block.split('\n').filter((l) => l.trim() !== '');
    if (lines.length < 2) return;

    let timeLine = lines[0].includes('-->') ? lines[0] : lines[1];
    let textLines = lines[0].includes('-->') ? lines.slice(1) : lines.slice(2);

    if (!timeLine || !timeLine.includes('-->')) return;

    const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
    const startTime = parseTimeToSeconds(startStr);
    const endTime = parseTimeToSeconds(endStr);
    const text = textLines.join(' ').trim();

    if (!isNaN(startTime) && !isNaN(endTime) && text) {
      cues.push({
        id: `imported-cue-${idx + 1}-${Date.now()}`,
        startTime,
        endTime,
        text,
        words: generateWordTimings(text, startTime, endTime),
      });
    }
  });

  return cues;
}

function parseTimeToSeconds(timeStr: string): number {
  const clean = timeStr.replace(',', '.');
  const parts = clean.split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }
  return parseFloat(timeStr) || 0;
}

export function generateWordTimings(text: string, start: number, end: number): SubtitleWord[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const duration = Math.max(0.1, end - start);
  const wordDuration = duration / words.length;

  return words.map((word, i) => ({
    word,
    start: start + i * wordDuration,
    end: start + (i + 1) * wordDuration,
  }));
}

export function searchAndReplaceCues(
  cues: SubtitleCue[],
  searchTerm: string,
  replaceTerm: string,
  matchCase: boolean = false
): { updatedCues: SubtitleCue[]; replacementsCount: number } {
  if (!searchTerm) return { updatedCues: cues, replacementsCount: 0 };

  const flags = matchCase ? 'g' : 'gi';
  const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, flags);

  let replacementsCount = 0;
  const updatedCues = cues.map((cue) => {
    const matches = cue.text.match(regex);
    if (matches) {
      replacementsCount += matches.length;
      const newText = cue.text.replace(regex, replaceTerm);
      return {
        ...cue,
        text: newText,
        words: generateWordTimings(newText, cue.startTime, cue.endTime),
      };
    }
    return cue;
  });

  return { updatedCues, replacementsCount };
}

/**
 * Extrai o nome base do vídeo de forma limpa, removendo extensões de áudio e vídeo
 */
export function getCleanVideoBaseName(videoTitle: string): string {
  let clean = videoTitle.trim();
  // Remove extensões de arquivo comuns
  clean = clean.replace(/\.(mp4|mov|mkv|avi|webm|flv|wmv|m4v|3gp|ts|mp3|wav|ogg|aac|m4a|flac)$/i, '');
  // Se for apenas caracteres especiais ou vazio, atribui um padrão
  if (!clean.trim()) {
    clean = 'video_legenda';
  }
  return clean;
}

export interface AutoSaveResult {
  success: boolean;
  filename: string;
  extension: 'srt' | 'vtt';
  usedNativePicker: boolean;
  method: 'file_system_api' | 'forced_download';
  fileHandle?: any;
  aborted?: boolean;
  message: string;
}

export interface SaveSubtitleOptions {
  forceDownload?: boolean;
  existingHandle?: any;
  customBaseName?: string;
}

/**
 * Salva a legenda com o MESMO NOME e na MESMA PASTA do arquivo de vídeo.
 * Permite que reprodutores como VLC, Windows Media Player, MPC-HC e Smart TVs
 * identifiquem e ativem a legenda de forma 100% automática.
 * 
 * Se o navegador suportar a File System Access API (Chrome, Edge, Opera) e forceDownload não for solicitado,
 * abre a janela nativa de salvamento na pasta do vídeo com o nome pré-definido ou grava no handle existente.
 * Caso contrário (ou em caso de restrição de iframe/permissão), efetua o download forçado imediato com o nome exato.
 */
export async function saveSubtitleMatchingVideoName(
  cues: SubtitleCue[],
  videoTitle: string,
  mode: SubtitleDisplayMode = 'translated',
  extension: 'srt' | 'vtt' = 'srt',
  options?: SaveSubtitleOptions
): Promise<AutoSaveResult> {
  const cleanBaseName = options?.customBaseName || getCleanVideoBaseName(videoTitle);
  const filename = `${cleanBaseName}.${extension}`;
  const content = extension === 'srt' ? exportToSrt(cues, mode) : exportToVtt(cues, mode);
  const mimeType = extension === 'srt' ? 'text/plain' : 'text/vtt';

  const modeDescription =
    mode === 'bilingual'
      ? 'Legenda Dupla (Inglês + Português)'
      : mode === 'original'
      ? 'Legenda Original (Inglês)'
      : 'Legenda em Português';

  // 1. Gravar em handle existente da File System Access API, se fornecido
  if (options?.existingHandle && !options?.forceDownload) {
    try {
      const writable = await options.existingHandle.createWritable();
      await writable.write(content);
      await writable.close();

      return {
        success: true,
        filename: options.existingHandle.name || filename,
        extension,
        usedNativePicker: true,
        method: 'file_system_api',
        fileHandle: options.existingHandle,
        message: `Legenda "${options.existingHandle.name || filename}" salva e sincronizada diretamente no arquivo original!`,
      };
    } catch (err: any) {
      console.warn('Handle existente não pôde ser gravado, tentando seletor ou download...', err);
    }
  }

  // 2. Tentar salvar usando a API nativa File System Access API (se não estiver forçando download)
  if (!options?.forceDownload && typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          extension === 'srt'
            ? {
                description: 'Legenda SubRip (*.srt) para VLC, Smart TV e Reprodutores',
                accept: {
                  'text/plain': ['.srt'],
                  'application/x-subrip': ['.srt'],
                },
              }
            : {
                description: 'Legenda WebVTT (*.vtt) para Players Web e Smart TV',
                accept: {
                  'text/vtt': ['.vtt'],
                },
              },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();

      return {
        success: true,
        filename,
        extension,
        usedNativePicker: true,
        method: 'file_system_api',
        fileHandle: handle,
        message: `Legenda "${filename}" salva com sucesso! O VLC e sua Smart TV a carregarão automaticamente se estiver na mesma pasta do vídeo.`,
      };
    } catch (err: any) {
      // Se o usuário cancelou voluntariamente no seletor nativo
      if (err && err.name === 'AbortError') {
        return {
          success: false,
          filename,
          extension,
          usedNativePicker: true,
          method: 'file_system_api',
          aborted: true,
          message: 'Salvamento cancelado pelo usuário.',
        };
      }
      // Se falhar por restrição de iframe (SecurityError), permissão ou falta de gesto,
      // prossegue imediatamente e sem ruído para o download forçado abaixo.
      console.info('File System Access indisponível ou bloqueado, utilizando download forçado:', err?.message);
    }
  }

  // 3. Fallback / Download Forçado garantido com o nome idêntico do vídeo
  downloadFile(content, filename, mimeType);

  return {
    success: true,
    filename,
    extension,
    usedNativePicker: false,
    method: 'forced_download',
    message: `${modeDescription} salva como "${filename}". Coloque-a na mesma pasta do seu vídeo para reprodução automática no VLC e TV!`,
  };
}

