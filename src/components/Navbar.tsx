import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Sliders,
  BookOpen,
  DollarSign,
  Code2,
  Download,
  Languages,
  PlaySquare,
  FileText,
  UploadCloud,
  HelpCircle,
  Settings,
  MoreVertical,
  Trash2,
  MessageSquare,
  Cpu,
} from 'lucide-react';

import { AppTab } from '../types';
export type { AppTab };

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onOpenExport: () => void;
  onOpenTranslate: () => void;
  onOpenTutorialModal: () => void;
  onOpenGeminiConfig: () => void;
  hasSubtitles: boolean;
  subtitlesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenExport,
  onOpenTranslate,
  onOpenTutorialModal,
  onOpenGeminiConfig,
  hasSubtitles,
  subtitlesCount,
}) => {
  const isPlayerActive = activeTab === 'player' || activeTab === 'editor';
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Fecha o popover ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClearCache = () => {
    if (window.confirm('Deseja limpar o cache e reiniciar os dados locais do aplicativo?')) {
      try {
        localStorage.clear();
        window.location.reload();
      } catch (e) {
        alert('Cache limpo com sucesso!');
      }
    }
    setIsOverflowOpen(false);
  };

  const handleFeedback = () => {
    alert('Obrigado pelo feedback! Sua opinião é essencial para melhorar o LegendaFácil AI.');
    setIsOverflowOpen(false);
  };

  return (
    <header className="sticky top-0 z-45 w-full border-b border-slate-800 bg-[#0c0e14]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div
            id="brand-logo-button"
            onClick={() => setActiveTab('player')}
            className="flex cursor-pointer items-center gap-2.5 transition-transform hover:scale-[1.02]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">
                  LegendaFácil <span className="text-amber-400">AI</span>
                </span>
                <span className="hidden rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 md:inline-block">
                  PT-BR
                </span>
              </div>
              <p className="hidden text-[11px] text-slate-400 sm:block">
                Auto Subtitle Generator & Localizador
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-1.5 py-1 text-sm font-medium">
          {/* Aba 1: Reprodutor (Player) */}
          <button
            id="nav-tab-player"
            onClick={() => setActiveTab('player')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors cursor-pointer ${
              isPlayerActive
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
            title="Tela limpa do Reprodutor de Vídeo"
          >
            <PlaySquare className="h-4 w-4" />
            <span>Reprodutor</span>
          </button>

          {/* Aba 2: Legendas Geradas (Tela Separada) */}
          <button
            id="nav-tab-subtitles"
            onClick={() => setActiveTab('subtitles')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors cursor-pointer relative ${
              activeTab === 'subtitles'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
            title="Visualização e edição dedicada das legendas geradas"
          >
            <FileText className="h-4 w-4" />
            <span>Legendas</span>
            {subtitlesCount !== undefined && subtitlesCount > 0 && (
              <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                activeTab === 'subtitles'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-amber-400 border border-slate-700'
              }`}>
                {subtitlesCount}
              </span>
            )}
          </button>

          {/* Aba 3: Upload & Motor de IA */}
          <button
            id="nav-tab-upload"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
            title="Carregar arquivo, gravar áudio ou configurar motor de IA"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload & IA</span>
          </button>

          {/* Aba 4: Estilos & TikTok */}
          <button
            id="nav-tab-styles"
            onClick={() => setActiveTab('styles')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors cursor-pointer ${
              activeTab === 'styles'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
            title="Customizar cores, fontes e presets do TikTok"
          >
            <Sliders className="h-4 w-4" />
            <span>Estilos</span>
          </button>

          {/* Aba 5: Tutoriais */}
          <button
            id="nav-tab-tutorials"
            onClick={() => setActiveTab('tutorials')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors cursor-pointer ${
              activeTab === 'tutorials'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold'
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
            title="Guia de uso e tutoriais de legendagem"
          >
            <BookOpen className="h-4 w-4" />
            <span>Tutoriais</span>
          </button>
        </nav>

        {/* Right action group */}
        <div className="flex items-center gap-2 relative">
          <button
            id="btn-quick-translate"
            onClick={onOpenTranslate}
            title="Traduzir legendas com IA"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition-all hover:border-amber-400 hover:text-amber-300"
          >
            <Languages className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Traduzir</span>
          </button>

          <button
            id="btn-quick-export"
            onClick={onOpenExport}
            disabled={!hasSubtitles}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-sm ${
              hasSubtitles
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110 shadow-amber-500/20 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar</span>
          </button>

          {/* Overflow Menu (...) Popover Button */}
          <div className="relative" ref={popoverRef}>
            <button
              id="btn-overflow-menu"
              onClick={() => setIsOverflowOpen(!isOverflowOpen)}
              title="Mais opções e configurações"
              className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border border-slate-700/60 bg-slate-800/50 cursor-pointer flex items-center justify-center"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {/* Popover Dropdown */}
            {isOverflowOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#1E1E1E] border border-slate-700/80 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 text-left">
                <div className="px-3 py-1.5 border-b border-slate-800 mb-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Opções Avançadas</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsOverflowOpen(false);
                    onOpenGeminiConfig();
                  }}
                  className="w-full px-3 py-2.5 text-xs font-medium text-slate-200 hover:bg-[#2A2A2A] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                >
                  <Cpu className="h-4 w-4 text-amber-400" />
                  <span>Configurações Avançadas de IA</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOverflowOpen(false);
                    onOpenTutorialModal();
                  }}
                  className="w-full px-3 py-2.5 text-xs font-medium text-slate-200 hover:bg-[#2A2A2A] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                >
                  <HelpCircle className="h-4 w-4 text-sky-400" />
                  <span>Ajuda & Guia Rápido</span>
                </button>

                <button
                  type="button"
                  onClick={handleFeedback}
                  className="w-full px-3 py-2.5 text-xs font-medium text-slate-200 hover:bg-[#2A2A2A] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                >
                  <MessageSquare className="h-4 w-4 text-emerald-400" />
                  <span>Enviar Feedback</span>
                </button>

                <div className="border-t border-slate-800 my-1" />

                <button
                  type="button"
                  onClick={handleClearCache}
                  className="w-full px-3 py-2.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                >
                  <Trash2 className="h-4 w-4 text-rose-400" />
                  <span>Limpar Cache & Dados Locais</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
