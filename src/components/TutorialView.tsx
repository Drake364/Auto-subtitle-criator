import React, { useState } from 'react';
import {
  Sparkles,
  Palette,
  Languages,
  Clock,
  Download,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Tv,
} from 'lucide-react';
import { TUTORIALS_DATA } from '../data/sampleData';
import { TutorialGuide } from '../types';

interface TutorialViewProps {
  onNavigateToEditor: () => void;
  onNavigateToStyles: () => void;
  onNavigateToMonetization?: () => void;
}

export const TutorialView: React.FC<TutorialViewProps> = ({
  onNavigateToEditor,
  onNavigateToStyles,
}) => {
  const [selectedTutorial, setSelectedTutorial] = useState<TutorialGuide>(TUTORIALS_DATA[0]);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="h-5 w-5 text-amber-400" />;
      case 'Palette':
        return <Palette className="h-5 w-5 text-pink-400" />;
      case 'Languages':
        return <Languages className="h-5 w-5 text-sky-400" />;
      case 'Clock':
        return <Clock className="h-5 w-5 text-emerald-400" />;
      case 'Download':
        return <Download className="h-5 w-5 text-violet-400" />;
      case 'Tv':
        return <Tv className="h-5 w-5 text-amber-400" />;
      case 'DollarSign':
        return <DollarSign className="h-5 w-5 text-amber-400" />;
      default:
        return <BookOpen className="h-5 w-5 text-amber-400" />;
    }
  };

  const handleActionForTutorial = (tutorialId: string) => {
    if (tutorialId === 'tut-estilos') {
      onNavigateToStyles();
    } else {
      onNavigateToEditor();
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      {/* Hero Banner do Tutorial */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Central de Aprendizado e Tutoriais em Português</span>
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Domine a Legenda Automática e Multiplique o Alcance dos Seus Vídeos
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Tutoriais passo a passo preparados especialmente para criadores de conteúdo, produtores
            audiovisuais e desenvolvedores que desejam monetizar seus projetos no Google.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToEditor}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition-transform hover:scale-105"
            >
              <span>Abrir Estúdio e Praticar</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={onNavigateToStyles}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:text-white"
            >
              <Palette className="h-4 w-4 text-pink-400" />
              <span>Ver Estilos & Animações</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Lista de Tutoriais (Esquerda) e Conteúdo Detalhado (Direita) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Sidebar de Seleção de Tutoriais */}
        <div className="space-y-2.5 lg:col-span-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
            Escolha um Guia Prático
          </h2>
          {TUTORIALS_DATA.map((tut) => {
            const isSelected = selectedTutorial.id === tut.id;
            return (
              <div
                key={tut.id}
                onClick={() => setSelectedTutorial(tut)}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition-all ${
                  isSelected
                    ? 'border-amber-400 bg-slate-900 shadow-lg shadow-amber-500/10'
                    : 'border-slate-800/80 bg-[#12151e] hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="rounded-xl border border-slate-700/60 bg-slate-800 p-2.5">
                    {getIcon(tut.iconName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{tut.title}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-amber-300">
                        {tut.badge}
                      </span>
                      <span>•</span>
                      <span>{tut.duration} de leitura</span>
                    </div>
                  </div>
                </div>

                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    isSelected ? 'rotate-90 text-amber-400' : 'text-slate-600'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Painel do Tutorial Selecionado */}
        <div className="rounded-3xl border border-slate-800 bg-[#12151e] p-6 sm:p-8 lg:col-span-7 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                  {selectedTutorial.badge}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Tempo estimado: {selectedTutorial.duration}
                </span>
              </div>
              <h3 className="mt-2 text-xl font-extrabold text-white">
                {selectedTutorial.title}
              </h3>
              <p className="mt-1 text-xs text-slate-300">{selectedTutorial.description}</p>
            </div>

            <button
              onClick={() => handleActionForTutorial(selectedTutorial.id)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
            >
              <span>Praticar Agora</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Passos do Tutorial */}
          <div className="mt-6 space-y-5">
            {selectedTutorial.steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4"
              >
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-xs font-extrabold text-amber-300">
                  {idx + 1}
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="text-sm font-bold text-white">{step.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{step.detail}</p>
                  {step.codeOrAction && (
                    <div className="mt-2 rounded-lg bg-slate-950/80 p-2.5 font-mono text-[11px] text-amber-300 border border-slate-800">
                      <code>{step.codeOrAction}</code>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Dica de Especialista */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-200">
              <p className="font-bold">Dica de Retenção para Redes Sociais:</p>
              <p className="mt-0.5 text-emerald-300/90 leading-relaxed">
                Vídeos no TikTok e Instagram Reels com legendas dinâmicas em amarelo e palavras
                destacadas geram <strong>58% mais compartilhamentos</strong> e mantêm o espectador
                assistindo por mais de 85% do tempo de tela.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
