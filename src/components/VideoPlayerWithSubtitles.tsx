import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize,
  Clock,
  Sparkles,
  Film,
  Languages,
  Eye,
  EyeOff,
  FileText,
  Palette,
  HardDrive,
  Check,
} from 'lucide-react';
import { SubtitleCue, SubtitleStyle, SubtitleDisplayMode } from '../types';
import { formatFriendlyTime, saveSubtitleMatchingVideoName } from '../utils/subtitleUtils';
import { AiCollaboratorDemoVideo } from './AiCollaboratorDemoVideo';

interface VideoPlayerProps {
  videoUrl: string | null;
  videoTitle?: string;
  subtitles: SubtitleCue[];
  style: SubtitleStyle;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onDurationChange?: (duration: number) => void;
  activeCueId: string | null;
  displayMode?: SubtitleDisplayMode;
  onToggleDisplayMode?: (mode: SubtitleDisplayMode) => void;
  isLocalFile?: boolean;
  // Controles e ações avançadas
  isPlaying?: boolean;
  onPlayStateChange?: (playing: boolean) => void;
  onTogglePlay?: () => void;
  showSubtitlesOverlay?: boolean;
  onToggleShowSubtitlesOverlay?: (show: boolean) => void;
  onNavigateToSubtitles?: () => void;
  onOpenStyles?: () => void;
  onUpdateStyle?: (style: SubtitleStyle) => void;
  onOpenExportModal?: () => void;
  aspectRatio?: '9:16' | '16:9';
  onToggleAspectRatio?: (aspect: '9:16' | '16:9') => void;
  externalVideoRef?: React.RefObject<HTMLVideoElement | null>;
}

export const VideoPlayerWithSubtitles: React.FC<VideoPlayerProps> = ({
  videoUrl,
  videoTitle,
  subtitles,
  style,
  currentTime,
  onTimeUpdate,
  onDurationChange,
  activeCueId,
  displayMode = 'bilingual',
  onToggleDisplayMode,
  isLocalFile = false,
  isPlaying: propIsPlaying,
  onPlayStateChange,
  onTogglePlay,
  showSubtitlesOverlay,
  onToggleShowSubtitlesOverlay,
  onNavigateToSubtitles,
  onOpenStyles,
  onUpdateStyle,
  onOpenExportModal,
  aspectRatio: propAspectRatio,
  onToggleAspectRatio,
  externalVideoRef,
}) => {
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [internalIsPlaying, setInternalIsPlaying] = useState(false);
  const isPlaying = propIsPlaying !== undefined ? propIsPlaying : internalIsPlaying;

  const [duration, setDuration] = useState(15);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [internalAspectRatio, setInternalAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [quickSaveFeedback, setQuickSaveFeedback] = useState<string | null>(null);
  const [quickSaveFormat, setQuickSaveFormat] = useState<'srt' | 'vtt'>('srt');
  const [showFormatPicker, setShowFormatPicker] = useState(false);

  // Salvamento rápido de .SRT ou .VTT com nome idêntico para VLC / TV
  const handleQuickSave = async (formatOverride?: 'srt' | 'vtt') => {
    const fmt = formatOverride || quickSaveFormat;
    try {
      const mode = displayMode === 'original' ? 'original' : displayMode === 'bilingual' ? 'bilingual' : 'translated';
      const res = await saveSubtitleMatchingVideoName(subtitles, videoTitle, mode, fmt);
      setQuickSaveFeedback(res.message);
      setTimeout(() => setQuickSaveFeedback(null), 4000);
    } catch (e) {
      setQuickSaveFeedback('Erro ao salvar legenda.');
      setTimeout(() => setQuickSaveFeedback(null), 3000);
    }
  };
  const aspectRatio = propAspectRatio || internalAspectRatio;

  const isDemoMode = !isLocalFile || videoUrl === 'ai-collaborator-demo';

  // Avanço automático contínuo de tempo quando em modo de demonstração do Colaborador de IA
  useEffect(() => {
    if (!isDemoMode || !isPlaying) return;

    const interval = setInterval(() => {
      const nextTime = currentTime + 0.05;
      if (nextTime >= (duration || 15)) {
        onTimeUpdate(0);
      } else {
        onTimeUpdate(Number(nextTime.toFixed(2)));
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isDemoMode, isPlaying, currentTime, duration, onTimeUpdate]);

  const [internalOverlayVisible, setInternalOverlayVisible] = useState(true);
  const isOverlayVisible = showSubtitlesOverlay !== undefined ? showSubtitlesOverlay : internalOverlayVisible;

  const toggleOverlay = () => {
    if (onToggleShowSubtitlesOverlay) {
      onToggleShowSubtitlesOverlay(!isOverlayVisible);
    } else {
      setInternalOverlayVisible(!internalOverlayVisible);
    }
  };

  const handleSetAspectRatio = (newRatio: '9:16' | '16:9') => {
    if (onToggleAspectRatio) {
      onToggleAspectRatio(newRatio);
    } else {
      setInternalAspectRatio(newRatio);
    }
  };

  // Encontra a legenda ativa no segundo atual
  const currentCue = useMemo(() => {
    return subtitles.find(
      (cue) => currentTime >= cue.startTime && currentTime <= cue.endTime
    );
  }, [subtitles, currentTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
        if (onDurationChange) onDurationChange(video.duration);
        // Detecta proporção inicial
        if (video.videoWidth && video.videoHeight) {
          if (video.videoHeight > video.videoWidth) {
            handleSetAspectRatio('9:16');
          } else {
            handleSetAspectRatio('16:9');
          }
        }
      }
    };

    const handleTimeUpdate = () => {
      onTimeUpdate(video.currentTime);
    };

    const handlePlay = () => {
      setInternalIsPlaying(true);
      if (onPlayStateChange) onPlayStateChange(true);
    };

    const handlePause = () => {
      setInternalIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    };

    const handleEnded = () => {
      setInternalIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoUrl, onTimeUpdate, onDurationChange, onPlayStateChange]);

  const togglePlay = () => {
    if (onTogglePlay) {
      onTogglePlay();
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video
        .play()
        .then(() => {
          setInternalIsPlaying(true);
          if (onPlayStateChange) onPlayStateChange(true);
        })
        .catch(() => {});
    } else {
      video.pause();
      setInternalIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    onTimeUpdate(time);
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current
        .play()
        .then(() => {
          setInternalIsPlaying(true);
          if (onPlayStateChange) onPlayStateChange(true);
        })
        .catch(() => {});
    }
  };

  const handleSpeedChange = () => {
    const speeds = [1, 1.25, 1.5, 2, 0.75];
    const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Renderizador unificado de palavras com efeitos (karaokê, destaques, cores e bordas) para original e traduzido
  const renderSubtitleText = () => {
    if (!currentCue) return null;

    const originalText = currentCue.text;
    const translatedText = currentCue.translation || currentCue.text;

    const renderTextWithEffects = (text: string, words?: Array<{ word: string; start: number; end: number }>) => {
      if (words && words.length > 0 && style.animation === 'karaoke') {
        return (
          <span className="inline-flex flex-wrap justify-center items-center gap-x-1.5 gap-y-0.5">
            {words.map((w, index) => {
              const isWordActive = currentTime >= w.start && currentTime <= w.end;
              const hasPassed = currentTime > w.end;

              return (
                <span
                  key={index}
                  className={`transition-all duration-150 inline-block ${
                    isWordActive ? 'scale-110 -translate-y-0.5 font-black' : 'scale-100'
                  }`}
                  style={{
                    color: isWordActive ? style.highlightColor : hasPassed ? style.textColor : `${style.textColor}dd`,
                    textShadow:
                      style.strokeWidth > 0
                        ? `0 0 ${style.strokeWidth * 2}px ${style.strokeColor}, -1px -1px 0 ${style.strokeColor}, 1px -1px 0 ${style.strokeColor}, -1px 1px 0 ${style.strokeColor}, 1px 1px 0 ${style.strokeColor}`
                        : 'none',
                  }}
                >
                  {w.word}
                </span>
              );
            })}
          </span>
        );
      }

      return (
        <span
          style={{
            color: style.textColor,
            textShadow:
              style.strokeWidth > 0
                ? `0 0 ${style.strokeWidth * 2}px ${style.strokeColor}, -2px -2px 0 ${style.strokeColor}, 2px -2px 0 ${style.strokeColor}, -2px 2px 0 ${style.strokeColor}, 2px 2px 0 ${style.strokeColor}`
                : '0 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          {text}
        </span>
      );
    };

    // MODO BILÍNGUE (EN + PT)
    if (displayMode === 'bilingual') {
      return (
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          {/* Linha Superior: Áudio Original com Efeitos */}
          <div className="text-[0.95em] tracking-wide font-semibold opacity-95">
            {renderTextWithEffects(originalText, currentCue.words)}
          </div>

          {/* Linha Inferior: Tradução com os mesmos Efeitos e Estilos */}
          <div className="text-[0.88em] tracking-wide font-semibold opacity-95">
            {renderTextWithEffects(translatedText, currentCue.translationWords || currentCue.words)}
          </div>
        </div>
      );
    }

    // MODO APENAS ORIGINAL (EN)
    if (displayMode === 'original') {
      return renderTextWithEffects(originalText, currentCue.words);
    }

    // MODO TRADUZIDO (PT-BR) COM OS MESMOS EFEITOS
    return renderTextWithEffects(translatedText, currentCue.translationWords || currentCue.words);
  };

  return (
    <div
      ref={containerRef}
      id="video-player-container"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center justify-between relative z-0 w-full"
    >
      {/* Top Bar do Player */}
      <div className="w-full px-3 sm:px-4 py-2 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
        <div className="flex items-center gap-2 truncate min-w-0">
          {isDemoMode ? (
            <img
              src="/drake_avatar.jpg"
              alt="Drake Studio"
              className="w-5 h-5 rounded-full object-cover border border-pink-500/80 shadow shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          )}
          <span className="font-semibold text-slate-200 truncate max-w-[140px] sm:max-w-[220px]">
            {videoTitle || 'Pré-visualização do Vídeo'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Seletor de Idioma das Legendas no Player */}
          {onToggleDisplayMode && (
            <div className="bg-slate-800/90 rounded-lg p-0.5 flex items-center text-[10px] font-bold border border-slate-700/60">
              <button
                type="button"
                onClick={() => onToggleDisplayMode('translated')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  displayMode === 'translated'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Exibir legenda traduzida em Português"
              >
                🇧🇷 PT
              </button>
              <button
                type="button"
                onClick={() => onToggleDisplayMode('original')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  displayMode === 'original'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Exibir legenda original em Inglês"
              >
                🇺🇸 EN
              </button>
              <button
                type="button"
                onClick={() => onToggleDisplayMode('bilingual')}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  displayMode === 'bilingual'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Exibir legenda bilíngue (EN + PT simultâneo)"
              >
                🌐 EN+PT
              </button>
            </div>
          )}

          {/* Alternar Legendas no Vídeo (Overlay ON/OFF) */}
          <button
            type="button"
            onClick={toggleOverlay}
            className={`px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold transition-colors cursor-pointer ${
              isOverlayVisible
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title={isOverlayVisible ? 'Ocultar legendas sobre o vídeo (modo limpo)' : 'Exibir legendas sobre o vídeo'}
          >
            {isOverlayVisible ? <Eye className="w-3 h-3 text-amber-400" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
            <span className="hidden sm:inline">{isOverlayVisible ? 'Legenda no Vídeo: ON' : 'Legenda no Vídeo: OFF'}</span>
          </button>

          {/* Alternar formato 9:16 / 16:9 */}
          <div className="bg-slate-800 rounded-lg p-0.5 flex items-center text-[10px] font-bold">
            <button
              onClick={() => handleSetAspectRatio('9:16')}
              className={`px-2 py-0.5 rounded ${
                aspectRatio === '9:16' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Formato vertical para TikTok, Reels e Shorts"
            >
              9:16
            </button>
            <button
              onClick={() => handleSetAspectRatio('16:9')}
              className={`px-2 py-0.5 rounded ${
                aspectRatio === '16:9' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Formato horizontal padrão YouTube"
            >
              16:9
            </button>
          </div>

          {/* Ajuste Rápido do Tamanho da Fonte (Permite tamanho ultra-discreto 10px-42px sem cobrir o vídeo) */}
          {onUpdateStyle && (
            <div
              className="bg-slate-800/90 rounded-lg p-0.5 flex items-center text-[10px] font-bold border border-slate-700/60"
              title="Ajuste rápido do tamanho da fonte da legenda"
            >
              <button
                type="button"
                onClick={() => onUpdateStyle({ ...style, fontSize: Math.max(10, style.fontSize - 2) })}
                className="w-5 h-5 rounded hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Diminuir fonte (mínimo 10px para não cobrir o vídeo)"
              >
                -
              </button>
              <span className="px-1 text-amber-400 font-mono min-w-[26px] text-center">
                {style.fontSize}px
              </span>
              <button
                type="button"
                onClick={() => onUpdateStyle({ ...style, fontSize: Math.min(42, style.fontSize + 2) })}
                className="w-5 h-5 rounded hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                title="Aumentar fonte"
              >
                +
              </button>
            </div>
          )}

          {/* Botão para abrir Opções de Estilo das Legendas */}
          {onOpenStyles && (
            <button
              type="button"
              onClick={onOpenStyles}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 font-bold text-[11px] flex items-center gap-1.5 border border-slate-700 hover:border-amber-500/40 shadow-sm transition-all cursor-pointer"
              title="Personalizar estilo, cor, tamanho e fonte das legendas"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Estilo</span>
            </button>
          )}

          {/* Botão de Salvamento Rápido de Legenda para VLC / TV (.SRT ou .VTT) */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => handleQuickSave(quickSaveFormat)}
              className="px-2 py-1 rounded-l-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all cursor-pointer"
              title={`Salvar arquivo .${quickSaveFormat.toUpperCase()} com nome idêntico ao vídeo para detecção automática no VLC e TV`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salvar .{quickSaveFormat.toUpperCase()}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowFormatPicker(!showFormatPicker)}
              className="px-1.5 py-1 rounded-r-lg bg-emerald-700 hover:bg-emerald-600 text-emerald-100 text-[11px] font-bold border-l border-emerald-800 transition-colors cursor-pointer"
              title="Alternar entre .SRT (VLC/Smart TV) e .VTT (Web)"
            >
              ▾
            </button>

            {showFormatPicker && (
              <div className="absolute top-full right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 min-w-[180px] space-y-1 animate-in fade-in">
                <div className="text-[10px] text-slate-400 font-bold px-2 py-0.5">Formato Automático:</div>
                <button
                  type="button"
                  onClick={() => {
                    setQuickSaveFormat('srt');
                    setShowFormatPicker(false);
                    handleQuickSave('srt');
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer ${
                    quickSaveFormat === 'srt' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>Salvar .SRT (VLC / TV)</span>
                  {quickSaveFormat === 'srt' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuickSaveFormat('vtt');
                    setShowFormatPicker(false);
                    handleQuickSave('vtt');
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer ${
                    quickSaveFormat === 'vtt' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>Salvar .VTT (Web / HTML5)</span>
                  {quickSaveFormat === 'vtt' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </button>
              </div>
            )}
          </div>

          {/* Botão para abrir a tela separada de Legendas */}
          {onNavigateToSubtitles && (
            <button
              type="button"
              onClick={onNavigateToSubtitles}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Abrir tela dedicada para ler e editar todas as legendas"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Legendas ({subtitles.length})</span>
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Tela cheia"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Alerta de Feedback de Salvamento Rápido */}
      {quickSaveFeedback && (
        <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-3 py-1.5 text-xs text-emerald-300 font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{quickSaveFeedback}</span>
          </div>
          {onOpenExportModal && (
            <button
              type="button"
              onClick={onOpenExportModal}
              className="text-[11px] underline text-emerald-200 hover:text-white cursor-pointer"
            >
              Opções de exportação
            </button>
          )}
        </div>
      )}

      {/* Área de Vídeo com Aspect Ratio Adaptativo */}
      <div className="relative w-full flex items-center justify-center p-2 sm:p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 min-h-[300px] sm:min-h-[380px] max-h-[540px] overflow-hidden">
        <div
          className={`relative overflow-hidden rounded-xl shadow-2xl bg-black flex items-center justify-center transition-all duration-300 ${
            aspectRatio === '9:16'
              ? 'w-[240px] sm:w-[290px] max-w-full h-[390px] sm:h-[480px]'
              : 'w-full max-w-xl h-[250px] sm:h-[340px]'
          }`}
        >
          {isDemoMode ? (
            <AiCollaboratorDemoVideo
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              aspectRatio={aspectRatio}
              onTogglePlay={togglePlay}
              isMuted={isMuted}
            />
          ) : videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              playsInline
              onClick={togglePlay}
              className="w-full h-full object-cover cursor-pointer"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
              <Film className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-sm font-medium text-slate-400">Nenhum vídeo carregado</p>
              <p className="text-xs text-slate-500 mt-1">Carregue um arquivo ou use um vídeo de demonstração</p>
            </div>
          )}

          {/* OVERLAY DE LEGENDA CUSTOMIZADA AO VIVO (apenas se isOverlayVisible for true) */}
          {currentCue && isOverlayVisible && (
            <div
              className="absolute left-0 right-0 px-4 flex justify-center pointer-events-none transition-all duration-100 z-20"
              style={{
                top: `${style.yOffsetPercent}%`,
                transform: 'translateY(-50%)',
              }}
            >
              <div
                className="max-w-[90%] text-center font-bold tracking-wide transition-transform duration-100 select-none"
                style={{
                  fontFamily: style.fontFamily,
                  fontSize: `${style.fontSize}px`,
                  backgroundColor: style.backgroundColor,
                  padding: style.backgroundColor !== 'transparent' ? '4px 12px' : '0',
                  borderRadius: '8px',
                  textTransform: style.textTransform,
                  lineHeight: '1.2',
                }}
              >
                {renderSubtitleText()}
              </div>
            </div>
          )}

          {/* Botão flutuante de play quando pausado */}
          {!isPlaying && (videoUrl || isDemoMode) && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-amber-500/90 text-slate-950 flex items-center justify-center shadow-xl hover:scale-105 transition-transform backdrop-blur-sm z-10 cursor-pointer"
              title="Reproduzir com som"
            >
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
          )}

          {/* Watermark/Marca d'água discreta de demonstração */}
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/40 backdrop-blur-xs text-[10px] text-slate-400 font-medium pointer-events-none z-10 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            <span>LegendaFácil AI</span>
          </div>
        </div>
      </div>

      {/* Controles de Reprodução e Scrubber */}
      <div className="w-full px-4 py-3 bg-slate-950 border-t border-slate-800 flex flex-col gap-2">
        {/* Barra de Progresso / Timeline scrubber */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.05}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:h-2 transition-all"
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          {/* Botões de controle Play, Restart, Volume */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="btn-player-play-pause"
              onClick={togglePlay}
              className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-transform active:scale-95 shadow-md shadow-amber-500/20"
              title={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              onClick={handleRestart}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Voltar ao início"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Pular -10s e +10s (Ideal para podcasts e vídeos longos) */}
            <button
              onClick={() => {
                const newTime = Math.max(0, currentTime - 10);
                if (videoRef.current) videoRef.current.currentTime = newTime;
                onTimeUpdate(newTime);
              }}
              className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] font-bold transition-colors"
              title="Voltar 10 segundos"
            >
              -10s
            </button>

            <button
              onClick={() => {
                const newTime = Math.min(duration, currentTime + 10);
                if (videoRef.current) videoRef.current.currentTime = newTime;
                onTimeUpdate(newTime);
              }}
              className="px-1.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] font-bold transition-colors"
              title="Avançar 10 segundos"
            >
              +10s
            </button>

            <button
              onClick={toggleMute}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title={isMuted ? 'Desmutar' : 'Mutar'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Tempo atual / Duração */}
            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-400 ml-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span className="text-slate-200 font-semibold">{formatFriendlyTime(currentTime)}</span>
              <span>/</span>
              <span>{formatFriendlyTime(duration)}</span>
            </div>
          </div>

          {/* Velocidade de Reprodução & Estilo ativo */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeedChange}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition-colors"
              title="Velocidade de reprodução"
            >
              {playbackSpeed}x
            </button>
            {onOpenStyles ? (
              <button
                type="button"
                onClick={onOpenStyles}
                className="text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 font-bold border border-slate-700 hover:border-amber-500/40 transition-colors cursor-pointer flex items-center gap-1"
                title="Clique para alterar estilo, tamanho e cor das legendas"
              >
                <Palette className="w-3 h-3 text-amber-400" />
                <span>Preset: {style.preset.toUpperCase()}</span>
              </button>
            ) : (
              <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-amber-300/90 font-medium">
                Preset: {style.preset.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
