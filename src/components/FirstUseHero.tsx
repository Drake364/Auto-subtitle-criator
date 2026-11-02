import React from 'react';
import {
  FolderOpen,
  Film,
  Sparkles,
  Languages,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Tv,
} from 'lucide-react';
import { VideoMode } from '../types';

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'auto', name: '🪄 Detectar Automaticamente (Italiano, Inglês, etc.)', flag: '🪄' },
  { code: 'it-IT', name: 'Italiano', flag: '🇮🇹' },
  { code: 'en-US', name: 'Inglês', flag: '🇺🇸' },
  { code: 'es-ES', name: 'Espanhol', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'Francês', flag: '🇫🇷' },
  { code: 'de-DE', name: 'Alemão', flag: '🇩🇪' },
  { code: 'ja-JP', name: 'Japonês', flag: '🇯🇵' },
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
];

export const TARGET_LANGUAGES: LanguageOption[] = [
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'it-IT', name: 'Italiano', flag: '🇮🇹' },
  { code: 'en-US', name: 'Inglês', flag: '🇺🇸' },
  { code: 'es-ES', name: 'Espanhol', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'Francês', flag: '🇫🇷' },
  { code: 'de-DE', name: 'Alemão', flag: '🇩🇪' },
  { code: 'ja-JP', name: 'Japonês', flag: '🇯🇵' },
];

export interface FirstUseHeroProps {
  currentFileName?: string | null;
  isLocalFile?: boolean;
  hasGenerated?: boolean;
  sourceLanguage: string;
  onSourceLanguageChange: (lang: string) => void;
  targetLanguage: string;
  onTargetLanguageChange: (lang: string) => void;
  detectedLanguage?: { name: string; code: string } | null;
  videoMode: VideoMode;
  onToggleVideoMode: (mode: VideoMode) => void;
  onTriggerFileInput: () => void;
  onSelectSample: () => void;
  onStartTranscribe: () => void;
  isGenerating: boolean;
  subtitlesCount?: number;
}

export const FirstUseHero: React.FC<FirstUseHeroProps> = ({
  currentFileName,
  isLocalFile = false,
  hasGenerated = false,
  sourceLanguage,
  onSourceLanguageChange,
  targetLanguage,
  onTargetLanguageChange,
  detectedLanguage,
  videoMode,
  onToggleVideoMode,
  onTriggerFileInput,
  onSelectSample,
  onStartTranscribe,
  isGenerating,
  subtitlesCount = 0,
}) => {
  return (
    <div
      id="first-use-hero-box"
      className="w-full bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-amber-500/30 hover:border-amber-500/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 shadow-2xl transition-all relative overflow-hidden"
    >
      {/* Cabeçalho de Boas-Vindas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Início Rápido • 100% Amigável
              </span>
              {detectedLanguage && (
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Áudio: {detectedLanguage.name}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mt-1">
              Carregue seu Vídeo e Crie Legendas Sincronizadas
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Escolha se é um vídeo curto ou longo e selecione o idioma para começar.
            </p>
          </div>
        </div>

        {/* Badge do Status do Arquivo */}
        {isLocalFile && currentFileName && (
          <div className="self-start md:self-auto bg-slate-950/80 border border-emerald-500/40 px-3.5 py-2 rounded-xl text-left shadow-md">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Vídeo Pronto:</p>
            </div>
            <p className="text-xs font-bold text-emerald-400 truncate max-w-[220px] mt-0.5">
              {currentFileName}
            </p>
            <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 border border-slate-700">
              {videoMode === 'long' ? '🎬 Modo Longo' : '📱 Modo Curto'}
            </span>
          </div>
        )}
      </div>

      {/* SELETOR 1: TIPO E DURAÇÃO DO VÍDEO (CURTO VS LONGO) */}
      <div className="py-4 border-b border-slate-800/80 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>1. Qual é o tipo e a duração do seu vídeo?</span>
          </label>
          <span className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Proteção inteligente anti-travamento de memória</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card Vídeo Curto */}
          <button
            type="button"
            id="hero-mode-btn-short"
            onClick={() => onToggleVideoMode('short')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              videoMode === 'short'
                ? 'bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/40'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">📱</span>
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Vídeo Curto
                </span>
              </div>
              {videoMode === 'short' ? (
                <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full shadow-sm">
                  ✓ Selecionado
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-semibold">Clique para ativar</span>
              )}
            </div>
            <p className="text-xs font-bold text-white">Reels, TikTok, Shorts e Stories</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Até 90 segundos • Processamento instantâneo ideal para redes sociais
            </p>
          </button>

          {/* Card Vídeo Longo */}
          <button
            type="button"
            id="hero-mode-btn-long"
            onClick={() => onToggleVideoMode('long')}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              videoMode === 'long'
                ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-slate-900 border-amber-400 text-white shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/40'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Vídeo Longo
                </span>
              </div>
              {videoMode === 'long' ? (
                <span className="text-[10px] font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-2 py-0.5 rounded-full shadow-sm">
                  ✓ Selecionado
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-semibold">Clique para ativar</span>
              )}
            </div>
            <p className="text-xs font-bold text-white">Podcasts, YouTube, Aulas e Entrevistas</p>
            <p className="text-[11px] text-slate-400 mt-1">
              5min, 30min, 1h+ • Fatiamento em blocos (Zero OOM / Sem fechar o app)
            </p>
          </button>
        </div>
      </div>

      {/* SELETORES DE IDIOMA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 py-4">
        {/* Idioma Falado no Vídeo (Origem) */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-amber-400" />
              <span>2. Idioma Falado no Vídeo:</span>
            </span>
            <span className="text-[10px] font-normal text-slate-400">Origem</span>
          </label>
          <select
            value={sourceLanguage}
            onChange={(e) => onSourceLanguageChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-amber-400 cursor-pointer min-h-[44px]"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Use <strong>"Detectar Automaticamente"</strong> para a IA identificar Italiano, Inglês, etc.
          </p>
        </div>

        {/* Idioma da Legenda (Destino) */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>3. Idioma Desejado da Legenda:</span>
            </span>
            <span className="text-[10px] font-normal text-amber-400 font-bold">Tradução</span>
          </label>
          <select
            value={targetLanguage}
            onChange={(e) => onTargetLanguageChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-amber-400 cursor-pointer min-h-[44px]"
          >
            {TARGET_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Padrão recomendado: <strong>Português (Brasil)</strong> para legendar vídeos estrangeiros.
          </p>
        </div>
      </div>

      {/* ÁREA DE BOTÕES PRINCIPAIS */}
      <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* BOTÃO PRINCIPAL: Escolher Vídeo */}
        <button
          type="button"
          id="btn-hero-choose-video"
          onClick={onTriggerFileInput}
          className="flex-1 min-h-[52px] px-5 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all cursor-pointer transform active:scale-[0.99]"
        >
          <FolderOpen className="w-5 h-5 text-slate-950" />
          <span>{isLocalFile ? 'TROCAR VÍDEO DO CELULAR OU PC' : 'ESCOLHER VÍDEO DO CELULAR OU PC'}</span>
        </button>

        {/* Se o arquivo local já estiver carregado */}
        {isLocalFile && (
          <button
            type="button"
            id="btn-hero-generate-now"
            disabled={isGenerating}
            onClick={onStartTranscribe}
            className="min-h-[52px] px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 transition-all cursor-pointer animate-pulse"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Transcrevendo...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>⚡ GERAR LEGENDAS AGORA ({videoMode === 'long' ? 'LONGO' : 'CURTO'})</span>
              </>
            )}
          </button>
        )}

        {/* BOTÃO SECUNDÁRIO: Testar com Amostra */}
        <button
          type="button"
          id="btn-hero-sample-video"
          onClick={onSelectSample}
          className="min-h-[52px] px-4 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer whitespace-nowrap"
          title="Ver o aplicativo funcionando instantaneamente com um vídeo de exemplo"
        >
          <Film className="w-4 h-4 text-amber-400" />
          <span>Testar com Exemplo</span>
        </button>
      </div>

      {/* Dica de Formatos e Proteção */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold">✓ Formatos:</span>
          <span>MP4, WebM, MOV, MKV, MP3, WAV, M4A</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold">🛡️ Detecção Automática:</span>
          <span>Se o vídeo tiver mais de 90s, o modo longo é ativado automaticamente.</span>
        </div>
      </div>
    </div>
  );
};
