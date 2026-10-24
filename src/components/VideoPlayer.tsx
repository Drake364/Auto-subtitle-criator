import React, { useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize2,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { SubtitleCue, SubtitleStyle } from '../types';
import { formatTimeSeconds } from '../utils/subtitleUtils';

interface VideoPlayerProps {
  videoUrl: string;
  videoTitle: string;
  subtitles: SubtitleCue[];
  style: SubtitleStyle;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  aspectRatio: '9:16' | '16:9';
  setAspectRatio: (ar: '9:16' | '16:9') => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayPauseToggle: () => void;
  onSeek: (time: number) => void;
  showWatermark?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  subtitles,
  style,
  currentTime,
  duration,
  isPlaying,
  aspectRatio,
  setAspectRatio,
  onTimeUpdate,
  onDurationChange,
  onPlayPauseToggle,
  onSeek,
  showWatermark = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = React.useState(false);
  const [playbackRate, setPlaybackRate] = React.useState(1);

  // Sincroniza estado de play/pause do pai com o elemento HTML5
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else if (!isPlaying && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  // Busca a legenda ativa para o tempo atual
  const activeCue = subtitles.find(
    (cue) => currentTime >= cue.startTime && currentTime <= cue.endTime
  );

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      onDurationChange(videoRef.current.duration || 0);
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      const nextTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = nextTime;
      onSeek(nextTime);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changeSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  // Renderiza as palavras com destaque karaoke quando ativado
  const renderSubtitleContent = (cue: SubtitleCue) => {
    if (style.animation === 'karaoke' && cue.words && cue.words.length > 0) {
      return (
        <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          {cue.words.map((w, idx) => {
            const isWordActive = currentTime >= w.start && currentTime <= w.end;
            return (
              <span
                key={idx}
                className="transition-all duration-100 transform"
                style={{
                  color: isWordActive ? style.highlightColor : style.textColor,
                  transform: isWordActive ? 'scale(1.1)' : 'scale(1)',
                  textShadow: isWordActive
                    ? `0 0 14px ${style.highlightColor}99`
                    : undefined,
                }}
              >
                {w.word}
              </span>
            );
          })}
        </span>
      );
    }

    // Texto simples ou animação pop
    return <span>{cue.text}</span>;
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Aspect Ratio Selector & Format Bar */}
      <div className="flex w-full items-center justify-between px-2 py-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-300">Proporção:</span>
          <button
            id="aspect-ratio-9-16"
            onClick={() => setAspectRatio('9:16')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition-colors ${
              aspectRatio === '9:16'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>9:16 (Reels/TikTok)</span>
          </button>

          <button
            id="aspect-ratio-16-9"
            onClick={() => setAspectRatio('16:9')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition-colors ${
              aspectRatio === '16:9'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>16:9 (YouTube)</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
            Preview em tempo real
          </span>
        </div>
      </div>

      {/* Main Video Viewport Container */}
      <div
        className={`relative overflow-hidden rounded-2xl bg-black shadow-2xl border border-slate-800 flex items-center justify-center transition-all duration-300 ${
          aspectRatio === '9:16'
            ? 'w-full max-w-[340px] aspect-[9/16] min-h-[480px] max-h-[620px]'
            : 'w-full aspect-[16/9] max-h-[460px]'
        }`}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          className="h-full w-full object-contain cursor-pointer"
          onClick={onPlayPauseToggle}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => onPlayPauseToggle()}
        />

        {/* Dynamic Subtitle Overlay Box */}
        {activeCue && (
          <div
            className="absolute left-0 right-0 px-4 flex justify-center pointer-events-none transition-all duration-150"
            style={{
              top: `${style.yOffsetPercent}%`,
              transform: 'translateY(-50%)',
            }}
          >
            <div
              className={`max-w-[92%] px-3.5 py-1.5 rounded-lg text-center font-bold transition-all leading-tight ${
                style.animation === 'pop' ? 'animate-bounce' : ''
              }`}
              style={{
                fontFamily: style.fontFamily,
                fontSize: `${aspectRatio === '9:16' ? style.fontSize * 0.9 : style.fontSize}px`,
                color: style.textColor,
                backgroundColor: style.backgroundColor,
                textTransform: style.textTransform,
                fontWeight: style.isBold ? 800 : 600,
                WebkitTextStroke:
                  style.strokeWidth > 0
                    ? `${style.strokeWidth}px ${style.strokeColor}`
                    : undefined,
                textShadow:
                  style.strokeWidth > 0
                    ? `0 2px 4px rgba(0,0,0,0.8)`
                    : '0 2px 8px rgba(0,0,0,0.9)',
              }}
            >
              {renderSubtitleContent(activeCue)}
            </div>
          </div>
        )}

        {/* Free-tier Watermark Simulation */}
        {showWatermark && (
          <div className="absolute top-3 right-3 rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-amber-300/80 backdrop-blur-sm pointer-events-none border border-amber-500/20">
            ⚡ LegendaFácil AI
          </div>
        )}

        {/* Center Big Play Button (when paused) */}
        {!isPlaying && (
          <button
            onClick={onPlayPauseToggle}
            className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/90 text-slate-950 shadow-lg shadow-amber-500/30 transition-transform hover:scale-110 active:scale-95"
            aria-label="Reproduzir vídeo"
          >
            <Play className="h-7 w-7 fill-slate-950 ml-1" />
          </button>
        )}
      </div>

      {/* Video Control Bar */}
      <div className="mt-3 w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900/90 p-3 shadow-lg">
        {/* Scrub Bar */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-mono text-slate-400 w-12 text-right">
            {formatTimeSeconds(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.05}
            value={currentTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (videoRef.current) {
                videoRef.current.currentTime = val;
              }
              onSeek(val);
            }}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-amber-500"
          />
          <span className="text-[11px] font-mono text-slate-400 w-12">
            {formatTimeSeconds(duration)}
          </span>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              id="btn-player-playpause"
              onClick={onPlayPauseToggle}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-slate-950 transition-colors hover:bg-amber-400"
              title={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-slate-950" />
              ) : (
                <Play className="h-4 w-4 fill-slate-950 ml-0.5" />
              )}
            </button>

            <button
              id="btn-player-skip-back"
              onClick={() => handleSkip(-3)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
              title="Voltar 3 segundos"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              id="btn-player-skip-fwd"
              onClick={() => handleSkip(3)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
              title="Avançar 3 segundos"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            <button
              id="btn-player-mute"
              onClick={toggleMute}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
              title={isMuted ? 'Ativar Som' : 'Silenciar'}
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-playback-rate"
              onClick={changeSpeed}
              className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white"
              title="Alterar velocidade"
            >
              {playbackRate}x
            </button>

            <button
              id="btn-fullscreen"
              onClick={() => {
                if (videoRef.current?.requestFullscreen) {
                  videoRef.current.requestFullscreen();
                }
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              title="Tela Cheia"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
