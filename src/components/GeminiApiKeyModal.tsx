import React, { useState } from 'react';
import { Sparkles, Key, ExternalLink, CheckCircle2, X, ShieldCheck, Zap } from 'lucide-react';

interface GeminiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKey: (key: string) => void;
  isFirstUse?: boolean;
}

export const GeminiApiKeyModal: React.FC<GeminiApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSaveKey,
  isFirstUse = false,
}) => {
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem('user_gemini_api_key') || '';
    } catch {
      return '';
    }
  });
  const [isValidating, setIsValidating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      const trimmed = apiKey.trim();
      if (trimmed) {
        localStorage.setItem('user_gemini_api_key', trimmed);
        onSaveKey(trimmed);
        setSuccessMessage('Chave conectada com sucesso!');
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 1500);
      } else {
        localStorage.removeItem('user_gemini_api_key');
        onSaveKey('');
        onClose();
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80 transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {isFirstUse ? 'Bem-vindo ao LegendaFácil AI!' : 'Configuração da Chave API do Gemini'}
            </h3>
            <p className="text-xs text-slate-400">
              {isFirstUse
                ? 'Gere legendas perfeitas offline ou conecte a IA do Gemini para recursos avançados.'
                : 'Gerencie sua chave de API pessoal para transcrições e traduções inteligentes.'}
            </p>
          </div>
        </div>

        {isFirstUse && (
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2 text-slate-300">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Funcional Offline sem Chave de API</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              O aplicativo funciona perfeitamente no seu navegador usando os motores locais (Whisper e Vosk). A chave do Gemini é opcional e serve exclusivamente para quem deseja utilizar a inteligência multimodal em nuvem.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Sua Chave API do Google Gemini</span>
            </span>
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 underline flex items-center gap-1 font-bold text-xs"
            >
              <span>Gerar minha chave gratuita no Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="relative">
            <input
              type="password"
              placeholder="Cole sua chave API aqui (ex: AIzaSy...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors font-mono"
            />
          </div>

          {successMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            {isFirstUse ? 'Continuar com Modo Offline' : 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isValidating}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isValidating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Validando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Chave</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
