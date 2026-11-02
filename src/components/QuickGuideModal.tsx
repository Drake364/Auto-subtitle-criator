import React from 'react';
import { X, Sparkles, Check, Play, BookOpen, ArrowRight } from 'lucide-react';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSample: () => void;
}

export const QuickGuideModal: React.FC<QuickGuideModalProps> = ({
  isOpen,
  onClose,
  onLoadSample,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-800 bg-[#12151e] p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Guia Rápido de Uso</h3>
            <p className="text-xs text-slate-400">
              Aprenda a legendar e viralizar vídeos em menos de 1 minuto
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-start gap-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300 flex-shrink-0">
              1
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Carregue ou Use o Vídeo de Exemplo</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Você pode arrastar qualquer arquivo MP4, WebM ou MOV, gravar áudio ou clicar no vídeo
                de exemplo já pronto.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300 flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Gere Legendas Automáticas com IA</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Clique em &quot;Gerar com IA&quot; para que o Gemini transcreva as falas com pontuação
                perfeita em Português e sincronia milimétrica.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300 flex-shrink-0">
              3
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Aplique Estilos Virais (TikTok / Reels)</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Escolha o preset TikTok ou MrBeast, ative o efeito karaokê para destacar as palavras
                faladas e ajuste a posição ideal.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/20 text-xs font-bold text-amber-300 flex-shrink-0">
              4
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Exporte em .SRT ou Publique no Google</h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Baixe o arquivo de legenda compatível com YouTube e CapCut ou consulte nosso módulo de
                publicação na Google Play Store.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            onClick={() => {
              onLoadSample();
              onClose();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:text-white"
          >
            <Play className="h-3.5 w-3.5 fill-current text-amber-400" />
            <span>Carregar Vídeo de Exemplo</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
          >
            <span>Entendi, vamos começar!</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
