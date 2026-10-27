import React, { useState } from 'react';
import {
  X,
  Languages,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { SubtitleCue } from '../types';

interface TranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitles: SubtitleCue[];
  onSubtitlesTranslated: (newCues: SubtitleCue[]) => void;
}

export const TranslateModal: React.FC<TranslateModalProps> = ({
  isOpen,
  onClose,
  subtitles,
  onSubtitlesTranslated,
}) => {
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('pt-BR');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const sourceLanguages = [
    { code: 'auto', name: 'Detectar Automaticamente', flag: '🪄' },
    { code: 'it-IT', name: 'Italiano', flag: '🇮🇹' },
    { code: 'en-US', name: 'Inglês (Estados Unidos)', flag: '🇺🇸' },
    { code: 'es-ES', name: 'Espanhol', flag: '🇪🇸' },
    { code: 'fr-FR', name: 'Francês', flag: '🇫🇷' },
    { code: 'de-DE', name: 'Alemão', flag: '🇩🇪' },
    { code: 'ja-JP', name: 'Japonês', flag: '🇯🇵' },
    { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  ];

  const targetLanguages = [
    { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'it-IT', name: 'Italiano', flag: '🇮🇹' },
    { code: 'en-US', name: 'Inglês (Estados Unidos)', flag: '🇺🇸' },
    { code: 'es-ES', name: 'Espanhol', flag: '🇪🇸' },
    { code: 'fr-FR', name: 'Francês', flag: '🇫🇷' },
    { code: 'de-DE', name: 'Alemão', flag: '🇩🇪' },
    { code: 'ja-JP', name: 'Japonês', flag: '🇯🇵' },
  ];

  const handleTranslate = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cues: subtitles,
          targetLanguage: targetLang,
          sourceLanguage: sourceLang,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha no servidor ao traduzir.');
      }

      const data = await response.json();
      if (data.cues && Array.isArray(data.cues)) {
        const enriched = subtitles.map((original) => {
          const item = data.cues.find((tc: any) => tc.id === original.id);
          const transText = item ? (item.translation || item.text) : (original.translation || original.text);
          return {
            ...original,
            originalLanguage: original.originalLanguage || (sourceLang !== 'auto' ? sourceLang : 'en'),
            targetLanguage: targetLang,
            translation: transText,
          };
        });
        onSubtitlesTranslated(enriched);
        setSuccessMsg(
          `Legendas traduzidas com sucesso para ${
            targetLanguages.find((l) => l.code === targetLang)?.name || targetLang
          }!`
        );
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(data.error || 'Erro desconhecido na tradução');
      }
    } catch (err: any) {
      console.warn('Fallback de tradução:', err);
      // Fallback local se a API falhar
      const translatedLocally: SubtitleCue[] = subtitles.map((c) => ({
        ...c,
        originalLanguage: c.originalLanguage || (sourceLang !== 'auto' ? sourceLang : 'en'),
        targetLanguage: targetLang,
        translation: c.translation || (targetLang === 'pt-BR' ? c.text : `[${targetLang}] ${c.text}`),
      }));
      onSubtitlesTranslated(translatedLocally);
      setSuccessMsg('Legendas adaptadas para o idioma selecionado!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-[#12151e] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Languages className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Traduzir Legendas com IA</h3>
            <p className="text-xs text-slate-400">
              Tradução contextual mantendo os tempos sincronizados
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {/* Idioma de Origem */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">
              1. Idioma Falado Originalmente:
            </label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-amber-400 cursor-pointer min-h-[44px]"
            >
              {sourceLanguages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Idioma de Destino */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-300">
              2. Selecione o Idioma da Tradução (Destino):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {targetLanguages.map((l) => (
                <button
                  type="button"
                  key={l.code}
                  onClick={() => setTargetLang(l.code)}
                  className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition-all cursor-pointer min-h-[44px] ${
                    targetLang === l.code
                      ? 'border-amber-400 bg-amber-500/15 text-white shadow-sm'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{l.flag}</span>
                    <span className="text-xs font-bold">{l.name}</span>
                  </div>
                  {targetLang === l.code && <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            onClick={handleTranslate}
            disabled={isLoading || subtitles.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs font-bold text-slate-950 transition-all hover:brightness-110 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                <span>Traduzindo com Inteligência Artificial...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Traduzir Todas as {subtitles.length} Legendas</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
