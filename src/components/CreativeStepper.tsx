import React from 'react';
import { Film, FileText, Palette, Download, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { SubtitleStyle, SubtitleCue, VideoMode } from '../types';

interface CreativeStepperProps {
  currentTab: string;
  onNavigateTab: (tab: string) => void;
  onOpenStyleModal: () => void;
  onOpenExportModal: () => void;
  videoTitle: string;
  duration: number;
  subtitles: SubtitleCue[];
  currentStyle: SubtitleStyle;
  isLocalFile: boolean;
  hasGeneratedForLocal: boolean;
  videoMode?: VideoMode;
  onToggleVideoMode?: (mode: VideoMode) => void;
}

export const CreativeStepper: React.FC<CreativeStepperProps> = ({
  currentTab,
  onNavigateTab,
  onOpenStyleModal,
  onOpenExportModal,
  videoTitle,
  duration,
  subtitles,
  currentStyle,
  isLocalFile,
  hasGeneratedForLocal,
  videoMode,
  onToggleVideoMode,
}) => {
  // Determina o status de cada etapa
  const isMediaReady = Boolean(videoTitle && duration > 0);
  const isSubtitlesReady = subtitles.length > 0 && (!isLocalFile || hasGeneratedForLocal);
  const isStyleReady = Boolean(currentStyle && currentStyle.preset);

  // Etapa recomendada atual
  let currentStepNumber = 1;
  if (!isMediaReady) {
    currentStepNumber = 1;
  } else if (!isSubtitlesReady) {
    currentStepNumber = 2;
  } else {
    currentStepNumber = 3;
  }

  const steps = [
    {
      step: 1,
      id: 'media',
      title: '1. Mídia & Vídeo',
      desc: isMediaReady ? `${Math.round(duration)}s • Pronto` : 'Carregar arquivo',
      icon: Film,
      isDone: isMediaReady,
      isActive: currentTab === 'player' || currentTab === 'upload',
      action: () => onNavigateTab('player'),
    },
    {
      step: 2,
      id: 'subtitles',
      title: '2. Transcrição & Texto',
      desc: isSubtitlesReady ? `${subtitles.length} legendas sincronizadas` : 'Gerar com IA',
      icon: FileText,
      isDone: isSubtitlesReady,
      isActive: currentTab === 'subtitles',
      action: () => onNavigateTab('subtitles'),
    },
    {
      step: 3,
      id: 'styles',
      title: '3. Estilo Viral',
      desc: `Preset: ${currentStyle.preset.toUpperCase()}`,
      icon: Palette,
      isDone: isStyleReady,
      isActive: currentTab === 'styles',
      action: () => onOpenStyleModal(),
      highlightBadge: currentStyle.preset,
    },
    {
      step: 4,
      id: 'export',
      title: '4. Exportar',
      desc: 'Baixar Vídeo / SRT',
      icon: Download,
      isDone: false,
      isActive: false,
      action: () => onOpenExportModal(),
      isPrimaryAction: true,
    },
  ];

  return (
    <div
      id="creative-workflow-stepper"
      className="w-full bg-slate-900/90 border border-slate-800/90 rounded-2xl p-2.5 sm:p-3 shadow-xl backdrop-blur-md mb-6"
    >
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-3">
        {/* Título de Orientação para o Usuário e Seletor de Modo */}
        <div className="flex items-center justify-between gap-2 px-2 py-1 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span>Fluxo Criativo</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  Passo {currentStepNumber} de 4
                </span>
              </span>
            </div>
          </div>

          {/* Alternador Rápido no Stepper */}
          {videoMode && onToggleVideoMode && (
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 shrink-0">
              <button
                type="button"
                id="stepper-mode-btn-short"
                onClick={() => onToggleVideoMode('short')}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  videoMode === 'short'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Modo Vídeos Curtos (até 90s)"
              >
                📱 Curto
              </button>
              <button
                type="button"
                id="stepper-mode-btn-long"
                onClick={() => onToggleVideoMode('long')}
                className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  videoMode === 'long'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Modo Vídeos Longos (Podcasts / YouTube)"
              >
                🎬 Longo
              </button>
            </div>
          )}
        </div>

        {/* Linha dos 4 Passos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 flex-1">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                onClick={s.action}
                className={`group relative flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  s.isActive
                    ? 'bg-amber-500/15 border-amber-500/50 shadow-md shadow-amber-500/10'
                    : s.isPrimaryAction
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-400 font-bold hover:brightness-110 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/70 text-slate-300'
                }`}
              >
                {/* Ícone do Passo */}
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                    s.isPrimaryAction
                      ? 'bg-slate-950/20 text-slate-950'
                      : s.isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : s.isActive
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {s.isDone && !s.isPrimaryAction ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </div>

                {/* Textos da Etapa */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p
                      className={`text-xs font-bold truncate leading-tight ${
                        s.isPrimaryAction ? 'text-slate-950 font-black' : s.isActive ? 'text-amber-300' : 'text-slate-200'
                      }`}
                    >
                      {s.title}
                    </p>
                    {idx < steps.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-slate-600 hidden sm:block shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <p
                    className={`text-[10px] sm:text-[11px] truncate mt-0.5 ${
                      s.isPrimaryAction ? 'text-slate-900 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {s.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
