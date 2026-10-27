import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Palette,
  Languages,
  Clock,
  Download,
  DollarSign,
  Tv,
  Zap,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { TUTORIALS_DATA } from '../data/sampleData';
import { TutorialGuide } from '../types';

export const TutorialsView: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string>('tut-gerar');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case 'Palette':
        return <Palette className="w-5 h-5 text-rose-400" />;
      case 'Languages':
        return <Languages className="w-5 h-5 text-sky-400" />;
      case 'Clock':
        return <Clock className="w-5 h-5 text-emerald-400" />;
      case 'Download':
        return <Download className="w-5 h-5 text-amber-400" />;
      case 'DollarSign':
        return <DollarSign className="w-5 h-5 text-emerald-400" />;
      case 'Tv':
        return <Tv className="w-5 h-5 text-amber-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-emerald-400" />;
      default:
        return <BookOpen className="w-5 h-5 text-amber-400" />;
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              Tutoriais de Uso & Boas Práticas
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Passo a passo visual para gerar legendas perfeitas, estilizar vídeos virais e monetizar no Google.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Guias */}
      <div className="space-y-3">
        {TUTORIALS_DATA.map((tutorial) => {
          const isExpanded = expandedId === tutorial.id;

          return (
            <div
              key={tutorial.id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isExpanded
                  ? 'bg-slate-900 border-amber-500/40 shadow-xl'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Botão de Toggle do Card */}
              <button
                onClick={() => setExpandedId(isExpanded ? '' : tutorial.id)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="p-2 rounded-xl bg-slate-800/90 border border-slate-700/60 shrink-0 mt-0.5 sm:mt-0">
                    {getIcon(tutorial.iconName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-white">
                        {tutorial.title}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                        {tutorial.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {tutorial.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                    {tutorial.duration}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-amber-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Conteúdo Expandido com Passos */}
              {isExpanded && (
                <div className="px-4 sm:px-6 pb-5 pt-1 border-t border-slate-800/80 space-y-4 animate-in fade-in">
                  <div className="space-y-3">
                    {tutorial.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{step.title}</span>
                        </div>
                        <p className="text-xs text-slate-400 pl-6 leading-relaxed">
                          {step.detail}
                        </p>
                        {step.codeOrAction && (
                          <div className="ml-6 mt-1 flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-amber-300">
                            <span className="truncate">{step.codeOrAction}</span>
                            <button
                              onClick={() => handleCopy(step.codeOrAction!, `${tutorial.id}-${idx}`)}
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white shrink-0"
                              title="Copiar"
                            >
                              {copiedCode === `${tutorial.id}-${idx}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
