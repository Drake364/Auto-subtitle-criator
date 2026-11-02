import React, { useEffect, useState } from 'react';
import { X, Palette, Sparkles, Sliders, Check, ArrowLeft, Save } from 'lucide-react';
import { SubtitleStyle } from '../types';
import { StyleCustomizer } from './StyleCustomizer';

interface StyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  style: SubtitleStyle;
  setStyle: (newStyle: SubtitleStyle) => void;
  onNavigateToStylesTab?: () => void;
}

export const StyleModal: React.FC<StyleModalProps> = ({
  isOpen,
  onClose,
  style,
  setStyle,
  onNavigateToStylesTab,
}) => {
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Salvar no localStorage e fechar
  const handleSaveAndClose = () => {
    try {
      localStorage.setItem('legendafacil_custom_style', JSON.stringify(style));
    } catch (e) {}
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 400);
  };
  // Bloquear rolagem do background e suporte a tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay: escurece a interface de fundo (incluindo o player) e bloqueia qualquer interação */}
      <div
        id="style-modal-backdrop"
        className="fixed inset-0 z-[990] bg-black/85 backdrop-blur-md transition-opacity duration-200 pointer-events-auto cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Wrapper centralizado do modal com z-index prioritário */}
      <div
        id="style-modal-wrapper"
        role="dialog"
        aria-modal="true"
        aria-labelledby="style-modal-title"
        className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto pointer-events-none"
      >
        <div
          id="style-modal-content"
          className="pointer-events-auto relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-700/80 bg-[#12151e] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        >
          {/* Cabeçalho do Modal */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/90 bg-slate-950/70 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer mr-1"
                title="Voltar para a tela anterior"
              >
                <ArrowLeft className="h-4 w-4 text-amber-400" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <h3 id="style-modal-title" className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Opções de Estilo das Legendas</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {style.preset.toUpperCase()}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Altere cores, tamanho da fonte, contornos e animações em tempo real
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveAndClose}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
                  savedFeedback
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
                title="Salvar alterações de estilo"
              >
                {savedFeedback ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>{savedFeedback ? 'Salvo!' : 'Salvar'}</span>
              </button>

              {onNavigateToStylesTab && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToStylesTab();
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                  title="Abrir tela com reprodutor lado a lado"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Estúdio Completo</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                title="Fechar janela de estilos"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Corpo do Modal com Scroll Interno Limpo */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-6">
            <StyleCustomizer
              style={style}
              setStyle={setStyle}
              onChangeStyle={setStyle}
              isInsideModal={true}
              onBack={onClose}
              onSave={handleSaveAndClose}
            />
          </div>

          {/* Rodapé com Ação Rápida */}
          <div className="px-5 py-3.5 border-t border-slate-800/90 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-slate-400 hidden sm:inline">
              ✨ As alterações são aplicadas instantaneamente ao vídeo
            </span>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm font-bold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>Voltar ao Vídeo</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndClose}
                className={`px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer flex-1 sm:flex-initial ${
                  savedFeedback
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                {savedFeedback ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{savedFeedback ? 'Salvo com Sucesso!' : 'Salvar Modificações'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
