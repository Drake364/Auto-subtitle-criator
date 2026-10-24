import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  Copy,
  Check,
  Languages,
  Layers,
  Sparkles,
  FileCode,
  FolderDown,
  ArrowLeft,
  MonitorPlay,
  HardDrive,
  CheckCircle2,
  Tv,
  Film,
  Sliders,
} from 'lucide-react';
import { SubtitleCue, SubtitleStyle } from '../types';
import {
  exportToSrt,
  exportToVtt,
  exportToTxt,
  downloadFile,
  downloadDualSrtFiles,
  saveSubtitleMatchingVideoName,
  getCleanVideoBaseName,
} from '../utils/subtitleUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtitles: SubtitleCue[];
  videoTitle: string;
  videoUrl?: string | null;
  style?: SubtitleStyle;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  subtitles,
  videoTitle,
  videoUrl,
  style,
}) => {
  const [copied, setCopied] = useState(false);
  const [exportMode, setExportMode] = useState<'translated' | 'original' | 'bilingual'>('translated');
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [autoSaveFormat, setAutoSaveFormat] = useState<'srt' | 'vtt'>('srt');
  const [forceDirectDownload, setForceDirectDownload] = useState(false);

  // Burn-in Subtitles states & handler
  const [burnInEnabled, setBurnInEnabled] = useState(!!style?.burnInNative);
  const [burnResolution, setBurnResolution] = useState<'1080p' | '720p' | '4k' | 'original'>('1080p');
  const [burnFormat, setBurnFormat] = useState<'mp4' | 'webm'>('mp4');
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  const handleBurnInExport = async () => {
    setIsRenderingVideo(true);
    setRenderProgress(5);
    showFeedback('Preparando motor de renderização Hardsub (Canvas + MediaRecorder)...');

    try {
      const videoEl = document.createElement('video');
      videoEl.crossOrigin = 'anonymous';
      videoEl.muted = true;
      videoEl.src = videoUrl || '';

      let videoLoaded = true;
      await new Promise((resolve) => {
        videoEl.onloadedmetadata = () => resolve(true);
        videoEl.onerror = () => {
          videoLoaded = false;
          resolve(false);
        };
        setTimeout(() => resolve(false), 2500);
      });

      const videoWidth = videoLoaded && videoEl.videoWidth ? videoEl.videoWidth : 1280;
      const videoHeight = videoLoaded && videoEl.videoHeight ? videoEl.videoHeight : 720;

      let targetW = videoWidth;
      let targetH = videoHeight;
      if (burnResolution === '1080p') {
        targetW = 1920;
        targetH = 1080;
      } else if (burnResolution === '720p') {
        targetW = 1280;
        targetH = 720;
      } else if (burnResolution === '4k') {
        targetW = 3840;
        targetH = 2160;
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Falha ao inicializar o contexto 2D do canvas.');

      const videoStream = canvas.captureStream(30);

      if (videoLoaded) {
        try {
          const audioStream = typeof (videoEl as any).captureStream === 'function' 
            ? (videoEl as any).captureStream() 
            : null;
          if (audioStream && audioStream.getAudioTracks().length > 0) {
            audioStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
              videoStream.addTrack(track);
            });
          }
        } catch {}
      }

      let mimeType = burnFormat === 'webm' ? 'video/webm;codecs=vp9,opus' : 'video/mp4';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = '';

      const mediaRecorder = mimeType ? new MediaRecorder(videoStream, { mimeType, videoBitsPerSecond: 6000000 }) : new MediaRecorder(videoStream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const duration = videoLoaded && videoEl.duration && !isNaN(videoEl.duration) ? videoEl.duration : 15;

      await new Promise<void>((resolveExport, rejectExport) => {
        mediaRecorder.onstop = () => {
          const blobType = burnFormat === 'webm' ? 'video/webm' : 'video/mp4';
          const finalBlob = new Blob(chunks, { type: blobType });
          const url = URL.createObjectURL(finalBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${baseFileName}-burned-${burnResolution}.${burnFormat}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          resolveExport();
        };

        mediaRecorder.onerror = (err) => rejectExport(err);

        mediaRecorder.start();

        if (videoLoaded) {
          videoEl.currentTime = 0;
          videoEl.play().catch(() => {});
        }

        const startTime = performance.now();

        const renderFrame = () => {
          const elapsed = (performance.now() - startTime) / 1000;
          const currentVideoTime = videoLoaded && !videoEl.paused && !videoEl.ended ? videoEl.currentTime : elapsed;

          if (currentVideoTime >= duration || (videoLoaded && videoEl.ended)) {
            mediaRecorder.stop();
            if (videoLoaded) videoEl.pause();
            return;
          }

          const currentProgress = Math.min(99, Math.round((currentVideoTime / duration) * 100));
          setRenderProgress(currentProgress);

          ctx.clearRect(0, 0, targetW, targetH);

          if (videoLoaded && videoEl.readyState >= 2) {
            try {
              ctx.drawImage(videoEl, 0, 0, targetW, targetH);
            } catch {
              drawCanvasFallbackBackground(ctx, targetW, targetH, videoTitle, currentVideoTime, duration);
            }
          } else {
            drawCanvasFallbackBackground(ctx, targetW, targetH, videoTitle, currentVideoTime, duration);
          }

          const nowMs = currentVideoTime * 1000;
          const activeCue = subtitles.find(
            (c) => nowMs >= c.startTime && nowMs <= c.endTime
          );

          if (activeCue) {
            const textToRender =
              exportMode === 'original'
                ? activeCue.text
                : exportMode === 'bilingual'
                ? `${activeCue.text}\n${activeCue.translation || ''}`
                : activeCue.translation || activeCue.text;

            if (textToRender.trim()) {
              ctx.save();
              const fontSizePx = Math.round((style?.fontSize || 24) * (targetH / 720));
              const fontFamily = style?.fontFamily || 'Inter, sans-serif';
              ctx.font = `bold ${fontSizePx}px ${fontFamily}`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';

              const lines = textToRender.split('\n');
              const lineHeight = fontSizePx * 1.3;
              const totalTextH = lines.length * lineHeight;

              let x = targetW / 2;
              let y = targetH - 90;

              if (style?.position === 'top') {
                y = 120 + totalTextH;
              } else if (style?.position === 'center') {
                y = targetH / 2 + totalTextH / 2;
              }

              if (style?.background !== 'none') {
                const paddingX = 26;
                const paddingY = 14;
                let maxLineWidth = 0;
                lines.forEach((line) => {
                  const metrics = ctx.measureText(line);
                  if (metrics.width > maxLineWidth) maxLineWidth = metrics.width;
                });

                ctx.fillStyle =
                  style?.background === 'dark'
                    ? 'rgba(0, 0, 0, 0.78)'
                    : style?.background === 'light'
                    ? 'rgba(255, 255, 255, 0.88)'
                    : 'rgba(0, 0, 0, 0.65)';

                const boxX = x - maxLineWidth / 2 - paddingX;
                const boxY = y - totalTextH - paddingY;
                const boxW = maxLineWidth + paddingX * 2;
                const boxH = totalTextH + paddingY * 2;

                ctx.beginPath();
                ctx.roundRect(boxX, boxY, boxW, boxH, 14);
                ctx.fill();
              }

              lines.forEach((line, index) => {
                const lineY = y - (lines.length - 1 - index) * lineHeight;

                ctx.lineWidth = Math.max(3, fontSizePx / 7);
                ctx.strokeStyle = style?.outlineColor || '#000000';
                ctx.strokeText(line, x, lineY);

                ctx.fillStyle = style?.textColor || '#ffffff';
                ctx.fillText(line, x, lineY);
              });

              ctx.restore();
            }
          }

          requestAnimationFrame(renderFrame);
        };

        requestAnimationFrame(renderFrame);
      });

      setRenderProgress(100);
      setIsRenderingVideo(false);
      showFeedback(`Vídeo com legendas embutidas (${burnResolution.toUpperCase()}, .${burnFormat}) gerado com sucesso!`);
    } catch (err: any) {
      console.error('Erro na renderização de hardsub:', err);
      setIsRenderingVideo(false);
      showFeedback('Erro ao renderizar vídeo com legendas. Verifique o console.');
    }
  };

  if (!isOpen) return null;

  const cleanBaseName = getCleanVideoBaseName(videoTitle);
  const targetFileName = `${cleanBaseName}.${autoSaveFormat}`;

  const baseFileName = videoTitle
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '');

  const showFeedback = (msg: string) => {
    setDownloadSuccessMessage(msg);
    setTimeout(() => setDownloadSuccessMessage(null), 4000);
  };

  // Salvamento Automático para VLC / Smart TV com o MESMO NOME e na MESMA PASTA do vídeo
  const handleAutoSave = async (
    mode: 'translated' | 'bilingual' | 'original',
    formatOverride?: 'srt' | 'vtt'
  ) => {
    const formatToUse = formatOverride || autoSaveFormat;
    setIsAutoSaving(true);
    try {
      const result = await saveSubtitleMatchingVideoName(subtitles, videoTitle, mode, formatToUse, {
        forceDownload: forceDirectDownload,
      });
      showFeedback(result.message);
    } catch (err: any) {
      showFeedback('Erro ao salvar arquivo. Tente novamente.');
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Exportações Manuais
  const handleExportSrt = (mode: 'translated' | 'original' | 'bilingual') => {
    const srt = exportToSrt(subtitles, mode);
    const suffix =
      mode === 'original'
        ? 'original-en'
        : mode === 'bilingual'
        ? 'bilingue-en-pt'
        : 'traduzido-pt-br';
    downloadFile(srt, `${baseFileName}-${suffix}.srt`, 'text/plain');
    showFeedback(
      mode === 'original'
        ? 'SRT Original em Inglês baixado com sucesso!'
        : mode === 'bilingual'
        ? 'SRT Bilíngue (Inglês + Português) baixado com sucesso!'
        : 'SRT Traduzido em Português baixado com sucesso!'
    );
  };

  const handleExportBothSrt = () => {
    downloadDualSrtFiles(subtitles, baseFileName);
    showFeedback('Ambos os arquivos SRT (Inglês + Português) baixados!');
  };

  const handleExportVtt = (mode: 'translated' | 'original' | 'bilingual') => {
    const vtt = exportToVtt(subtitles, mode);
    const suffix =
      mode === 'original'
        ? 'original-en'
        : mode === 'bilingual'
        ? 'bilingue-en-pt'
        : 'traduzido-pt-br';
    downloadFile(vtt, `${baseFileName}-${suffix}.vtt`, 'text/vtt');
    showFeedback(`Arquivo WebVTT (${mode}) baixado com sucesso!`);
  };

  const handleExportTxt = (mode: 'translated' | 'original' | 'bilingual') => {
    const txt = exportToTxt(subtitles, mode);
    const suffix =
      mode === 'original'
        ? 'original-en'
        : mode === 'bilingual'
        ? 'bilingue-en-pt'
        : 'traduzido-pt-br';
    downloadFile(txt, `${baseFileName}-transcricao-${suffix}.txt`, 'text/plain');
    showFeedback(`Transcrição em texto (${mode}) baixada!`);
  };

  const handleCopyText = (mode: 'translated' | 'original' | 'bilingual') => {
    const srt = exportToSrt(subtitles, mode);
    navigator.clipboard.writeText(srt);
    setCopied(true);
    showFeedback('Conteúdo copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  const hasTranslations = subtitles.some((c) => Boolean(c.translation));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-[#10131c] p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Close and Back Buttons */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer mr-1"
              title="Voltar para a tela anterior"
            >
              <ArrowLeft className="h-4 w-4 text-amber-400" />
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Exportar & Salvar Legendas</span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5">
                  VLC & TV Automático
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {subtitles.length} blocos com sincronização precisa de áudio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title="Fechar janela"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mensagem de Feedback Dinâmica */}
        {downloadSuccessMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-emerald-300">Ação Concluída com Sucesso!</p>
              <p className="text-[11px] text-emerald-200/90 mt-0.5">{downloadSuccessMessage}</p>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SEÇÃO PRINCIPAL: SALVAMENTO AUTOMÁTICO PARA VLC / SMART TV  */}
        {/* ============================================================ */}
        <div className="p-4 sm:p-5 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-950 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 shrink-0">
                <MonitorPlay className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-extrabold text-white">
                    Salvamento Automático para o Player (VLC / TV)
                  </h4>
                  <span className="text-[10px] uppercase font-black bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
                    File System API + Download
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  O VLC, Windows Media Player, MPC-HC e Smart TVs carregam as legendas sozinhos quando o arquivo tem o <strong>mesmo nome</strong> e está na <strong>mesma pasta</strong> do vídeo.
                </p>
              </div>
            </div>
          </div>

          {/* Seletor de Formato do Salvamento Automático (.SRT vs .VTT) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">Formato Automático:</span>
              <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setAutoSaveFormat('srt')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    autoSaveFormat === 'srt'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Formato mais popular para VLC, MPC-HC e Smart TVs"
                >
                  .SRT (Recomendado)
                </button>
                <button
                  type="button"
                  onClick={() => setAutoSaveFormat('vtt')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    autoSaveFormat === 'vtt'
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Formato WebVTT para navegadores, HTML5 e plataformas Web"
                >
                  .VTT (Web)
                </button>
              </div>
            </div>

            <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none hover:text-slate-200">
              <input
                type="checkbox"
                checked={forceDirectDownload}
                onChange={(e) => setForceDirectDownload(e.target.checked)}
                className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
              />
              <span>Forçar download direto sem diálogo</span>
            </label>
          </div>

          {/* Comparativo de Nomes para o Usuário */}
          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400 font-sans font-medium">1. Arquivo do seu Vídeo:</span>
              <span className="text-sky-300 font-bold truncate max-w-[240px] sm:max-w-[320px]">
                {videoTitle || 'meu_video.mp4'}
              </span>
            </div>
            <div className="flex items-center justify-between text-emerald-300">
              <span className="text-slate-400 font-sans font-medium">2. Nome da Legenda Salva:</span>
              <span className="font-extrabold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 truncate max-w-[240px] sm:max-w-[320px]">
                {targetFileName}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-800 font-sans">
              <span>Local de Destino Recomendado:</span>
              <span className="text-amber-400 font-semibold">📁 Mesma pasta onde está o vídeo</span>
            </div>
          </div>

          {/* Botões de Ação de 1 Clique */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Opção 1: Legenda Automática Traduzida (PT) */}
            <button
              type="button"
              disabled={isAutoSaving}
              onClick={() => handleAutoSave('translated')}
              className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                <span>Salvar Legenda Automática (.{autoSaveFormat.toUpperCase()})</span>
              </div>
              <span className="text-[11px] font-medium opacity-90">
                Português • Salva como {targetFileName}
              </span>
            </button>

            {/* Opção 2: Legenda Dupla / Bilíngue (EN + PT) */}
            <button
              type="button"
              disabled={isAutoSaving}
              onClick={() => handleAutoSave('bilingual')}
              className="p-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 font-extrabold text-xs sm:text-sm flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-sky-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <Languages className="w-4 h-4" />
                <span>Salvar Legenda Dupla (.{autoSaveFormat.toUpperCase()})</span>
              </div>
              <span className="text-[11px] font-medium opacity-90">
                Inglês + Tradução no mesmo arquivo
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
            <span>💡 Dica: Salve o arquivo na mesma pasta do seu vídeo. O VLC e Smart TVs o carregam sozinhos!</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SEÇÃO: BURN-IN SUBTITLES (LEGENDA EMBUTIDA NO VÍDEO)         */}
        {/* ============================================================ */}
        <div className="mt-5 p-4 sm:p-5 rounded-2xl border-2 border-purple-500/40 bg-gradient-to-b from-purple-500/10 via-slate-900 to-slate-950 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-purple-500 text-slate-950 font-black shadow-md shadow-purple-500/20 shrink-0">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-extrabold text-white">
                    Burn-in Subtitles (Legendas Embutidas no Vídeo)
                  </h4>
                  <span className="text-[10px] uppercase font-black bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded border border-purple-500/40">
                    Hardsub Pronto para Postar
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Inclua as legendas permanentemente na imagem do vídeo. Ideal para Reels, TikTok, Shorts e redes sociais onde o reprodutor não carrega arquivos .srt separados.
                </p>
              </div>
            </div>
          </div>

          {/* Ativar / Desativar Burn-in */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={burnInEnabled}
                onChange={(e) => setBurnInEnabled(e.target.checked)}
                className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
              />
              <span className="text-xs font-bold text-white">Ativar Burn-in (Queimar Legendas no Vídeo)</span>
            </label>
            <span className="text-[10px] text-purple-400 font-mono">
              {burnInEnabled ? '✓ Ativado' : 'Desativado'}
            </span>
          </div>

          {/* Controles de Resolução e Formato (Visíveis quando ativado) */}
          {burnInEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-in fade-in">
              {/* Resolução */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span>Resolução de Saída:</span>
                </label>
                <select
                  value={burnResolution}
                  onChange={(e) => setBurnResolution(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-purple-400 cursor-pointer"
                >
                  <option value="1080p">FULL HD (1080p) - Recomendado para Reels/TikTok</option>
                  <option value="720p">HD (720p) - Leve e rápido</option>
                  <option value="4k">4K Ultra HD - Máxima nitidez</option>
                  <option value="original">Resolução Original do Vídeo</option>
                </select>
              </div>

              {/* Formato */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-purple-400" />
                  <span>Formato do Vídeo:</span>
                </label>
                <select
                  value={burnFormat}
                  onChange={(e) => setBurnFormat(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-purple-400 cursor-pointer"
                >
                  <option value="mp4">.MP4 (H.264 - Universal para Celular e Redes Sociais)</option>
                  <option value="webm">.WEBM (Alta compressão Web)</option>
                </select>
              </div>
            </div>
          )}

          {/* Barra de Progresso de Renderização se estiver renderizando */}
          {isRenderingVideo && (
            <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Renderizando vídeo com legendas...</span>
                <span className="text-purple-400">{renderProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Botão de Execução do Burn-in */}
          {burnInEnabled && (
            <button
              type="button"
              disabled={isRenderingVideo}
              onClick={handleBurnInExport}
              className="w-full p-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Renderizar e Baixar Vídeo com Legendas Embutidas ({burnResolution.toUpperCase()}, .{burnFormat})</span>
            </button>
          )}
        </div>

        {/* SELETOR DE IDIOMA PARA OUTROS FORMATOS */}
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-amber-400" />
              <span>Outros Formatos de Exportação:</span>
            </span>
            {hasTranslations ? (
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Tradução PT-BR ativa</span>
              </span>
            ) : (
              <span className="text-[11px] text-amber-400">Original em Inglês</span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setExportMode('translated')}
              className={`p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                exportMode === 'translated'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="text-base">🇧🇷</span>
              <span>Português</span>
            </button>

            <button
              type="button"
              onClick={() => setExportMode('original')}
              className={`p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                exportMode === 'original'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="text-base">🇺🇸</span>
              <span>Inglês (Original)</span>
            </button>

            <button
              type="button"
              onClick={() => setExportMode('bilingual')}
              className={`p-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                exportMode === 'bilingual'
                  ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20'
                  : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="text-base">🌐</span>
              <span>Bilíngue (Ambos)</span>
            </button>
          </div>
        </div>

        {/* OPÇÃO DE DESTAQUE: BAIXAR AMBOS OS ARQUIVOS SEPARADOS */}
        <div className="mt-4 p-4 rounded-2xl border border-sky-500/30 bg-gradient-to-r from-sky-500/10 via-slate-900 to-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 shrink-0">
              <FolderDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Baixar 2 Arquivos Separados (.SRT)</span>
                <span className="text-[10px] rounded bg-sky-500/20 text-sky-300 px-1.5 py-0.5 font-extrabold">
                  Multi-Trilha
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Gera 2 arquivos: <code className="text-sky-300">{baseFileName}-original-en.srt</code> e{' '}
                <code className="text-emerald-300">{baseFileName}-traduzido-pt-br.srt</code>
              </p>
            </div>
          </div>

          <button
            onClick={handleExportBothSrt}
            className="flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition-all shadow-md shadow-sky-500/20 whitespace-nowrap self-stretch sm:self-auto cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar as 2 Legendas</span>
          </button>
        </div>

        {/* FORMATOS DE EXPORTAÇÃO INDIVIDUAIS */}
        <div className="mt-4 space-y-3">
          {/* 1. Arquivo .SRT com Modo Selecionado */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 transition-all hover:border-amber-400/50">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/20 p-2 text-amber-300">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Arquivo .SRT Personalizado</span>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
                    {exportMode === 'translated'
                      ? 'Português'
                      : exportMode === 'original'
                      ? 'Inglês'
                      : 'Bilíngue'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {exportMode === 'bilingual'
                    ? 'Texto em inglês em cima e tradução em português embaixo por bloco.'
                    : 'Padrão compatível com YouTube Studio, Instagram, Premiere e CapCut.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyText(exportMode)}
                className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Copiar texto formatado"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
              </button>

              <button
                onClick={() => handleExportSrt(exportMode)}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-sm cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Baixar .SRT</span>
              </button>
            </div>
          </div>

          {/* 2. Arquivo WebVTT (.VTT) */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 transition-all hover:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-500/20 p-2 text-purple-300">
                <FileCode className="h-5 w-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white">Arquivo WebVTT (.VTT)</span>
                <p className="text-xs text-slate-400">
                  Ideal para sites, cursos online, plataformas LMS e players HTML5.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleExportVtt(exportMode)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Baixar .VTT</span>
            </button>
          </div>

          {/* 3. Transcrição Contínua (.TXT) */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 transition-all hover:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-300">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white">Texto Puro (.TXT)</span>
                <p className="text-xs text-slate-400">
                  Transcrição contínua em texto corrido para descrição de vídeo ou artigo.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleExportTxt(exportMode)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Baixar .TXT</span>
            </button>
          </div>
        </div>

        {/* Rodapé com botão Voltar intuitivo */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Pronto para usar no VLC, YouTube, Premiere e Redes Sociais
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Voltar ao Reprodutor</span>
          </button>
        </div>
      </div>
    </div>
  );
};

function drawCanvasFallbackBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  title: string,
  currentTime: number,
  duration: number
) {
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(0.5, '#1e1b4b');
  grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.12)';
  ctx.lineWidth = 3;
  ctx.strokeRect(50, 50, width - 100, height - 100);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(width * 0.032)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title || 'LegendaFácil AI Hardsub', width / 2, height / 2 - 50);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillRect(width * 0.25, height / 2 + 30, width * 0.5, 10);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(width * 0.25, height / 2 + 30, (width * 0.5) * Math.min(1, currentTime / duration), 10);
}


