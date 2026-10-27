export interface SubtitleWord {
  word: string;
  start: number;
  end: number;
}

export interface SubtitleCue {
  id: string;
  startTime: number; // segundos
  endTime: number; // segundos
  text: string; // Texto original escutado no vídeo (ex: Inglês)
  translation?: string; // Tradução do texto (ex: Português PT-BR)
  originalLanguage?: string; // ex: 'en'
  targetLanguage?: string; // ex: 'pt-BR'
  words?: SubtitleWord[];
  translationWords?: SubtitleWord[];
}

export type SubtitleDisplayMode = 'translated' | 'original' | 'bilingual';
export type AutoSaveFormat = 'srt' | 'vtt';
export type AppTab = 'player' | 'subtitles' | 'upload' | 'styles' | 'tutorials' | 'editor';

export interface AutoSaveConfig {
  enabled: boolean;
  format: AutoSaveFormat;
  mode: SubtitleDisplayMode;
  saveOnGeneration: boolean;
  saveOnEdit?: boolean;
}

export type ExportSubtitleFormat =
  | 'translated_srt'
  | 'original_srt'
  | 'bilingual_srt'
  | 'both_srt'
  | 'vtt'
  | 'txt';

export type PresetType = 'tiktok' | 'hormozi' | 'beast' | 'minimal' | 'newsbox' | 'neon' | 'cinema';

export interface SubtitleStyle {
  preset: PresetType;
  fontFamily: string;
  fontSize: number; // em px ou rem relativo
  textColor: string;
  highlightColor: string;
  backgroundColor: string;
  background?: string;
  strokeColor: string;
  outlineColor?: string;
  strokeWidth: number;
  position: 'bottom' | 'middle' | 'top' | 'center';
  yOffsetPercent: number; // 0 a 100%
  textTransform: 'uppercase' | 'none' | 'capitalize';
  animation: 'karaoke' | 'pop' | 'fade' | 'none';
  maxWordsPerLine: number;
  isBold: boolean;
  burnInNative?: boolean;
}

export interface VideoItem {
  id: string;
  title: string;
  url: string;
  duration: number;
  aspectRatio: '9:16' | '16:9' | '1:1';
  sourceType: 'sample' | 'upload' | 'record';
  description?: string;
}

export interface TutorialGuide {
  id: string;
  title: string;
  badge: string;
  iconName: string;
  duration: string;
  description: string;
  steps: {
    title: string;
    detail: string;
    codeOrAction?: string;
  }[];
}

export interface MonetizationPlan {
  id: 'free' | 'creator' | 'business';
  name: string;
  price: string;
  description: string;
  features: string[];
  recommended?: boolean;
  adSupported: boolean;
}

export type VideoMode = 'short' | 'long';

export type OfflineEngine = 'whisper_offline' | 'vosk_offline' | 'native_speech' | 'gemini';

export interface LongVideoProgress {
  isProcessing: boolean;
  currentChunk: number;
  totalChunks: number;
  processedSeconds: number;
  totalSeconds: number;
  etaSeconds: number;
  memoryUsageMb: number;
  statusMessage: string;
}

export interface LongVideoSettings {
  chunkDuration: number; // segundos por bloco (ex: 30)
  vadEnabled: boolean; // Voice Activity Detection para pular silêncio
  autoPunctuation: boolean;
  autoSaveCheckpoint: boolean;
}

export interface SavedProject {
  id: string;
  projectName: string;
  videoTitle: string;
  subtitles: SubtitleCue[];
  style?: SubtitleStyle;
  videoDuration?: number;
  cueCount: number;
  createdAt: number;
  updatedAt: number;
  description?: string;
  previewText?: string;
}
