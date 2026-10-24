import React from 'react';
import { Check, Sparkles, Flame, Zap, Film, Tv, Radio } from 'lucide-react';
import { SubtitleStyle, PresetType } from '../types';
import { STYLE_PRESETS } from '../data/sampleData';

interface PresetGalleryProps {
  currentStyle: SubtitleStyle;
  onSelectPreset: (presetKey: PresetType) => void;
  sampleText?: string;
  isCompact?: boolean;
}

interface PresetCardItem {
  id: PresetType;
  title: string;
  badge: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  previewWord1: string;
  highlightWord: string;
  previewWord2: string;
  previewStyle: {
    fontFamily: string;
    textColor: string;
    highlightColor: string;
    backgroundColor: string;
    strokeColor: string;
    strokeWidth: number;
    textTransform: 'uppercase' | 'none';
  };
}

export const PRESET_CARDS: PresetCardItem[] = [
  {
    id: 'tiktok',
    title: 'TikTok / Reels Viral',
    badge: '🔥 Mais Usado',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: Flame,
    description: 'Amarelo ouro de alta retenção com contorno preto 3D',
    previewWord1: 'CRIE',
    highlightWord: 'VÍDEOS',
    previewWord2: 'VIRAIS',
    previewStyle: {
      fontFamily: 'Montserrat, sans-serif',
      textColor: '#FFFFFF',
      highlightColor: '#FACC15',
      backgroundColor: 'transparent',
      strokeColor: '#000000',
      strokeWidth: 3,
      textTransform: 'uppercase',
    },
  },
  {
    id: 'hormozi',
    title: 'Alex Hormozi Impact',
    badge: '⚡ Alta Retenção',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: Zap,
    description: 'Caixa alta em bloco com fundo escuro e verde neon',
    previewWord1: 'RETENÇÃO',
    highlightWord: 'MÁXIMA',
    previewWord2: 'NO FEED',
    previewStyle: {
      fontFamily: 'Montserrat, sans-serif',
      textColor: '#FFFFFF',
      highlightColor: '#22C55E',
      backgroundColor: 'rgba(0, 0, 0, 0.92)',
      strokeColor: '#000000',
      strokeWidth: 2,
      textTransform: 'uppercase',
    },
  },
  {
    id: 'beast',
    title: 'MrBeast Shorts',
    badge: '💥 Super Pop',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    icon: Sparkles,
    description: 'Bebas Neue gigante com contorno pesado de 4px',
    previewWord1: 'DESAFIO',
    highlightWord: 'ÉPICO',
    previewWord2: 'HOJE',
    previewStyle: {
      fontFamily: 'Bebas Neue, sans-serif',
      textColor: '#FFFFFF',
      highlightColor: '#22C55E',
      backgroundColor: 'transparent',
      strokeColor: '#050505',
      strokeWidth: 4,
      textTransform: 'uppercase',
    },
  },
  {
    id: 'minimal',
    title: 'Cinema & Vlogs',
    badge: '🎬 Clean & Estético',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    icon: Film,
    description: 'Tipografia limpa e moderna sem distrações visuais',
    previewWord1: 'Histórias que',
    highlightWord: 'conectam',
    previewWord2: 'pessoas',
    previewStyle: {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      textColor: '#F8FAFC',
      highlightColor: '#38BDF8',
      backgroundColor: 'transparent',
      strokeColor: 'rgba(0,0,0,0.6)',
      strokeWidth: 1.5,
      textTransform: 'none',
    },
  },
  {
    id: 'neon',
    title: 'Cyberpunk Neon',
    badge: '🎮 Gamer & Tech',
    badgeColor: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    icon: Radio,
    description: 'Ciano e magenta elétrico para podcasts e lives',
    previewWord1: 'FUTURO',
    highlightWord: 'CYBER',
    previewWord2: 'ONLINE',
    previewStyle: {
      fontFamily: 'Poppins, sans-serif',
      textColor: '#E0F2FE',
      highlightColor: '#EC4899',
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      strokeColor: '#0369A1',
      strokeWidth: 2,
      textTransform: 'uppercase',
    },
  },
  {
    id: 'newsbox',
    title: 'Notícias & TV',
    badge: '📺 Leitura 100%',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    icon: Tv,
    description: 'Fundo escuro semitransparente tipo broadcast',
    previewWord1: 'Notícia em',
    highlightWord: 'Destaque',
    previewWord2: 'Nacional',
    previewStyle: {
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      textColor: '#FFFFFF',
      highlightColor: '#38BDF8',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      strokeColor: '#000000',
      strokeWidth: 0,
      textTransform: 'none',
    },
  },
];

export const PresetGallery: React.FC<PresetGalleryProps> = ({
  currentStyle,
  onSelectPreset,
  isCompact = false,
}) => {
  return (
    <div id="preset-gallery-container" className="space-y-3 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">
            Galeria de Estilos Virais (1 Clique)
          </h3>
        </div>
        <span className="text-[11px] text-slate-400">
          Escolha um estilo para aplicar instantaneamente
        </span>
      </div>

      <div
        className={`grid gap-2.5 sm:gap-3 ${
          isCompact
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {PRESET_CARDS.map((card) => {
          const isSelected = currentStyle.preset === card.id;
          const Icon = card.icon;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectPreset(card.id)}
              className={`group relative flex flex-col p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer overflow-hidden ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/15 ring-2 ring-amber-500/40'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850 shadow-md'
              }`}
            >
              {/* Cabeçalho do Card */}
              <div className="flex items-center justify-between gap-2 mb-2 w-full">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 group-hover:text-amber-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-white truncate max-w-[140px]">
                    {card.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border ${card.badgeColor}`}
                  >
                    {card.badge}
                  </span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Pré-visualização Visual Realista da Legenda */}
              <div className="w-full bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 flex items-center justify-center min-h-[58px] overflow-hidden my-1">
                <div
                  className="px-2.5 py-1 rounded-lg text-center flex items-center justify-center gap-1.5 flex-wrap"
                  style={{
                    backgroundColor: card.previewStyle.backgroundColor,
                  }}
                >
                  <span
                    style={{
                      fontFamily: card.previewStyle.fontFamily,
                      color: card.previewStyle.textColor,
                      textTransform: card.previewStyle.textTransform,
                      WebkitTextStroke:
                        card.previewStyle.strokeWidth > 0
                          ? `${card.previewStyle.strokeWidth * 0.75}px ${card.previewStyle.strokeColor}`
                          : undefined,
                      fontWeight: 800,
                      fontSize: card.id === 'beast' ? '20px' : '15px',
                      letterSpacing: card.id === 'beast' ? '0.05em' : 'normal',
                      lineHeight: 1.1,
                    }}
                  >
                    {card.previewWord1}
                  </span>

                  <span
                    style={{
                      fontFamily: card.previewStyle.fontFamily,
                      color: card.previewStyle.highlightColor,
                      textTransform: card.previewStyle.textTransform,
                      WebkitTextStroke:
                        card.previewStyle.strokeWidth > 0
                          ? `${card.previewStyle.strokeWidth * 0.75}px ${card.previewStyle.strokeColor}`
                          : undefined,
                      fontWeight: 900,
                      fontSize: card.id === 'beast' ? '22px' : '16px',
                      letterSpacing: card.id === 'beast' ? '0.05em' : 'normal',
                      lineHeight: 1.1,
                      transform: isSelected ? 'scale(1.05)' : 'none',
                    }}
                  >
                    {card.highlightWord}
                  </span>

                  <span
                    style={{
                      fontFamily: card.previewStyle.fontFamily,
                      color: card.previewStyle.textColor,
                      textTransform: card.previewStyle.textTransform,
                      WebkitTextStroke:
                        card.previewStyle.strokeWidth > 0
                          ? `${card.previewStyle.strokeWidth * 0.75}px ${card.previewStyle.strokeColor}`
                          : undefined,
                      fontWeight: 800,
                      fontSize: card.id === 'beast' ? '20px' : '15px',
                      letterSpacing: card.id === 'beast' ? '0.05em' : 'normal',
                      lineHeight: 1.1,
                    }}
                  >
                    {card.previewWord2}
                  </span>
                </div>
              </div>

              {/* Descrição Curta */}
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                {card.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
