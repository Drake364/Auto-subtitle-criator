import React, { useState, useEffect } from 'react';
import {
  Palette,
  Sparkles,
  Sliders,
  Type,
  Layers,
  Check,
  RotateCcw,
  Eye,
  Plus,
  Minus,
  AlignVerticalSpaceAround,
  ArrowLeft,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { SubtitleStyle, PresetType } from '../types';
import { STYLE_PRESETS, DEFAULT_STYLE } from '../data/sampleData';
import { PresetGallery } from './PresetGallery';

interface StyleCustomizerProps {
  style: SubtitleStyle;
  onChangeStyle?: (newStyle: SubtitleStyle) => void;
  setStyle?: React.Dispatch<React.SetStateAction<SubtitleStyle>> | ((newStyle: SubtitleStyle) => void);
  sampleText?: string;
  onSampleTextChange?: (text: string) => void;
  isInsideModal?: boolean;
  onBack?: () => void;
  onSave?: () => void;
  showToast?: (msg: string) => void;
}

export const StyleCustomizer: React.FC<StyleCustomizerProps> = ({
  style,
  onChangeStyle,
  setStyle,
  sampleText = 'CRIE VÍDEOS VIRAIS COM LEGENDA AUTOMÁTICA',
  onSampleTextChange,
  isInsideModal = false,
  onBack,
  onSave,
  showToast,
}) => {
  const [activeWordIndex, setActiveWordIndex] = useState(1);
  const [justSaved, setJustSaved] = useState(false);
  const [localSampleText, setLocalSampleText] = useState(sampleText);
  const [localBurnInNative, setLocalBurnInNative] = useState<boolean>(!!style.burnInNative);
  const [applyFeedback, setApplyFeedback] = useState(false);

  interface SavedPreset {
    id: string;
    name: string;
    style: SubtitleStyle;
  }
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>(() => {
    try {
      const stored = localStorage.getItem('legendafacil_user_saved_presets');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [presetNameInput, setPresetNameInput] = useState('');

  const handleSaveCustomPreset = () => {
    if (!presetNameInput.trim()) {
      if (showToast) showToast('Digite um nome para o seu preset personalizado.');
      return;
    }
    const newPreset: SavedPreset = {
      id: `preset-${Date.now()}`,
      name: presetNameInput.trim(),
      style: { ...style },
    };
    const updated = [newPreset, ...savedPresets];
    setSavedPresets(updated);
    setPresetNameInput('');
    try {
      localStorage.setItem('legendafacil_user_saved_presets', JSON.stringify(updated));
    } catch {}
    if (showToast) showToast(`Preset "${newPreset.name}" salvo com sucesso!`);
  };

  const handleLoadCustomPreset = (preset: SavedPreset) => {
    updateStyle({ ...preset.style });
    if (showToast) showToast(`Preset "${preset.name}" carregado!`);
  };

  const handleDeleteCustomPreset = (id: string) => {
    const updated = savedPresets.filter((p) => p.id !== id);
    setSavedPresets(updated);
    try {
      localStorage.setItem('legendafacil_user_saved_presets', JSON.stringify(updated));
    } catch {}
    if (showToast) showToast('Preset removido.');
  };

  useEffect(() => {
    setLocalSampleText(sampleText);
  }, [sampleText]);

  useEffect(() => {
    setLocalBurnInNative(!!style.burnInNative);
  }, [style.burnInNative]);

  const handleTestTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSampleText(val);
    if (typeof onSampleTextChange === 'function') {
      onSampleTextChange(val);
    }
  };

  const handleApplyConfiguration = () => {
    updateStyle({
      ...style,
      burnInNative: localBurnInNative,
    });
    try {
      localStorage.setItem('legendafacil_custom_style', JSON.stringify({ ...style, burnInNative: localBurnInNative }));
    } catch {}
    setApplyFeedback(true);
    setTimeout(() => setApplyFeedback(false), 2500);
    if (showToast) {
      showToast('Configuração de estilo e Burn-in Nativo aplicada com sucesso!');
    }
  };

  // Efeito simulado de karaokê na pré-visualização ao vivo
  useEffect(() => {
    if (style.animation !== 'karaoke') return;
    const interval = setInterval(() => {
      setActiveWordIndex((prev) => (prev + 1) % 5);
    }, 700);
    return () => clearInterval(interval);
  }, [style.animation]);

  const updateStyle = (newStyle: SubtitleStyle) => {
    if (typeof onChangeStyle === 'function') {
      onChangeStyle(newStyle);
    } else if (typeof setStyle === 'function') {
      setStyle(newStyle);
    }
  };

  const applyPreset = (presetKey: string) => {
    const presetData = STYLE_PRESETS[presetKey];
    if (!presetData) return;

    updateStyle({
      ...style,
      preset: presetKey as PresetType,
      fontFamily: presetData.fontFamily || style.fontFamily,
      fontSize: presetData.fontSize || style.fontSize,
      textColor: presetData.textColor || style.textColor,
      highlightColor: presetData.highlightColor || style.highlightColor,
      backgroundColor: presetData.backgroundColor || style.backgroundColor,
      strokeColor: presetData.strokeColor || style.strokeColor,
      strokeWidth: presetData.strokeWidth ?? style.strokeWidth,
      yOffsetPercent: presetData.yOffsetPercent || style.yOffsetPercent,
      textTransform: presetData.textTransform || style.textTransform,
      animation: presetData.animation || style.animation,
      isBold: presetData.isBold ?? style.isBold,
    });
  };

  const handleResetDefault = () => {
    updateStyle({ ...DEFAULT_STYLE });
  };

  const handleSaveStyle = () => {
    try {
      localStorage.setItem('legendafacil_custom_style', JSON.stringify(style));
    } catch (e) {}
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
    if (typeof onSave === 'function') {
      onSave();
    }
  };

  // Cores predefinidas para seleção rápida
  const highlightColorPresets = [
    { color: '#FACC15', label: 'Amarelo TikTok' },
    { color: '#22C55E', label: 'Verde Beast' },
    { color: '#38BDF8', label: 'Azul Neon' },
    { color: '#EC4899', label: 'Rosa Pink' },
    { color: '#FF0055', label: 'Vermelho Viral' },
    { color: '#A855F7', label: 'Roxo Elétrico' },
    { color: '#FB923C', label: 'Laranja Flame' },
    { color: '#FFFFFF', label: 'Branco Puro' },
  ];

  const textColorPresets = [
    { color: '#FFFFFF', label: 'Branco' },
    { color: '#F8FAFC', label: 'Off-White' },
    { color: '#E2E8F0', label: 'Cinza Claro' },
    { color: '#000000', label: 'Preto' },
    { color: '#FACC15', label: 'Amarelo' },
    { color: '#38BDF8', label: 'Ciano' },
  ];

  const strokeColorPresets = [
    { color: '#000000', label: 'Preto Puro' },
    { color: '#050505', label: 'Sombra Escura' },
    { color: '#0369A1', label: 'Azul Marinho' },
    { color: '#1E1B4B', label: 'Índigo' },
    { color: '#FFFFFF', label: 'Branco' },
  ];

  const backgroundColorPresets = [
    { color: 'transparent', label: 'Sem Fundo (Transparente)' },
    { color: 'rgba(0, 0, 0, 0.65)', label: 'Preto Suave (65%)' },
    { color: 'rgba(0, 0, 0, 0.90)', label: 'Preto Sólido (90%)' },
    { color: 'rgba(15, 23, 42, 0.85)', label: 'Azul Escuro (85%)' },
    { color: 'rgba(250, 204, 21, 0.95)', label: 'Caixa Amarela' },
  ];

  const fontFamilies = [
    { id: 'Montserrat, sans-serif', label: 'Montserrat', desc: 'Padrão TikTok / Reels (Robusta)' },
    { id: 'Bebas Neue, sans-serif', label: 'Bebas Neue', desc: 'Estilo MrBeast (Alta e Condensada)' },
    { id: 'Poppins, sans-serif', label: 'Poppins', desc: 'Geométrica Moderna (Gamer/Tech)' },
    { id: 'Plus Jakarta Sans, sans-serif', label: 'Plus Jakarta', desc: 'Elegante e Corporativa' },
  ];

  // Palavras de exemplo para o preview dinâmico
  const words = localSampleText.split(' ').filter(Boolean).slice(0, 6);

  return (
    <div
      id="styles-editor-column"
      className={`bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-6 relative z-20 w-full ${
        isInsideModal ? 'p-0 bg-transparent border-0 shadow-none' : 'p-4 sm:p-6'
      }`}
    >
      {/* CABEÇALHO DO PAINEL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer mr-1"
                title="Voltar para a tela anterior"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
              </button>
            )}
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Personalização de Estilo e Legendas Virais</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ajuste em tempo real cores, fontes, tamanhos, bordas e destaque karaokê
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer shrink-0"
              title="Voltar para o reprodutor de vídeo"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Voltar</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveStyle}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow cursor-pointer shrink-0 ${
              justSaved
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
            }`}
            title="Salvar alterações de estilo no seu navegador"
          >
            {justSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{justSaved ? 'Salvo!' : 'Salvar'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefault}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer shrink-0"
            title="Restaurar estilo padrão TikTok"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Padrão</span>
          </button>
        </div>
      </div>

      {/* PRÉ-VISUALIZAÇÃO AO VIVO INTEGRADA (SEMPRE VISÍVEL NO TOPO DO PAINEL) */}
      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-b from-slate-950 via-black to-slate-950 p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80 text-[11px] font-bold text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-bold uppercase tracking-wider">
              Amostra em Tempo Real do Seu Estilo
            </span>
          </div>
          <span className="text-amber-400 font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
            {style.fontSize}px • {style.animation.toUpperCase()}
          </span>
        </div>

        {/* CAMPO LEGENDA DE TESTE & BURN-IN NATIVO */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-amber-400" />
              <span>Legenda de Teste</span>
            </label>
            <input
              type="text"
              value={localSampleText}
              onChange={handleTestTextChange}
              placeholder="Digite o texto de teste para ver na pré-visualização..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={localBurnInNative}
                onChange={(e) => setLocalBurnInNative(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-200">Ativar Burn-in Nativo</span>
            </label>

            <button
              type="button"
              onClick={handleApplyConfiguration}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow cursor-pointer ${
                applyFeedback
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              }`}
              title="Aplicar configuração de estilo e Burn-in Nativo"
            >
              {applyFeedback ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{applyFeedback ? 'Aplicado!' : 'Aplicar Configuração'}</span>
            </button>
          </div>
        </div>
        <div className="min-h-[90px] sm:min-h-[110px] flex items-center justify-center p-3 text-center">
          <div
            className="inline-block transition-all duration-150 select-none"
            style={{
              fontFamily: style.fontFamily,
              fontSize: `${Math.min(style.fontSize, 40)}px`,
              backgroundColor: style.backgroundColor,
              padding: style.backgroundColor !== 'transparent' ? '6px 16px' : '0',
              borderRadius: '12px',
              textTransform: style.textTransform,
              fontWeight: style.isBold ? 900 : 700,
              lineHeight: '1.25',
            }}
          >
            {style.animation === 'karaoke' ? (
              <span className="inline-flex flex-wrap justify-center items-center gap-x-2 gap-y-1">
                {words.map((w, index) => {
                  const isActive = index === activeWordIndex;
                  return (
                    <span
                      key={index}
                      className={`transition-all duration-150 inline-block ${
                        isActive ? 'scale-110 -translate-y-0.5' : 'scale-100'
                      }`}
                      style={{
                        color: isActive ? style.highlightColor : style.textColor,
                        textShadow:
                          style.strokeWidth > 0
                            ? `0 0 ${style.strokeWidth * 2}px ${style.strokeColor}, -1.5px -1.5px 0 ${
                                style.strokeColor
                              }, 1.5px -1.5px 0 ${style.strokeColor}, -1.5px 1.5px 0 ${
                                style.strokeColor
                              }, 1.5px 1.5px 0 ${style.strokeColor}`
                            : '0 2px 8px rgba(0,0,0,0.8)',
                      }}
                    >
                      {w}
                    </span>
                  );
                })}
              </span>
            ) : (
              <span
                style={{
                  color: style.textColor,
                  textShadow:
                    style.strokeWidth > 0
                      ? `0 0 ${style.strokeWidth * 2}px ${style.strokeColor}, -2px -2px 0 ${
                          style.strokeColor
                        }, 2px -2px 0 ${style.strokeColor}, -2px 2px 0 ${
                          style.strokeColor
                        }, 2px 2px 0 ${style.strokeColor}`
                      : '0 2px 8px rgba(0,0,0,0.8)',
                }}
              >
                {localSampleText}
              </span>
            )}
          </div>
        </div>

        {/* CAMPO DE ENTRADA PARA TESTAR TEXTO ARBITRÁRIO INSTANTANEAMENTE */}
        <div className="mt-2 pt-3 border-t border-slate-800/80 flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 shrink-0">Testar texto:</span>
          <input
            type="text"
            value={localSampleText}
            onChange={(e) => setLocalSampleText(e.target.value)}
            placeholder="Digite qualquer texto para testar o estilo..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
          />
          {localSampleText !== sampleText && (
            <button
              type="button"
              onClick={() => setLocalSampleText(sampleText)}
              className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer shrink-0"
              title="Restaurar texto padrão"
            >
              Restaurar
            </button>
          )}
        </div>
      </div>

      {/* SEÇÃO 1: GALERIA DE PRESETS VISUAIS (1-CLIQUE) */}
      <div className="pt-1 space-y-4">
        <PresetGallery
          currentStyle={style}
          onSelectPreset={(presetKey) => applyPreset(presetKey)}
          sampleText={sampleText}
          isCompact={isInsideModal}
        />

        {/* MEUS PRESETS SALVOS NO LOCALSTORAGE */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Meus Presets Personalizados Salvos</span>
            </h4>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
              {savedPresets.length} salvos
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={presetNameInput}
              onChange={(e) => setPresetNameInput(e.target.value)}
              placeholder="Nome do seu preset (ex: Meu Estilo TikTok)..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="button"
              onClick={handleSaveCustomPreset}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Estilo</span>
            </button>
          </div>

          {savedPresets.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-40 overflow-y-auto">
              {savedPresets.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-700 bg-slate-950/60 hover:border-amber-500/50 transition-all"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-bold text-white truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400">
                      Fonte: {p.style.fontFamily.split(',')[0]} • {p.style.fontSize}px
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleLoadCustomPreset(p)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-[11px] font-bold transition-all cursor-pointer"
                    >
                      Carregar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomPreset(p.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Excluir preset"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO 2: TIPOGRAFIA E DIMENSÕES */}
      <div className="pt-4 border-t border-slate-800 space-y-5">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Type className="w-4 h-4 text-amber-400" />
          <span>Tipografia & Tamanho</span>
        </h3>

        {/* Família da Fonte */}
        <div>
          <label className="text-xs text-slate-300 font-medium block mb-2">
            Família da Fonte (Tipografia)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {fontFamilies.map((f) => {
              const isSelected = style.fontFamily.includes(f.label) || style.fontFamily === f.id;
              return (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => updateStyle({ ...style, fontFamily: f.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-400/40'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-white" style={{ fontFamily: f.id }}>
                      {f.label}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                  </div>
                  <span className="text-[10px] text-slate-400">{f.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Destaque para Tamanho Mínimo / Discreto para não cobrir o vídeo */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 text-xs">
            <span className="text-amber-400 text-lg">🔍</span>
            <div>
              <p className="text-white font-bold">Modo Legenda Discreta (Menor Tamanho Possível)</p>
              <p className="text-[11px] text-slate-400">
                Reduz a fonte para que as legendas nunca cubram o vídeo, rostos ou detalhes importantes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateStyle({ ...style, fontSize: 11 })}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 cursor-pointer ${
              style.fontSize <= 12
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/40'
            }`}
          >
            {style.fontSize <= 12 ? '✓ Ativo (11px)' : 'Ativar Tamanho Mínimo (11px)'}
          </button>
        </div>

        {/* Tamanho da Fonte com Slider e Botões de Ajuste Fino */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <span>Tamanho da Fonte (Mínimo 10px até 42px)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateStyle({ ...style, fontSize: Math.max(10, style.fontSize - 1) })}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold border border-slate-700 cursor-pointer"
                title="Diminuir fonte em 1px"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-amber-400 font-mono font-bold text-sm px-2 py-0.5 rounded bg-slate-900 border border-slate-700 min-w-[54px] text-center">
                {style.fontSize}px
              </span>
              <button
                type="button"
                onClick={() => updateStyle({ ...style, fontSize: Math.min(42, style.fontSize + 1) })}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold border border-slate-700 cursor-pointer"
                title="Aumentar fonte em 1px"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <input
            type="range"
            min={10}
            max={42}
            step={1}
            value={style.fontSize}
            onChange={(e) => updateStyle({ ...style, fontSize: Number(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />

          {/* Botões de tamanhos rápidos */}
          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
            <span className="text-[10px] text-slate-400 font-medium">Tamanhos rápidos:</span>
            {[
              { label: 'Mínimo (10px)', size: 10 },
              { label: 'Ultra Discreto (12px)', size: 12 },
              { label: 'Discreto (14px)', size: 14 },
              { label: 'Padrão (16px)', size: 16 },
              { label: 'Médio (20px)', size: 20 },
              { label: 'Grande (26px)', size: 26 },
            ].map((item) => (
              <button
                type="button"
                key={item.size}
                onClick={() => updateStyle({ ...style, fontSize: item.size })}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                  style.fontSize === item.size
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Posição Vertical na Tela (Altura no Vídeo) */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <AlignVerticalSpaceAround className="w-4 h-4 text-amber-400" />
              <span>Posição Vertical no Vídeo (Altura)</span>
            </span>
            <span className="text-amber-400 font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
              {style.yOffsetPercent}% do Topo
            </span>
          </div>

          <input
            type="range"
            min={15}
            max={92}
            value={style.yOffsetPercent}
            onChange={(e) => updateStyle({ ...style, yOffsetPercent: Number(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Topo (25%)', val: 25 },
              { label: 'Centro (50%)', val: 50 },
              { label: 'Padrão Reels (78%)', val: 78 },
              { label: 'Rodapé (85%)', val: 85 },
            ].map((pos) => (
              <button
                type="button"
                key={pos.val}
                onClick={() => updateStyle({ ...style, yOffsetPercent: pos.val })}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                  style.yOffsetPercent === pos.val
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-500">
            Recomendado para Reels/TikTok: 75% a 80% (não sobrepõe os botões de curtir e comentários).
          </p>
        </div>

        {/* Espessura do Contorno (Stroke) */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Espessura do Contorno da Letra (Borda)</span>
            <span className="text-amber-400 font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-700">
              {style.strokeWidth}px
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={8}
            step={1}
            value={style.strokeWidth}
            onChange={(e) => updateStyle({ ...style, strokeWidth: Number(e.target.value) })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />

          <div className="flex items-center gap-2">
            {[
              { label: 'Sem borda (0px)', width: 0 },
              { label: 'Fino (2px)', width: 2 },
              { label: 'Médio (3px)', width: 3 },
              { label: 'Grosso Beast (5px)', width: 5 },
            ].map((st) => (
              <button
                type="button"
                key={st.width}
                onClick={() => updateStyle({ ...style, strokeWidth: st.width })}
                className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                  style.strokeWidth === st.width
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Efeito de Animação */}
        <div>
          <label className="text-xs text-slate-300 font-medium block mb-2">
            Animação de Destaque das Palavras
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'karaoke', label: '🎤 Karaokê', desc: 'Palavra por palavra' },
              { id: 'pop', label: '💥 Efeito Pop', desc: 'Salto e escala' },
              { id: 'fade', label: '✨ Fade Suave', desc: 'Entrada elegante' },
              { id: 'none', label: '⏹️ Estático', desc: 'Frase fixa' },
            ].map((anim) => (
              <button
                type="button"
                key={anim.id}
                onClick={() => updateStyle({ ...style, animation: anim.id as any })}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                  style.animation === anim.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="block font-bold text-xs">{anim.label}</span>
                <span className="text-[10px] opacity-80 block">{anim.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: PALETAS DE CORES COMPLETAS */}
      <div className="pt-4 border-t border-slate-800 space-y-6">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Palette className="w-4 h-4 text-amber-400" />
          <span>Paleta de Cores e Fundo</span>
        </h3>

        {/* 1. Cor de Destaque (Highlight / Karaokê) */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-200 font-bold">Cor de Destaque (Palavra Ativa no Karaokê)</span>
            <span className="font-mono text-xs text-amber-400 font-bold">{style.highlightColor}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={style.highlightColor}
                onChange={(e) => updateStyle({ ...style, highlightColor: e.target.value })}
                className="w-10 h-10 rounded-xl bg-transparent border-2 border-slate-700 cursor-pointer p-0.5 hover:border-amber-400 transition-colors"
                title="Escolher cor personalizada"
              />
              <span className="text-[11px] text-slate-400">Personalizar</span>
            </div>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            {/* Presets de cores rápidas */}
            <div className="flex items-center gap-2 flex-wrap">
              {highlightColorPresets.map((c) => (
                <button
                  type="button"
                  key={c.color}
                  onClick={() => updateStyle({ ...style, highlightColor: c.color })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-115 cursor-pointer shadow-md ${
                    style.highlightColor.toLowerCase() === c.color.toLowerCase()
                      ? 'border-white ring-2 ring-amber-400 scale-110'
                      : 'border-white/20'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 2. Cor do Texto Principal */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-200 font-bold">Cor do Texto Principal</span>
            <span className="font-mono text-xs text-amber-400 font-bold">{style.textColor}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={style.textColor}
                onChange={(e) => updateStyle({ ...style, textColor: e.target.value })}
                className="w-10 h-10 rounded-xl bg-transparent border-2 border-slate-700 cursor-pointer p-0.5 hover:border-amber-400 transition-colors"
                title="Escolher cor personalizada"
              />
              <span className="text-[11px] text-slate-400">Personalizar</span>
            </div>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2 flex-wrap">
              {textColorPresets.map((c) => (
                <button
                  type="button"
                  key={c.color}
                  onClick={() => updateStyle({ ...style, textColor: c.color })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-115 cursor-pointer shadow-md ${
                    style.textColor.toLowerCase() === c.color.toLowerCase()
                      ? 'border-white ring-2 ring-amber-400 scale-110'
                      : 'border-white/20'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 3. Cor da Borda/Contorno */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-200 font-bold">Cor do Contorno da Letra (Borda)</span>
            <span className="font-mono text-xs text-amber-400 font-bold">{style.strokeColor}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={style.strokeColor}
                onChange={(e) => updateStyle({ ...style, strokeColor: e.target.value })}
                className="w-10 h-10 rounded-xl bg-transparent border-2 border-slate-700 cursor-pointer p-0.5 hover:border-amber-400 transition-colors"
                title="Escolher cor de contorno"
              />
              <span className="text-[11px] text-slate-400">Personalizar</span>
            </div>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2 flex-wrap">
              {strokeColorPresets.map((c) => (
                <button
                  type="button"
                  key={c.color}
                  onClick={() => updateStyle({ ...style, strokeColor: c.color })}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-115 cursor-pointer shadow-md ${
                    style.strokeColor.toLowerCase() === c.color.toLowerCase()
                      ? 'border-white ring-2 ring-amber-400 scale-110'
                      : 'border-white/20'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 4. Cor e Estilo de Fundo da Legenda */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-200 font-bold">Fundo da Caixa de Legenda</span>
            <span className="text-slate-400 text-xs">
              {style.backgroundColor === 'transparent' ? 'Sem fundo' : 'Com fundo'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {backgroundColorPresets.map((bg) => {
              const isSelected = style.backgroundColor === bg.color;
              return (
                <button
                  type="button"
                  key={bg.color}
                  onClick={() => updateStyle({ ...style, backgroundColor: bg.color })}
                  className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-400/40'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="truncate">{bg.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Opção de Caixa Alta (LETRAS MAIÚSCULAS) & Negrito */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm text-slate-200 font-bold">
            <input
              type="checkbox"
              checked={style.textTransform === 'uppercase'}
              onChange={(e) =>
                updateStyle({
                  ...style,
                  textTransform: e.target.checked ? 'uppercase' : 'none',
                })
              }
              className="w-5 h-5 rounded-lg bg-slate-800 border-slate-700 text-amber-500 accent-amber-500 cursor-pointer"
            />
            <span>TRANSFORMAR EM MAIÚSCULAS (Estilo Viral)</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm text-slate-200 font-bold">
            <input
              type="checkbox"
              checked={style.isBold}
              onChange={(e) =>
                updateStyle({
                  ...style,
                  isBold: e.target.checked,
                })
              }
              className="w-5 h-5 rounded-lg bg-slate-800 border-slate-700 text-amber-500 accent-amber-500 cursor-pointer"
            />
            <span>Texto em Negrito Extra (Impacto Máximo)</span>
          </label>
        </div>

        {/* 6. Seletor Visual e Botão de Aplicar Burn-in (Nativamente no Vídeo) */}
        <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Queimar Legendas Nativamente (Burn-in)</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${style.burnInNative ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
              {style.burnInNative ? 'Ativado para Exportação' : 'Desativado'}
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Ative esta opção para fixar permanentemente as legendas e seus estilos atuais diretamente nos quadros do vídeo durante o próximo ciclo de exportação.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-200">
              <input
                type="checkbox"
                checked={!!style.burnInNative}
                onChange={(e) =>
                  updateStyle({
                    ...style,
                    burnInNative: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-amber-500 accent-amber-500 cursor-pointer"
              />
              <span>Ativar Queima de Legendas Nativamente</span>
            </label>

            <button
              type="button"
              onClick={() => {
                updateStyle({ ...style, burnInNative: true });
                setJustSaved(true);
                setTimeout(() => setJustSaved(false), 2000);
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Aplicar Burn-in</span>
            </button>
          </div>
        </div>

        {/* BARRA FIXA / RODAPÉ COM BOTÕES INTUITIVOS DE SALVAR E VOLTAR */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Suas alterações são aplicadas instantaneamente ao reprodutor</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>Voltar ao Reprodutor</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveStyle}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                justSaved
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              {justSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{justSaved ? 'Alterações Salvas com Sucesso!' : 'Salvar e Aplicar ao Vídeo'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
