import React from 'react';
import {
  FolderOpen,
  Film,
  FileText,
  Languages,
  Palette,
  Download,
  HelpCircle,
  HardDrive,
  WifiOff,
} from 'lucide-react';
import { AppTab, VideoMode } from '../types';

interface ActionDockFooterProps {
  activeTab: AppTab;
  onNavigateTab: (tab: AppTab) => void;
  onTriggerFileInput: () => void;
  onOpenTranslate: () => void;
  onOpenStyles: () => void;
  onOpenExport: () => void;
  onOpenTutorials: () => void;
  subtitlesCount: number;
  videoMode?: VideoMode;
  onToggleVideoMode?: (mode: VideoMode) => void;
}

export const ActionDockFooter: React.FC<ActionDockFooterProps> = ({
  activeTab,
  onNavigateTab,
  onTriggerFileInput,
  onOpenTranslate,
  onOpenStyles,
  onOpenExport,
  onOpenTutorials,
  subtitlesCount,
  videoMode,
  onToggleVideoMode,
}) => {
  return (
    <footer className="sticky bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-[#0c0e14]/95 py-3 px-4 backdrop-blur-md shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Seletor de Modo de Vídeo Compacto */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-300">Ações Rápidas:</span>
          </div>

          {videoMode && onToggleVideoMode && (
            <div className="inline-flex items-center bg-[#1E1E1E] border border-slate-800 p-0.5 rounded-lg">
              <button
                type="button"
                id="footer-toggle-mode-short"
                onClick={() => onToggleVideoMode('short')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  videoMode === 'short'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📱 Curto
              </button>
              <button
                type="button"
                id="footer-toggle-mode-long"
                onClick={() => onToggleVideoMode('long')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  videoMode === 'long'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🎬 Longo
              </button>
            </div>
          )}
        </div>

        {/* Grade de Botões Visíveis Sem Esconder Nenhuma Opção */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto py-1">
          {/* Botão 1: Carregar */}
          <button
            type="button"
            id="footer-btn-upload-video"
            onClick={onTriggerFileInput}
            className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
            title="Carregar arquivo"
          >
            <FolderOpen className="w-3.5 h-3.5 shrink-0" />
            <span>Carregar</span>
          </button>

          {/* Botão 2: Reprodutor */}
          <button
            type="button"
            id="footer-btn-player"
            onClick={() => onNavigateTab('player')}
            className={`px-3 py-2 rounded-lg border font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'player'
                ? 'bg-slate-800 border-amber-500/60 text-amber-300'
                : 'bg-[#1E1E1E] hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
          >
            <Film className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>Reprodutor</span>
          </button>

          {/* Botão 3: Legendas */}
          <button
            type="button"
            id="footer-btn-subtitles"
            onClick={() => onNavigateTab('subtitles')}
            className={`px-3 py-2 rounded-lg border font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              activeTab === 'subtitles'
                ? 'bg-slate-800 border-amber-500/60 text-amber-300'
                : 'bg-[#1E1E1E] hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>Legendas ({subtitlesCount})</span>
          </button>

          {/* Botão 4: Traduzir */}
          <button
            type="button"
            id="footer-btn-translate"
            onClick={onOpenTranslate}
            className="px-3 py-2 rounded-lg bg-[#1E1E1E] hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <Languages className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>Traduzir</span>
          </button>

          {/* Botão 5: Estilo */}
          <button
            type="button"
            id="footer-btn-style"
            onClick={onOpenStyles}
            className="px-3 py-2 rounded-lg bg-[#1E1E1E] hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <Palette className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>Estilo</span>
          </button>

          {/* Botão 6: Exportar */}
          <button
            type="button"
            id="footer-btn-export"
            onClick={onOpenExport}
            className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Exportar</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
