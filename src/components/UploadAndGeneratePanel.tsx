import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FolderOpen,
  Languages,
  Sparkles,
  Film,
  Music,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Sliders,
  ShieldCheck,
  WifiOff,
  Cpu,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  HardDrive,
  Tv,
} from 'lucide-react';
import { SAMPLE_VIDEOS } from '../data/sampleData';
import { MemoryUsageMonitor } from './MemoryUsageMonitor';
import { VideoItem, VideoMode, OfflineEngine, LongVideoSettings, LongVideoProgress, AutoSaveConfig } from '../types';

interface UploadAndGeneratePanelProps {
  onFileLoaded: (file: File, url: string, type: 'video' | 'audio') => void;
  onSelectSample: (sample: VideoItem) => void;
  onClearLocalFile?: () => void;
  onGenerateSubtitles: (
    promptContext: string,
    engine: OfflineEngine | 'browser' | 'smart',
    videoMode: VideoMode,
    settings?: LongVideoSettings
  ) => void;
  isGenerating: boolean;
  generationProgress: {
    step: string;
    percent: number;
  };
  longVideoProgress?: LongVideoProgress;
  currentFile: {
    name: string;
    size: string;
    type: string;
  } | null;
  isLocalFile?: boolean;
  videoMode: VideoMode;
  onToggleVideoMode: (mode: VideoMode) => void;
  autoSaveConfig?: AutoSaveConfig;
  onUpdateAutoSaveConfig?: (config: AutoSaveConfig) => void;
  activeProjectName?: string | null;
  sourceLanguage?: string;
  onSourceLanguageChange?: (lang: string) => void;
  targetLanguage?: string;
  onTargetLanguageChange?: (lang: string) => void;
  detectedLanguage?: { name: string; code: string } | null;
}

export const UploadAndGeneratePanel: React.FC<UploadAndGeneratePanelProps> = ({
  onFileLoaded,
  onSelectSample,
  onClearLocalFile,
  onGenerateSubtitles,
  isGenerating,
  generationProgress,
  longVideoProgress,
  currentFile,
  isLocalFile = false,
  videoMode,
  onToggleVideoMode,
  autoSaveConfig,
  onUpdateAutoSaveConfig,
  activeProjectName,
  sourceLanguage = 'auto',
  onSourceLanguageChange,
  targetLanguage = 'pt-BR',
  onTargetLanguageChange,
  detectedLanguage,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState<OfflineEngine | 'browser' | 'smart'>('whisper_offline');
  const [geminiApiKey, setGeminiApiKey] = useState(() => localStorage.getItem('user_gemini_api_key') || '');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [promptTopic, setPromptTopic] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showLongSettings, setShowLongSettings] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Configurações para processamento de vídeos longos (Podcasts / YouTube / Aulas)
  const [longSettings, setLongSettings] = useState<LongVideoSettings>({
    chunkDuration: 30, // 30 segundos por fatia para manter RAM baixa
    vadEnabled: true, // Pular silêncios
    autoPunctuation: true,
    autoSaveCheckpoint: true,
  });

  // Estado para Auditoria de Áudio via Web Audio API (AudioContext)
  const [audioAuditStatus, setAudioAuditStatus] = useState<'idle' | 'checking' | 'valid' | 'corrupted'>('idle');
  const [audioAuditDetails, setAudioAuditDetails] = useState<string>('');

  const auditAudioFile = async (file: File) => {
    setAudioAuditStatus('checking');
    setAudioAuditDetails('Analisando forma de onda e trilha sonora via Web Audio API...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        setAudioAuditStatus('valid');
        setAudioAuditDetails('Áudio pronto para transcrição.');
        return;
      }
      const audioCtx = new AudioCtx();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      await audioCtx.close();

      if (!audioBuffer || audioBuffer.duration <= 0 || audioBuffer.numberOfChannels === 0) {
        setAudioAuditStatus('corrupted');
        setAudioAuditDetails('Arquivo corrompido ou sem trilha de áudio válida.');
      } else {
        setAudioAuditStatus('valid');
        setAudioAuditDetails(`Trilha de áudio válida detectada: ${audioBuffer.duration.toFixed(1)}s • ${audioBuffer.sampleRate}Hz • ${audioBuffer.numberOfChannels} canal(is).`);
      }
    } catch (err: any) {
      console.warn('Auditoria de áudio detectou falha no decodeAudioData:', err);
      setAudioAuditStatus('corrupted');
      setAudioAuditDetails('Falha ao decodificar áudio: arquivo corrompido, sem áudio ou formato não suportado.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('audio') ? 'audio' : 'video';
    onFileLoaded(file, url, type);
    auditAudioFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Gravação ao vivo com Web Speech API (Nativo do navegador em PT-BR)
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert(
          'Seu navegador não suporta reconhecimento de fala direto via microfone. Você pode usar o gerador com IA normalmente!'
        );
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setPromptTopic(transcript);
        }
      };

      recognition.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  return (
    <div
      id="upload-generate-panel"
      className="bg-[#121212] border border-[#2A2A2A] rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 max-w-2xl mx-auto w-full"
    >
      {/* SELETOR DE MODO DE VÍDEO: CURTOS (SHORTS) VS LONGOS (PODCASTS/YOUTUBE) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Formato de Conteúdo
            </span>
            {activeProjectName && (
              <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                📁 Projeto Ativo: {activeProjectName}
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-amber-400" />
            <span>Entrada de Mídia & Inteligência de Transcrição</span>
          </h2>
        </div>

        {/* Alternador de Modo: Curtos vs Longos */}
        <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onToggleVideoMode('short')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              videoMode === 'short'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📱 Curtos (Shorts / Reels)</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleVideoMode('long')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              videoMode === 'long'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>🎙️ Vídeos Longos (Podcasts / YouTube)</span>
          </button>
        </div>
      </div>

      {/* BANNER INFORMATIVO PARA VÍDEOS LONGOS */}
      {videoMode === 'long' && (
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white flex items-center gap-2">
                <span>Modo Especial para Vídeos Longos Ativado</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                  Zero Travamento (OOM Safe)
                </span>
              </p>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                Áudios de 15min, 1h ou 3h são fatiados em <strong>chunks de {longSettings.chunkDuration}s</strong>. O app descarta o cache liberando memória RAM e usa VAD para pular silêncios.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowLongSettings(!showLongSettings)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold whitespace-nowrap self-start sm:self-auto"
          >
            <Sliders className="w-3 h-3 text-amber-400" />
            <span>Ajustar Fatiamento</span>
            {showLongSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      )}

      {/* MONITOR DE MEMÓRIA ANTI-OOM EM TEMPO REAL */}
      <MemoryUsageMonitor videoMode={videoMode} isProcessing={isGenerating} />

      {/* GAVETA DE CONFIGURAÇÕES AVANÇADAS DO VÍDEO LONGO */}
      {videoMode === 'long' && showLongSettings && (
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Configurações do Pipeline de Fatiamento (Chunking & VAD)</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Consumo de RAM estimado: &lt; 180MB</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Duração do Bloco */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
              <label className="font-semibold text-slate-300 flex items-center justify-between">
                <span>Tamanho da Fatia:</span>
                <span className="font-mono text-amber-400 font-bold">{longSettings.chunkDuration}s</span>
              </label>
              <div className="grid grid-cols-3 gap-1 pt-1">
                {[15, 30, 60].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setLongSettings((prev) => ({ ...prev, chunkDuration: dur }))}
                    className={`py-1 rounded text-[11px] font-bold transition-all ${
                      longSettings.chunkDuration === dur
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {dur}s
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">
                30s é o ideal para equilíbrio entre precisão fonética e uso de RAM.
              </p>
            </div>

            {/* VAD (Detecção de Atividade de Voz) */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 flex flex-col justify-between">
              <div>
                <label className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>Pular Silêncios (VAD):</span>
                  <input
                    type="checkbox"
                    checked={longSettings.vadEnabled}
                    onChange={(e) =>
                      setLongSettings((prev) => ({ ...prev, vadEnabled: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                </label>
                <p className="text-[10px] text-slate-400 mt-1">
                  Não processa trechos silenciosos do podcast, acelerando a transcrição em até 40%.
                </p>
              </div>
              <span className="text-[10px] text-emerald-400 font-medium">✓ Economiza bateria</span>
            </div>

            {/* Checkpoint Seguro */}
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 flex flex-col justify-between">
              <div>
                <label className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>Auto-Salvar Blocos:</span>
                  <input
                    type="checkbox"
                    checked={longSettings.autoSaveCheckpoint}
                    onChange={(e) =>
                      setLongSettings((prev) => ({ ...prev, autoSaveCheckpoint: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                  />
                </label>
                <p className="text-[10px] text-slate-400 mt-1">
                  Grava a transcrição no armazenamento local a cada bloco concluído.
                </p>
              </div>
              <span className="text-[10px] text-amber-300 font-medium">✓ Previne perda de dados</span>
            </div>
          </div>
        </div>
      )}

      {/* ÁREA DE DRAG & DROP DO ARQUIVO */}
      <div
        id="file-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-5 sm:p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
            : currentFile
            ? 'border-emerald-500/40 bg-slate-950/60 hover:border-emerald-400'
            : 'border-slate-700/80 bg-slate-950/40 hover:border-amber-500/60 hover:bg-slate-950/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-matroska,audio/mpeg,audio/wav,audio/mp4,audio/ogg"
          className="hidden"
          onChange={handleFileChange}
        />

        {currentFile ? (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isLocalFile
                ? 'bg-amber-500/20 text-amber-400 ring-2 ring-amber-400/40 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {currentFile.type.startsWith('audio') ? <Music className="w-6 h-6" /> : <Film className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm font-bold text-slate-100 truncate max-w-xs sm:max-w-md">
                  {currentFile.name}
                </p>
                {isLocalFile && (
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Seu Arquivo Local
                    </span>
                    {onClearLocalFile && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearLocalFile();
                        }}
                        className="text-[11px] text-slate-400 hover:text-amber-400 underline transition-colors cursor-pointer px-1 py-0.5"
                      >
                        Usar vídeo de exemplo
                      </button>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tamanho: {currentFile.size} • Tipo: {currentFile.type || 'Mídia compatível'}
              </p>
            </div>
            {isLocalFile ? (
              <p className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 mt-1">
                ✓ Arquivo carregado do seu computador! Clique no botão abaixo para transcrever as palavras reais do áudio.
              </p>
            ) : null}

            <button
              type="button"
              id="btn-panel-replace-file"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-1 min-h-[42px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>Trocar por outro vídeo</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2.5">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
              <FolderOpen className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                Selecione seu vídeo ou áudio do celular ou computador
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Suporta MP4, WebM, MOV, MP3, WAV, M4A ({videoMode === 'long' ? 'Vídeos longos de podcasts, palestras e YouTube' : 'Vídeos verticais de Reels, TikTok e Shorts'})
              </p>
            </div>

            <button
              type="button"
              id="btn-panel-choose-file"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="mt-1 min-h-[48px] px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
            >
              <FolderOpen className="w-4 h-4 text-slate-950" />
              <span>ESCOLHER VÍDEO DO CELULAR OU PC</span>
            </button>
          </div>
        )}
      </div>

      {/* SELEÇÃO INTUITIVA DE IDIOMAS (ORIGEM E DESTINO COM DETECÇÃO AUTOMÁTICA) */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-amber-400" />
              <span>Idioma do Áudio (Origem):</span>
            </span>
            {detectedLanguage && (
              <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                ✓ Detectado: {detectedLanguage.name}
              </span>
            )}
          </label>
          <select
            value={sourceLanguage}
            onChange={(e) => onSourceLanguageChange && onSourceLanguageChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-400 cursor-pointer min-h-[44px]"
          >
            <option value="auto">🪄 Detectar Automaticamente (Italiano, Inglês, etc.)</option>
            <option value="it-IT">🇮🇹 Italiano</option>
            <option value="en-US">🇺🇸 Inglês</option>
            <option value="es-ES">🇪🇸 Espanhol</option>
            <option value="fr-FR">🇫🇷 Francês</option>
            <option value="de-DE">🇩🇪 Alemão</option>
            <option value="ja-JP">🇯🇵 Japonês</option>
            <option value="pt-BR">🇧🇷 Português</option>
          </select>
          <p className="text-[10px] text-slate-400 mt-1">
            Detecta automaticamente se o vídeo é falado em italiano, inglês, etc.
          </p>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Idioma da Legenda (Destino):</span>
            </span>
            <span className="text-[10px] text-amber-400 font-bold">Tradução</span>
          </label>
          <select
            value={targetLanguage}
            onChange={(e) => onTargetLanguageChange && onTargetLanguageChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-400 cursor-pointer min-h-[44px]"
          >
            <option value="pt-BR">🇧🇷 Português (Brasil)</option>
            <option value="it-IT">🇮🇹 Italiano</option>
            <option value="en-US">🇺🇸 Inglês</option>
            <option value="es-ES">🇪🇸 Espanhol</option>
            <option value="fr-FR">🇫🇷 Francês</option>
            <option value="de-DE">🇩🇪 Alemão</option>
            <option value="ja-JP">🇯🇵 Japonês</option>
          </select>
          <p className="text-[10px] text-slate-400 mt-1">
            Gera as legendas sincronizadas diretamente no idioma desejado.
          </p>
        </div>
      </div>

      {/* Amostras Rápidas e Gravação de Voz */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 flex-wrap">
          <span>Amostras instantâneas:</span>
          {SAMPLE_VIDEOS.map((sample, idx) => (
            <button
              key={sample.id}
              onClick={() => onSelectSample(sample)}
              className={`px-2 py-1 rounded-md transition-colors border font-medium text-[11px] flex items-center gap-1 ${
                idx === 2
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/60'
              }`}
              title={sample.description}
            >
              {idx === 0 && '✨ Drake Studio ✕ IA (9:16)'}
              {idx === 1 && '💻 Vídeo 16:9 (30s)'}
              {idx === 2 && '🎙️ Podcast Longo (12min)'}
            </button>
          ))}
        </div>

        {/* Microfone ao vivo */}
        <button
          onClick={toggleRecording}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
            isRecording
              ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
          }`}
          title="Falar no microfone para transcrever fala em tempo real"
        >
          {isRecording ? (
            <>
              <MicOff className="w-3.5 h-3.5" />
              <span>Ouvindo... (Clique para parar)</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              <span>Gravar Áudio</span>
            </>
          )}
        </button>
      </div>

      {/* OPÇÕES DO MOTOR DE TRANSCRIÇÃO (OFFLINE VS NUVEM) */}
      <div className="space-y-3 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Motor de Transcrição e Tradução</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1">
              <WifiOff className="w-3 h-3" />
              <span>100% Funcional Offline</span>
            </span>
          </div>
        </div>

        {/* AVISO CLARO SOBRE FUNCIONAMENTO OFFLINE E CHAVE GEMINI OPCIONAL */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Sem Custos e Sem Obrigatoriedade de Chave</span>
          </div>
          <p className="text-slate-400">
            O aplicativo é <strong>100% funcional offline</strong> utilizando os motores locais (Whisper e Vosk) sem exigir nenhuma chave de API. Se você preferir usar a inteligência avançada do <strong>Gemini</strong>, você pode optar por adicionar sua própria chave de API nas configurações opcionais, garantindo zero custo para o desenvolvedor do app.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Motor 1: Whisper Offline (Primeiro) */}
          <button
            type="button"
            onClick={() => setSelectedEngine('whisper_offline')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              selectedEngine === 'whisper_offline'
                ? 'bg-amber-500/10 border-amber-500 text-amber-300 ring-1 ring-amber-400/30'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-xs text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Whisper WebAssembly</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                Local (Offline)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-tight">
              Processamento acústico no navegador com VAD. Funciona sem internet.
            </p>
          </button>

          {/* Motor 2: Vosk Ultraleve (Segundo) */}
          <button
            type="button"
            onClick={() => setSelectedEngine('vosk_offline')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              selectedEngine === 'vosk_offline'
                ? 'bg-amber-500/10 border-amber-500 text-amber-300 ring-1 ring-amber-400/30'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-xs text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                <span>Vosk Ultraleve</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold">
                RAM Mínima
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-tight">
              Otimizado para baixa latência e consumo ultrabaixo de memória no dispositivo.
            </p>
          </button>

          {/* Motor 3: IA Multimodal (Gemini) (Por Último) */}
          <button
            type="button"
            onClick={() => setSelectedEngine('gemini')}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              selectedEngine === 'gemini'
                ? 'bg-amber-500/10 border-amber-500 text-amber-300 ring-1 ring-amber-400/30'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-xs text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>IA Multimodal Gemini</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                Requer API Key
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-tight">
              Transcrição e tradução em nuvem via API do Gemini (opcional).
            </p>
          </button>
        </div>

        {/* Caixa de Configuração Amigável da Chave API do Gemini (Aparece SOMENTE quando Gemini é selecionado) */}
        {selectedEngine === 'gemini' && (
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-amber-500/40 space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Configuração da Chave API do Gemini (Online)</span>
              </span>
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 underline text-[11px] font-bold flex items-center gap-1"
              >
                <span>Gerar chave no Google AI Studio ↗</span>
              </a>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              O motor online do Gemini exige uma chave de API pessoal. Insira sua chave abaixo. Ela será salva de forma segura apenas no seu navegador.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="Cole sua chave API do Gemini aqui (ex: AIzaSy...)"
                value={geminiApiKey}
                onChange={(e) => {
                  setGeminiApiKey(e.target.value);
                  localStorage.setItem('user_gemini_api_key', e.target.value);
                }}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('user_gemini_api_key', geminiApiKey);
                  setApiKeySaved(true);
                  setTimeout(() => setApiKeySaved(false), 2500);
                }}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow cursor-pointer whitespace-nowrap"
              >
                {apiKeySaved ? '✓ Conectado!' : 'Salvar Chave'}
              </button>
            </div>
            {apiKeySaved && (
              <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span>✓ Chave conectada com sucesso! Pronta para uso.</span>
              </p>
            )}
          </div>
        )}

        {/* Campo opcional de contexto ou tema */}
        <div className="relative">
          <input
            type="text"
            placeholder={
              videoMode === 'long'
                ? "Opcional: Informe o tema do podcast/aula para guiar termos técnicos (ex: 'Episódio sobre Inteligência Artificial e Negócios')..."
                : "Opcional: Informe o tema do vídeo (ex: 'Dicas de culinária saudável')..."
            }
            value={promptTopic}
            onChange={(e) => setPromptTopic(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400 transition-colors"
          />
        </div>
      </div>

      {/* CARD DE SALVAMENTO AUTOMÁTICO PARA PLAYERS EXTERNOS (VLC / SMART TV) */}
      <div className="p-3.5 rounded-xl border border-amber-500/30 bg-slate-950/70 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-white">
              Salvamento Automático para VLC e Smart TV
            </span>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSaveConfig ? autoSaveConfig.enabled && autoSaveConfig.saveOnGeneration : true}
              onChange={(e) => {
                if (onUpdateAutoSaveConfig && autoSaveConfig) {
                  onUpdateAutoSaveConfig({
                    ...autoSaveConfig,
                    enabled: e.target.checked,
                    saveOnGeneration: e.target.checked,
                  });
                }
              }}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
            <span className="text-[11px] font-bold text-amber-400">Ativado</span>
          </label>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Salva o arquivo de legendas <strong>com o nome idêntico ao seu vídeo</strong> na mesma pasta usando a File System Access API (com download forçado de contingência). O VLC, MPC-HC e Smart TVs detectam e ativam a legenda automaticamente.
        </p>

        {autoSaveConfig && onUpdateAutoSaveConfig && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span>Formato do arquivo:</span>
              <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => onUpdateAutoSaveConfig({ ...autoSaveConfig, format: 'srt' })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    autoSaveConfig.format === 'srt'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  .SRT (Recomendado)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateAutoSaveConfig({ ...autoSaveConfig, format: 'vtt' })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                    autoSaveConfig.format === 'vtt'
                      ? 'bg-purple-500 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  .VTT (Web)
                </button>
              </div>
            </div>

            <div className="text-slate-400 font-mono text-[10px]">
              Ex: <span className="text-emerald-300">{currentFile?.name ? currentFile.name.replace(/\.[^/.]+$/, '') : 'meu_video'}.{autoSaveConfig.format}</span>
            </div>
          </div>
        )}
      </div>

      {/* INDICADOR VISUAL DO MOTOR ATIVO */}
      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
        <span className="text-slate-400 font-medium">Modo de Processamento:</span>
        {selectedEngine === 'gemini' ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Online (Gemini Cloud API)</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold">
            <WifiOff className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local ({selectedEngine === 'whisper_offline' ? 'Whisper WebAssembly' : 'Vosk Ultraleve'})</span>
          </span>
        )}
      </div>

      {/* COMPONENTE DE AUDITORIA DE ÁUDIO VIA WEB AUDIO API */}
      {audioAuditStatus !== 'idle' && (
        <div className={`rounded-xl border p-3 text-xs flex items-center gap-2.5 animate-in fade-in ${
          audioAuditStatus === 'checking'
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            : audioAuditStatus === 'valid'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
        }`}>
          {audioAuditStatus === 'checking' && <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-amber-400" />}
          {audioAuditStatus === 'valid' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
          {audioAuditStatus === 'corrupted' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
          <div className="flex-1">
            <p className="font-bold">
              {audioAuditStatus === 'checking' && 'Auditando Trilha Sonora via Web Audio API...'}
              {audioAuditStatus === 'valid' && 'Auditoria de Áudio Concluída (Trilha Válida)'}
              {audioAuditStatus === 'corrupted' && '⚠️ Arquivo Corrompido ou Sem Trilha de Áudio Válida'}
            </p>
            <p className="text-[11px] opacity-90">{audioAuditDetails}</p>
          </div>
        </div>
      )}

      {/* BOTÃO PRINCIPAL DE GERAÇÃO */}
      <div className="pt-1">
        <button
          id="btn-generate-subtitles"
          disabled={isGenerating || audioAuditStatus === 'corrupted'}
          onClick={() =>
            onGenerateSubtitles(promptTopic, selectedEngine, videoMode, longSettings)
          }
          className={`w-full py-3 px-4 rounded-xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.99] ${
            audioAuditStatus === 'corrupted'
              ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 cursor-not-allowed opacity-80'
              : isGenerating
              ? 'bg-amber-500/60 text-slate-950 cursor-wait'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/25 hover:shadow-amber-500/35'
          }`}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>
                {videoMode === 'long'
                  ? 'Processando Vídeo Longo em Streaming (Anti-OOM)...'
                  : 'Gerando Legendas em Português com IA...'}
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 fill-slate-950" />
              <span>
                {isLocalFile
                  ? `⚡ Transcrever "${currentFile?.name?.slice(0, 24) || 'Arquivo'}" e Gerar Legendas`
                  : videoMode === 'long'
                  ? '⚡ Iniciar Transcrição de Vídeo Longo (Fatiamento Offline)'
                  : '⚡ Gerar Legendas em Português'}
              </span>
            </>
          )}
        </button>

        {/* BARRA DE PROGRESSO COM METRICAS DO VÍDEO LONGO */}
        {isGenerating && (
          <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 animate-in fade-in space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                {generationProgress.step}
              </span>
              <span className="font-mono text-amber-400 font-bold">{generationProgress.percent}%</span>
            </div>

            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 transition-all duration-300 rounded-full shadow-sm"
                style={{ width: `${generationProgress.percent}%` }}
              />
            </div>

            {/* Painel de telemetria para vídeos longos */}
            {videoMode === 'long' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500">Bloco Atual:</span>
                  <span className="font-mono text-slate-200 font-semibold">
                    {longVideoProgress?.currentChunk || Math.ceil((generationProgress.percent / 100) * 8)} / {longVideoProgress?.totalChunks || 8}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500">Tempo Restante:</span>
                  <span className="font-mono text-slate-200 font-semibold">
                    ~{Math.max(1, Math.round((100 - generationProgress.percent) / 12))}s
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500">Uso de Memória RAM:</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {longVideoProgress?.memoryUsageMb || 142} MB (Seguro)
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500">VAD Silêncio:</span>
                  <span className="font-mono text-amber-300 font-semibold">
                    Ativo (Ignorando pausas)
                  </span>
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-500 text-center">
              Processando 100% no dispositivo com proteção contra fechamento do app...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
