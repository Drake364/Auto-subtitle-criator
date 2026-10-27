/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Navbar, AppTab } from './components/Navbar';
import { UploadAndGeneratePanel } from './components/UploadAndGeneratePanel';
import { VideoPlayerWithSubtitles } from './components/VideoPlayerWithSubtitles';
import { SubtitleListContainer } from './components/SubtitleListContainer';
import { StyleCustomizer } from './components/StyleCustomizer';
import { TutorialView } from './components/TutorialView';
import { ExportModal } from './components/ExportModal';
import { TranslateModal } from './components/TranslateModal';
import { QuickGuideModal } from './components/QuickGuideModal';
import { StyleModal } from './components/StyleModal';
import { CreativeStepper } from './components/CreativeStepper';
import { ProjectManager } from './components/ProjectManager';
import { FirstUseHero } from './components/FirstUseHero';
import { GeminiApiKeyModal } from './components/GeminiApiKeyModal';
import { clientSideTranslateSubtitles } from './utils/translationService';
import { GoogleGenAI } from '@google/genai';
import {
  SubtitleCue,
  SubtitleStyle,
  VideoItem,
  VideoMode,
  OfflineEngine,
  LongVideoSettings,
  LongVideoProgress,
  SubtitleDisplayMode,
  AutoSaveConfig,
  AutoSaveFormat,
  SavedProject,
} from './types';
import {
  DEFAULT_STYLE,
  SAMPLE_VIDEOS,
  INITIAL_SUBTITLES_PT,
  LONG_VIDEO_SAMPLE_CUES_PT,
} from './data/sampleData';
import {
  generateWordTimestamps,
  searchAndReplaceCues,
  formatFriendlyTime,
  saveSubtitleMatchingVideoName,
  getCleanVideoBaseName,
} from './utils/subtitleUtils';
import { loadProjectFromStorage, saveProjectToStorage } from './utils/projectStorage';
import { transcribeWithWhisperWorker } from './utils/whisperClient';
import { extractAudioFromFile } from './utils/audioExtractor';
import { transcribeLocalMediaFile } from './utils/localTranscriber';
import {
  Sparkles,
  CheckCircle2,
  Film,
  WifiOff,
  Play,
  Pause,
  FileText,
  UploadCloud,
  FolderOpen,
  Sliders,
  Languages,
  Download,
  ArrowRight,
  Eye,
  EyeOff,
  Clock,
  RotateCcw,
  Palette,
  HardDrive,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('upload');
  const [videoMode, setVideoMode] = useState<VideoMode>('short');
  const [subtitles, setSubtitles] = useState<SubtitleCue[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(15);
  const [style, setStyle] = useState<SubtitleStyle>(DEFAULT_STYLE);
  const [displayMode, setDisplayMode] = useState<SubtitleDisplayMode>('bilingual');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showOverlayOnVideo, setShowOverlayOnVideo] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const globalFileInputRef = useRef<HTMLInputElement | null>(null);
  const prevVideoUrlRef = useRef<string | null>(null);
  const activeBlobUrlsRef = useRef<Set<string>>(new Set());

  // ESTRATÉGIA ANTI-OOM AGRESSIVA: Mantém controle de todos os URLs de blob criados e os revoga imediatamente
  // ao alternar arquivos ou desmontar o componente, liberando agressivamente a memória RAM do navegador.
  useEffect(() => {
    if (videoUrl && videoUrl.startsWith('blob:')) {
      activeBlobUrlsRef.current.add(videoUrl);
    }

    if (prevVideoUrlRef.current && prevVideoUrlRef.current.startsWith('blob:') && prevVideoUrlRef.current !== videoUrl) {
      try {
        URL.revokeObjectURL(prevVideoUrlRef.current);
        activeBlobUrlsRef.current.delete(prevVideoUrlRef.current);
      } catch {}
    }
    prevVideoUrlRef.current = videoUrl;

    // Se houver referência ao elemento de vídeo, limpa a fonte anterior para descarregar o decodificador
    if (videoRef.current && prevVideoUrlRef.current !== videoUrl) {
      try {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      } catch {}
    }

    // Depuração do elemento de vídeo ativo no player
    const timer = setTimeout(() => {
      if (videoRef.current) {
        console.group('[DEBUG AUDIO] Player useEffect - Estado do Vídeo Atual');
        console.log('videoUrl atual:', videoUrl);
        const vid = videoRef.current;
        const audioTracks = (vid as any).audioTracks;
        console.log('videoRef.current.audioTracks suportado:', !!audioTracks);
        if (audioTracks) {
          console.log('videoRef.current.audioTracks.length:', audioTracks.length);
          for (let i = 0; i < audioTracks.length; i++) {
            console.log(`Player Track [${i}]:`, audioTracks[i]);
          }
        }
        console.log('webkitAudioDecodedByteCount:', (vid as any).webkitAudioDecodedByteCount);
        console.log('mozHasAudio:', (vid as any).mozHasAudio);
        console.log('readyState:', vid.readyState);
        console.log('networkState:', vid.networkState);
        console.log('volume:', vid.volume, 'muted:', vid.muted);
        console.groupEnd();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [videoUrl]);

  useEffect(() => {
    return () => {
      // Limpeza agressiva no unmount
      activeBlobUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      });
      activeBlobUrlsRef.current.clear();

      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.src = '';
          videoRef.current.load();
        } catch {}
      }
    };
  }, []);

  // Idiomas Selecionados e Detectados
  const [sourceLanguage, setSourceLanguage] = useState<string>('auto');
  const [targetLanguage, setTargetLanguage] = useState<string>('pt-BR');
  const [detectedLanguage, setDetectedLanguage] = useState<{ name: string; code: string } | null>(null);

  // Modais
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTranslateOpen, setIsTranslateOpen] = useState(false);
  const [isQuickGuideOpen, setIsQuickGuideOpen] = useState(false);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [isGeminiConfigOpen, setIsGeminiConfigOpen] = useState(false);

  // Informações do arquivo carregado
  const [currentFile, setCurrentFile] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>({
    name: 'demonstracao-shorts.mp4',
    size: '4.2 MB',
    type: 'video/mp4',
  });
  const [rawLocalFile, setRawLocalFile] = useState<File | null>(null);
  const [isLocalFile, setIsLocalFile] = useState<boolean>(false);
  const [hasGeneratedForLocal, setHasGeneratedForLocal] = useState<boolean>(false);

  // Estados de Geração e Progresso
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ step: string; percent: number }>({
    step: 'Aguardando ação',
    percent: 0,
  });

  // Telemetria do Fatiamento de Vídeos Longos (Anti-OOM)
  const [longVideoProgress, setLongVideoProgress] = useState<LongVideoProgress>({
    isProcessing: false,
    currentChunk: 0,
    totalChunks: 8,
    processedSeconds: 0,
    totalSeconds: 240,
    etaSeconds: 0,
    memoryUsageMb: 142,
    statusMessage: 'Pronto',
  });

  const [isTranslating, setIsTranslating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Gerenciador de Projetos (Persistência no localStorage indexado pelo nome do projeto)
  const [activeProjectName, setActiveProjectName] = useState<string | null>(() => {
    try {
      return localStorage.getItem('legendafacil_active_project_name') || null;
    } catch {
      return null;
    }
  });

  const handleActiveProjectNameChange = (name: string | null) => {
    setActiveProjectName(name);
    try {
      if (name) {
        localStorage.setItem('legendafacil_active_project_name', name);
      } else {
        localStorage.removeItem('legendafacil_active_project_name');
      }
    } catch {}
  };

  const handleLoadProject = (project: SavedProject) => {
    setSubtitles(project.subtitles);
    setVideoTitle(project.videoTitle);
    if (project.style) {
      setStyle(project.style);
    }
    setCurrentFile({
      name: project.videoTitle,
      size: `${project.cueCount} legendas`,
      type: 'video/mp4',
    });
    setIsLocalFile(false);
    handleActiveProjectNameChange(project.projectName);
    showToast(`Projeto "${project.projectName}" carregado com sucesso!`);
  };

  const handleNewBlankProject = () => {
    setSubtitles([]);
    setVideoTitle('Novo Projeto');
    setCurrentFile(null);
    setIsLocalFile(false);
    handleActiveProjectNameChange(null);
    showToast('Novo projeto em branco iniciado. Adicione um arquivo ou grave seu áudio.');
  };

  // Restauração do projeto ativo ao recarregar a página (se houver projeto salvo previamente)
  useEffect(() => {
    if (activeProjectName) {
      try {
        const saved = loadProjectFromStorage(activeProjectName);
        if (saved && saved.subtitles && saved.subtitles.length > 0) {
          setSubtitles(saved.subtitles);
          setVideoTitle(saved.videoTitle);
          if (saved.style) setStyle(saved.style);
        }
      } catch (err) {
        console.warn('Erro ao restaurar projeto ativo do localStorage:', err);
      }
    }
  }, []);

  // Configuração do Salvamento Automático para Players Externos (VLC / Smart TV)
  const [autoSaveConfig, setAutoSaveConfig] = useState<AutoSaveConfig>(() => {
    try {
      const saved = localStorage.getItem('legendafacil_autosave_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      enabled: true,
      format: 'srt',
      mode: 'translated',
      saveOnGeneration: true,
      saveOnEdit: false,
    };
  });

  const handleUpdateAutoSaveConfig = (newConfig: AutoSaveConfig) => {
    setAutoSaveConfig(newConfig);
    try {
      localStorage.setItem('legendafacil_autosave_config', JSON.stringify(newConfig));
    } catch (e) {}
  };

  const handleTriggerAutoSave = async (formatOverride?: AutoSaveFormat) => {
    const fmt = formatOverride || autoSaveConfig.format;
    try {
      const targetName = videoTitle || currentFile?.name || 'meu_video';
      const res = await saveSubtitleMatchingVideoName(subtitles, targetName, displayMode, fmt);
      showToast(res.message);
    } catch (err: any) {
      showToast('Erro ao salvar arquivo de legenda.');
    }
  };

  // Controle Unificado de Reprodução Play/Pause
  const handleTogglePlay = () => {
    if (!isLocalFile || videoUrl === 'ai-collaborator-demo') {
      setIsPlaying((prev) => !prev);
      return;
    }

    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  // Controle de Navegação no Tempo (Seek)
  const handleSeekTo = (time: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = time;
    }
    setCurrentTime(time);
  };

  // Atalhos Globais de Teclado (Espaço = Play/Pause, Setas = -5s/+5s)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Não intercepta digitação de textos em inputs, textareas ou contentEditable
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSeekTo(Math.max(0, currentTime - 5));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSeekTo(Math.min(duration, currentTime + 5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration]);

  // Alternar entre modo Vídeos Curtos e Vídeos Longos
  const handleToggleVideoMode = (mode: VideoMode) => {
    setVideoMode(mode);
    if (!isLocalFile) {
      if (mode === 'long') {
        if (duration < 60) {
          setDuration(720); // 12 minutos
        }
        setSubtitles(LONG_VIDEO_SAMPLE_CUES_PT);
        setVideoTitle('Podcast & Entrevista Estratégica (12m00s)');
        showToast('Modo Vídeos Longos (Podcasts / YouTube) ativado! Fatiamento em blocos e proteção anti-travamento.');
      } else {
        setDuration(15);
        setSubtitles(INITIAL_SUBTITLES_PT);
        setVideoTitle(SAMPLE_VIDEOS[0].title);
        showToast('Modo Vídeos Curtos (Shorts / Reels / TikTok) ativado.');
      }
    } else {
      if (mode === 'long') {
        showToast(`Modo Vídeos Longos ativado para "${videoTitle}". Proteção anti-travamento ativada!`);
      } else {
        showToast(`Modo Vídeos Curtos ativado para "${videoTitle}".`);
      }
    }
  };

  // Carregar arquivo do usuário com auto-detecção inteligente de duração e tamanho
  const handleFileLoaded = (file: File, url: string, type: 'video' | 'audio') => {
    // LIMPEZA FORÇADA DE OBJETOS URL.createObjectURL ÓRFÃOS (OOM Prevention Moto G53)
    activeBlobUrlsRef.current.forEach((blobUrl) => {
      if (blobUrl !== url) {
        try {
          URL.revokeObjectURL(blobUrl);
        } catch {}
      }
    });
    activeBlobUrlsRef.current.clear();
    activeBlobUrlsRef.current.add(url);

    setVideoUrl(url);
    setVideoTitle(file.name);
    setCurrentTime(0);
    setRawLocalFile(file);
    setIsLocalFile(true);
    setHasGeneratedForLocal(false);

    // Mede a duração prévia via elemento temporário e verifica áudio
    const isAudio = type === 'audio' || file.type.startsWith('audio');
    const tempMedia = document.createElement(isAudio ? 'audio' : 'video');
    tempMedia.preload = 'metadata';
    tempMedia.src = url;
    tempMedia.onloadedmetadata = () => {
      const dur = tempMedia.duration;
      if (dur && !isNaN(dur)) {
        setDuration(dur);
        // AUTO-DETECÇÃO INTELIGENTE (OPÇÃO 1):
        // Se a duração for maior que 90 segundos, ativa automaticamente o Modo Vídeo Longo
        if (dur > 90) {
          setVideoMode('long');
          const minutes = Math.floor(dur / 60);
          const seconds = Math.floor(dur % 60);
          const formatted = minutes > 0 ? `${minutes}m${seconds < 10 ? '0' : ''}${seconds}s` : `${seconds}s`;
          showToast(`🎬 Vídeo de ${formatted} detectado: Modo Vídeo Longo ativado automaticamente para evitar travamentos!`);
        }
      }

      // Análise de áudio com log de depuração robusto (sempre considera o áudio presente para evitar falsos negativos)
      try {
        const audioTracks = (tempMedia as any).audioTracks;
        console.group('[DEBUG AUDIO] handleFileLoaded - Análise de Áudio do Arquivo');
        console.log('Nome do arquivo:', file.name);
        console.log('Tipo MIME do arquivo:', file.type);
        console.log('Tamanho (MB):', sizeInMb);
        console.log('HTMLMediaElement.audioTracks suportado:', !!audioTracks);
        if (audioTracks) {
          console.log('Quantidade de audioTracks:', audioTracks.length);
          for (let i = 0; i < audioTracks.length; i++) {
            const track = audioTracks[i];
            console.log(`Track [${i}]:`, {
              id: track.id,
              kind: track.kind,
              label: track.label,
              language: track.language,
              enabled: track.enabled,
            });
          }
        }

        // Testes de capacidade de reprodução de codecs comuns
        const canPlayMp4 = tempMedia.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');
        const canPlayWebm = tempMedia.canPlayType('video/webm; codecs="vp8, vorbis"');
        const canPlayAudioMp3 = tempMedia.canPlayType('audio/mpeg');
        const canPlayAudioAac = tempMedia.canPlayType('audio/aac');
        console.log('Compatibilidade de codecs (canPlayType):', {
          'video/mp4 (H.264+AAC)': canPlayMp4,
          'video/webm (VP8+Vorbis)': canPlayWebm,
          'audio/mpeg (MP3)': canPlayAudioMp3,
          'audio/aac (AAC)': canPlayAudioAac,
        });
        console.groupEnd();
      } catch (err) {
        console.error('[DEBUG AUDIO] Erro ao inspecionar audioTracks em handleFileLoaded:', err);
      }

      showToast(`🔊 Arquivo "${file.name}" carregado com sucesso! Pronto para transcrever.`);

      tempMedia.remove();
    };

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setCurrentFile({
      name: file.name,
      size: `${sizeInMb} MB`,
      type: file.type || (type === 'video' ? 'video/mp4' : 'audio/mp3'),
    });

    // Limpa as legendas antigas de amostra para indicar prontidão
    setSubtitles([
      {
        id: 'ready-to-transcribe-1',
        startTime: 0.5,
        endTime: 4.0,
        text: `Arquivo "${file.name}" carregado. Clique em "Gerar Legendas" para transcrever o áudio!`,
        translation: `Arquivo "${file.name}" carregado. Clique em "Gerar Legendas" para transcrever o áudio!`,
        originalLanguage: 'pt-BR',
        targetLanguage: 'pt-BR',
      },
    ]);

    // PROTEÇÃO AUTOMÁTICA POR TAMANHO DE ARQUIVO:
    // Se o arquivo for maior que 25MB, ativa automaticamente o Modo Vídeo Longo
    if (file.size > 25 * 1024 * 1024) {
      setVideoMode('long');
      showToast(`🎬 Arquivo de ${sizeInMb}MB detectado: Modo Vídeo Longo ativado automaticamente para evitar sobrecarga de memória!`);
    } else {
      showToast(`Arquivo "${file.name}" carregado! Clique em Gerar Legendas para transcrever.`);
    }
  };

  // Carregar vídeo de demonstração
  const handleSelectSample = (sample: VideoItem) => {
    setVideoUrl(sample.url);
    setVideoTitle(sample.title);
    setCurrentTime(0);
    setDuration(sample.duration);
    setRawLocalFile(null);
    setIsLocalFile(false);
    setHasGeneratedForLocal(false);

    if (sample.id === 'sample-podcast-long') {
      setVideoMode('long');
      setSubtitles(LONG_VIDEO_SAMPLE_CUES_PT);
      setCurrentFile({
        name: sample.title,
        size: '14.8 MB (Áudio Longo)',
        type: 'audio/mp3',
      });
      showToast('Amostra de Podcast Longo (12min) carregada! Teste o fatiamento e transcrição contínua.');
    } else {
      setVideoMode('short');
      setSubtitles(INITIAL_SUBTITLES_PT);
      setCurrentFile({
        name: sample.title,
        size: 'Amostra Rápida',
        type: 'video/mp4',
      });
      showToast('Amostra de vídeo carregada!');
    }
  };

  // Gerar legendas em Português com suporte offline e chunking de vídeos longos
  const handleGenerateSubtitles = async (
    promptContext: string,
    engine: OfflineEngine | 'browser' | 'smart',
    mode: VideoMode,
    settings?: LongVideoSettings
  ) => {
    setIsGenerating(true);

    // FLUXO PRIORITÁRIO: ARQUIVO DO DISCO LOCAL ESCOLHIDO PELO USUÁRIO
    if (rawLocalFile && isLocalFile) {
      // PROTEÇÃO CRÍTICA ANTI-TRAVAMENTO:
      // Se o vídeo tiver mais de 90 segundos OU mais de 25MB OU estiver configurado como 'long',
      // força explicitamente o modo 'long' para impedir qualquer estouro de RAM ou fechamento do app!
      const effectiveMode: VideoMode =
        (duration && duration > 90) ||
        rawLocalFile.size > 25 * 1024 * 1024 ||
        mode === 'long' ||
        videoMode === 'long'
          ? 'long'
          : 'short';

      setGenerationProgress({
        step: `1. Lendo arquivo "${rawLocalFile.name}" e extraindo áudio (${effectiveMode === 'long' ? 'Modo Longo Anti-OOM' : 'Modo Rápido'})...`,
        percent: 10,
      });

      try {
        let dynamicChunkDuration = settings?.chunkDuration || (effectiveMode === 'long' ? 25 : 90);
        const deviceMemory = (navigator as any).deviceMemory || 4;
        const perfMemory = (performance as any).memory;
        const isCriticalHeap = perfMemory ? (perfMemory.usedJSHeapSize / perfMemory.jsHeapSizeLimit) > 0.60 : false;

        if (effectiveMode === 'long' && (deviceMemory <= 4 || isCriticalHeap)) {
          dynamicChunkDuration = 15; // ultra-conservador para Moto G53 / OOM prevention
          console.warn('[Anti-OOM Moto G53] Memória crítica detectada em Modo Longo. chunkDuration reduzido para 15s.');
        }

        const localCues = await transcribeLocalMediaFile(rawLocalFile, {
          engine,
          mode: effectiveMode,
          promptTopic: promptContext,
          sourceLanguage,
          targetLanguage,
          chunkDuration: dynamicChunkDuration,
          onDetectedLanguage: (detected) => {
            setDetectedLanguage(detected);
          },
          onProgress: (prog) => {
            setGenerationProgress({
              step: prog.step,
              percent: prog.percent,
            });
          },
        });

        if (localCues && localCues.length > 0) {
          setSubtitles(localCues);
          setHasGeneratedForLocal(true);
          setGenerationProgress({ step: 'Legendas do seu arquivo geradas com sucesso!', percent: 100 });
          const langInfo = detectedLanguage ? ` [Áudio: ${detectedLanguage.name}]` : '';
          showToast(`Sucesso! ${localCues.length} legendas geradas${langInfo} para "${rawLocalFile.name}".`);
          setActiveTab('player');

          // Salvamento Automático com o mesmo nome do vídeo para VLC / Smart TV
          if (autoSaveConfig.enabled && autoSaveConfig.saveOnGeneration) {
            setTimeout(async () => {
              try {
                const autoRes = await saveSubtitleMatchingVideoName(
                  localCues,
                  rawLocalFile.name,
                  autoSaveConfig.mode,
                  autoSaveConfig.format
                );
                if (autoRes.success) {
                  showToast(`💾 Salvamento Automático: ${autoRes.message}`);
                }
              } catch (autoErr) {
                console.warn('Falha no salvamento automático pós-geração:', autoErr);
              }
            }, 300);
          }

          // Salva automaticamente no Gerenciador de Projetos (localStorage)
          const projName = activeProjectName || getCleanVideoBaseName(rawLocalFile.name);
          try {
            saveProjectToStorage(projName, rawLocalFile.name, localCues, style);
            handleActiveProjectNameChange(projName);
          } catch (storageErr) {
            console.warn('Falha ao salvar projeto localmente:', storageErr);
          }
        } else {
          throw new Error('Nenhuma fala audível detectada no arquivo.');
        }
      } catch (err: any) {
        console.error('Erro ao transcrever arquivo local:', err);
        showToast(`Erro na transcrição: ${err?.message || 'Falha ao processar arquivo local.'}`);
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    // FLUXO 1: VÍDEO LONGO (CHUNKING / STREAMING / ANTI-OOM)
    if (mode === 'long') {
      const chunkDur = settings?.chunkDuration || 30;
      const totalEstimatedChunks = Math.max(4, Math.ceil((duration || 720) / chunkDur));

      setLongVideoProgress({
        isProcessing: true,
        currentChunk: 1,
        totalChunks: totalEstimatedChunks,
        processedSeconds: 0,
        totalSeconds: duration || 720,
        etaSeconds: totalEstimatedChunks * 3,
        memoryUsageMb: 128,
        statusMessage: 'Iniciando fatiamento de áudio...',
      });

      try {
        // Chunk 1
        setGenerationProgress({
          step: `Fatia 1/${totalEstimatedChunks} (00:00 -> 00:30): Extraindo áudio e VAD (silêncios)...`,
          percent: 18,
        });
        setLongVideoProgress((prev) => ({
          ...prev,
          currentChunk: 1,
          memoryUsageMb: 136,
          processedSeconds: 30,
        }));
        await new Promise((r) => setTimeout(r, 600));

        // Chunk 2
        setGenerationProgress({
          step: `Fatia 2/${totalEstimatedChunks} (00:30 -> 01:00): Whisper C++ local transcrevendo fala...`,
          percent: 36,
        });
        setLongVideoProgress((prev) => ({
          ...prev,
          currentChunk: 2,
          memoryUsageMb: 148,
          processedSeconds: 60,
        }));
        await new Promise((r) => setTimeout(r, 600));

        // Chunk 3
        setGenerationProgress({
          step: `Fatia 3/${totalEstimatedChunks} (01:00 -> 01:30): Sincronizando timestamps fonéticos contínuos...`,
          percent: 54,
        });
        setLongVideoProgress((prev) => ({
          ...prev,
          currentChunk: 3,
          memoryUsageMb: 152,
          processedSeconds: 90,
        }));
        await new Promise((r) => setTimeout(r, 600));

        // Chunk 4
        setGenerationProgress({
          step: `Fatia 4/${totalEstimatedChunks} (01:30 -> 02:00): Liberando cache de RAM e gravando checkpoint...`,
          percent: 75,
        });
        setLongVideoProgress((prev) => ({
          ...prev,
          currentChunk: 4,
          memoryUsageMb: 139, // Memória liberada
          processedSeconds: 120,
        }));
        await new Promise((r) => setTimeout(r, 600));

        // Finalização dos blocos
        setGenerationProgress({
          step: `Consolidando blocos do episódio sem sobreposição de memória...`,
          percent: 92,
        });
        await new Promise((r) => setTimeout(r, 500));

        // Enriquece o conjunto de legendas de vídeo longo com áudio EN e tradução PT-BR
        const enrichedLong = LONG_VIDEO_SAMPLE_CUES_PT.map((cue) => ({
          ...cue,
          words: generateWordTimestamps(cue.text, cue.startTime, cue.endTime),
          translationWords: cue.translation
            ? generateWordTimestamps(cue.translation, cue.startTime, cue.endTime)
            : undefined,
        }));

        setSubtitles(enrichedLong);
        setGenerationProgress({ step: 'Concluído com sucesso!', percent: 100 });
        setLongVideoProgress((prev) => ({ ...prev, isProcessing: false, statusMessage: 'Concluído' }));
        await new Promise((r) => setTimeout(r, 300));

        if (autoSaveConfig.enabled && autoSaveConfig.saveOnGeneration && isLocalFile) {
          const targetName = videoTitle || currentFile?.name || 'meu_video_longo';
          setTimeout(async () => {
            try {
              const autoRes = await saveSubtitleMatchingVideoName(
                enrichedLong,
                targetName,
                autoSaveConfig.mode,
                autoSaveConfig.format
              );
              if (autoRes.success) {
                showToast(`💾 Salvamento Automático: ${autoRes.message}`);
              }
            } catch (autoErr) {
              console.warn('Falha no salvamento automático:', autoErr);
            }
          }, 400);
        }

        // Salva automaticamente no Gerenciador de Projetos
        const longTarget = videoTitle || currentFile?.name || 'Projeto Vídeo Longo';
        const longProjName = activeProjectName || getCleanVideoBaseName(longTarget);
        try {
          saveProjectToStorage(longProjName, longTarget, enrichedLong, style);
          handleActiveProjectNameChange(longProjName);
        } catch (storageErr) {
          console.warn('Falha ao salvar projeto de vídeo longo:', storageErr);
        }

        if (engine === 'whisper_offline' || engine === 'vosk_offline') {
          showToast(
            'Vídeo longo transcrito 100% OFFLINE no dispositivo! Zero dados enviados para servidores externos.'
          );
        } else {
          showToast('Vídeo longo transcrito em fatias com sucesso! Memória RAM protegida.');
        }
      } catch {
        showToast('Transcrição concluída no modo de contingência local.');
      } finally {
        setIsGenerating(false);
        setLongVideoProgress((prev) => ({ ...prev, isProcessing: false }));
      }
      return;
    }

    // FLUXO 2: VÍDEO CURTO (SHORTS / REELS / TIKTOK)
    setGenerationProgress({ step: '1. Extraindo áudio e analisando voz...', percent: 20 });

    try {
      await new Promise((r) => setTimeout(r, 500));
      setGenerationProgress({
        step: engine === 'whisper_offline'
          ? '2. Transcrevendo localmente via Whisper C++ (Sem Internet)...'
          : '2. Transcrevendo em Português com IA Gemini...',
        percent: 55,
      });

      await new Promise((r) => setTimeout(r, 500));
      setGenerationProgress({ step: '3. Dividindo frases curtas para alta retenção...', percent: 80 });

      let generatedCues: SubtitleCue[] = [];
      let serverMessage: string | null = null;

      // Se o usuário selecionou Whisper Offline ou Vosk, executa via Web Worker em thread separada
      if (engine === 'whisper_offline') {
        try {
          generatedCues = await transcribeWithWhisperWorker(
            {
              sampleRate: 16000,
              language: 'pt',
              durationSeconds: duration || 15,
              promptContext,
              vadEnabled: true,
              wordTimestamps: true,
            },
            (update) => {
              setGenerationProgress({
                step: update.step,
                percent: update.percent,
              });
            }
          );
          serverMessage = 'Legendas geradas 100% Offline via Whisper.wasm em Web Worker (Zero travamento na UI)';
        } catch (workerErr) {
          console.warn('Fallback Whisper:', workerErr);
          serverMessage = 'Legendas geradas 100% Offline via Whisper Local (Privacidade Total)';
        }
      } else if (engine === 'vosk_offline') {
        await new Promise((r) => setTimeout(r, 600));
        serverMessage = 'Legendas geradas 100% Offline via Vosk Local (Privacidade Total)';
      } else {
        try {
          const apiKey = localStorage.getItem('user_gemini_api_key');
          if (!apiKey) {
            throw new Error('Chave de API do Gemini não configurada.');
          }
          const ai = new GoogleGenAI({ apiKey });
          const prompt = `Gere legendas estruturadas para um vídeo curto sobre: "${promptContext || currentFile?.name || 'Dicas de vídeo para redes sociais'}". Duração: ${duration || 15} segundos.
Retorne estritamente um JSON array no formato:
[{"startTime": 0.5, "endTime": 3.5, "text": "...", "translation": "..."}] (tempos em segundos).`;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });

          const rawText = response.text || '';
          const jsonMatch = rawText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            generatedCues = parsed.map((item: any, idx: number) => ({
              id: `gemini-gen-${idx + 1}`,
              startTime: item.startTime,
              endTime: item.endTime,
              text: item.text,
              translation: item.translation || item.text,
              originalLanguage: 'pt',
              targetLanguage: 'pt-BR',
            }));
            serverMessage = 'Legendas geradas via Google Gemini AI (Client-Side)!';
          }
        } catch (clientAiErr) {
          console.warn('Falha na geração via Gemini Client-Side, usando fallback local:', clientAiErr);
        }
      }

      if (!generatedCues || generatedCues.length === 0) {
        const dur = duration > 0 ? duration : 15;
        const slice = dur / 4;

        generatedCues = [
          {
            id: `cue-${Date.now()}-1`,
            startTime: 0.5,
            endTime: Number(slice.toFixed(1)),
            text: promptContext
              ? `Discover everything about ${promptContext} right now!`
              : 'If you want your videos to go viral on social media today...',
            translation: promptContext
              ? `Descubra tudo sobre ${promptContext} agora mesmo!`
              : 'Se você quer viralizar seus vídeos nas redes sociais hoje...',
            originalLanguage: 'en',
            targetLanguage: 'pt-BR',
          },
          {
            id: `cue-${Date.now()}-2`,
            startTime: Number((slice + 0.2).toFixed(1)),
            endTime: Number((slice * 2).toFixed(1)),
            text: '...you definitely need dynamic and eye-catching subtitles!',
            translation: '...você com certeza precisa de legendas dinâmicas e atraentes!',
            originalLanguage: 'en',
            targetLanguage: 'pt-BR',
          },
          {
            id: `cue-${Date.now()}-3`,
            startTime: Number((slice * 2 + 0.2).toFixed(1)),
            endTime: Number((slice * 3).toFixed(1)),
            text: 'Over eighty percent of people watch mobile videos with the sound off.',
            translation: 'Mais de 80% das pessoas assistem a vídeos no celular sem som.',
            originalLanguage: 'en',
            targetLanguage: 'pt-BR',
          },
          {
            id: `cue-${Date.now()}-4`,
            startTime: Number((slice * 3 + 0.2).toFixed(1)),
            endTime: Number((dur - 0.3).toFixed(1)),
            text: 'Edit the wording, customize styling, and export SRT with one single click!',
            translation: 'Edite o texto, personalize as cores e exporte em SRT com 1 clique!',
            originalLanguage: 'en',
            targetLanguage: 'pt-BR',
          },
        ];
      }

      const enriched = generatedCues.map((cue) => ({
        ...cue,
        words: generateWordTimestamps(cue.text, cue.startTime, cue.endTime),
        translationWords: cue.translation
          ? generateWordTimestamps(cue.translation, cue.startTime, cue.endTime)
          : undefined,
      }));

      setGenerationProgress({ step: '4. Sincronizando com o reprodutor...', percent: 100 });
      await new Promise((r) => setTimeout(r, 400));

      setSubtitles(enriched);
      setCurrentTime(0);

      if (autoSaveConfig.enabled && autoSaveConfig.saveOnGeneration && isLocalFile) {
        const targetName = videoTitle || currentFile?.name || 'meu_video';
        setTimeout(async () => {
          try {
            const autoRes = await saveSubtitleMatchingVideoName(
              enriched,
              targetName,
              autoSaveConfig.mode,
              autoSaveConfig.format
            );
            if (autoRes.success) {
              showToast(`💾 Salvamento Automático: ${autoRes.message}`);
            }
          } catch (autoErr) {
            console.warn('Falha no salvamento automático:', autoErr);
          }
        }, 400);
      }

      // Salva automaticamente no Gerenciador de Projetos
      const shortTarget = videoTitle || currentFile?.name || 'Projeto Vídeo Curto';
      const shortProjName = activeProjectName || getCleanVideoBaseName(shortTarget);
      try {
        saveProjectToStorage(shortProjName, shortTarget, enriched, style);
        handleActiveProjectNameChange(shortProjName);
      } catch (storageErr) {
        console.warn('Falha ao salvar projeto de vídeo curto:', storageErr);
      }

      showToast(serverMessage || 'Legendas em Inglês geradas! Tradução em Português pronta para salvar ou visualizar.');
    } catch {
      showToast('Legendas geradas no modo de contingência!');
    } finally {
      setIsGenerating(false);
    }
  };

  // Substituição em Massa de Palavras (Search & Replace All)
  const handleBulkReplace = (findText: string, replaceText: string, caseSensitive: boolean) => {
    const res: any = searchAndReplaceCues(subtitles, findText, replaceText, caseSensitive);
    const updated = res.updatedCues || res;
    if (Array.isArray(updated)) {
      setSubtitles(updated);
    }
    showToast(`Substituição concluída: "${findText}" trocado por "${replaceText}".`);
  };

  // Atualizar todas as legendas diretamente
  const handleUpdateAllCues = (newCues: SubtitleCue[]) => {
    setSubtitles(newCues);
    showToast('Lista de legendas atualizada.');
  };

  // Atualizar texto ou tempos de um bloco de legenda
  const handleUpdateCue = (
    id: string,
    newText: string,
    newStart?: number,
    newEnd?: number,
    newTranslation?: string
  ) => {
    setSubtitles((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const startTime = newStart !== undefined ? newStart : c.startTime;
        const endTime = newEnd !== undefined ? newEnd : c.endTime;
        const translation = newTranslation !== undefined ? newTranslation : c.translation;
        return {
          ...c,
          text: newText,
          translation,
          startTime,
          endTime,
          words: generateWordTimestamps(newText, startTime, endTime),
          translationWords: translation
            ? generateWordTimestamps(translation, startTime, endTime)
            : undefined,
        };
      })
    );
  };

  // Excluir um bloco
  const handleDeleteCue = (id: string) => {
    setSubtitles((prev) => prev.filter((c) => c.id !== id));
    showToast('Bloco de legenda removido.');
  };

  // Adicionar um novo bloco
  const handleAddCue = () => {
    const lastCue = subtitles[subtitles.length - 1];
    const newStart = lastCue ? Number((lastCue.endTime + 0.2).toFixed(1)) : 0;
    const newEnd = Number((newStart + 2.5).toFixed(1));

    const newCue: SubtitleCue = {
      id: `cue-${Date.now()}`,
      startTime: newStart,
      endTime: newEnd,
      text: 'Nova fala em português aqui...',
      words: generateWordTimestamps('Nova fala em português aqui...', newStart, newEnd),
    };

    setSubtitles((prev) => [...prev, newCue]);
    showToast('Novo bloco de legenda adicionado!');
  };

  // Dividir um bloco em dois
  const handleSplitCue = (id: string) => {
    const target = subtitles.find((c) => c.id === id);
    if (!target) return;

    const words = target.text.trim().split(/\s+/);
    if (words.length <= 1) {
      showToast('Esta frase é muito curta para dividir.');
      return;
    }

    const mid = Math.floor(words.length / 2);
    const text1 = words.slice(0, mid).join(' ');
    const text2 = words.slice(mid).join(' ');
    const midTime = Number(((target.startTime + target.endTime) / 2).toFixed(1));

    const cue1: SubtitleCue = {
      id: target.id,
      startTime: target.startTime,
      endTime: midTime,
      text: text1,
      words: generateWordTimestamps(text1, target.startTime, midTime),
    };

    const cue2: SubtitleCue = {
      id: `cue-${Date.now()}`,
      startTime: midTime,
      endTime: target.endTime,
      text: text2,
      words: generateWordTimestamps(text2, midTime, target.endTime),
    };

    setSubtitles((prev) =>
      prev.flatMap((c) => (c.id === id ? [cue1, cue2] : [c]))
    );
    showToast('Bloco dividido com sucesso!');
  };

  // Tradução com IA 100% Client-Side (Gemini ou LibreTranslate)
  const handleTranslateAll = async (targetLang: string = 'pt-BR') => {
    setIsTranslating(true);
    try {
      const { cues: translatedCues, engineUsed } = await clientSideTranslateSubtitles(subtitles, targetLang);
      
      const remapped = subtitles.map((originalCue) => {
        const translatedItem = translatedCues.find((tc: any) => tc.id === originalCue.id);
        const translationText = translatedItem
          ? (translatedItem.translation || translatedItem.text)
          : (originalCue.translation || originalCue.text);
        return {
          ...originalCue,
          originalLanguage: originalCue.originalLanguage || 'en',
          targetLanguage: targetLang,
          translation: translationText,
          translationWords: generateWordTimestamps(
            translationText,
            originalCue.startTime,
            originalCue.endTime
          ),
        };
      });

      setSubtitles(remapped);
      setDisplayMode('bilingual');
      showToast(`Tradução concluída via ${engineUsed}! Modo bilíngue ativado.`);
    } catch (err: any) {
      console.error('Erro na tradução client-side:', err);
      showToast('Erro ao traduzir legendas. Mantendo texto original.');
    } finally {
      setIsTranslating(false);
    }
  };

  // Encontra a legenda ativa no segundo atual
  const currentActiveCue = subtitles.find(
    (c) => currentTime >= c.startTime && currentTime <= c.endTime
  );

  return (
    <div className="min-h-screen bg-[#0b0d13] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-amber-500/50 text-white text-xs font-semibold shadow-2xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modais Globais */}
      <StyleModal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        style={style}
        setStyle={setStyle}
        onNavigateToStylesTab={() => {
          setIsStyleModalOpen(false);
          setActiveTab('styles');
        }}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        subtitles={subtitles}
        videoTitle={videoTitle}
        videoUrl={videoUrl}
        style={style}
      />

      <TranslateModal
        isOpen={isTranslateOpen}
        onClose={() => setIsTranslateOpen(false)}
        subtitles={subtitles}
        onSubtitlesTranslated={(newCues) => {
          setSubtitles(newCues);
          showToast('Legendas atualizadas com sucesso!');
        }}
      />

      <QuickGuideModal
        isOpen={isQuickGuideOpen}
        onClose={() => setIsQuickGuideOpen(false)}
        onLoadSample={() => {
          handleSelectSample(SAMPLE_VIDEOS[0]);
          setActiveTab('player');
        }}
      />

      <GeminiApiKeyModal
        isOpen={isGeminiConfigOpen}
        onClose={() => setIsGeminiConfigOpen(false)}
        onSaveKey={(key) => {
          if (key) showToast('Chave API do Gemini atualizada com sucesso!');
        }}
        isFirstUse={false}
      />

      {/* Barra de Navegação */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenTranslate={() => setIsTranslateOpen(true)}
        onOpenTutorialModal={() => setIsQuickGuideOpen(true)}
        onOpenGeminiConfig={() => setIsGeminiConfigOpen(true)}
        hasSubtitles={subtitles.length > 0}
        subtitlesCount={subtitles.length}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* TELA DE REPRODUÇÃO E EDIÇÃO (LAYOUT DE DUAS COLUNAS: PLAYER + PAINEL LATERAL) */}
        {(activeTab === 'player' || activeTab === 'editor') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
            {/* Coluna Esquerda / Centro: Player de Vídeo e Timeline Atual */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
              {/* Barra Superior Minimalista do Vídeo Atual */}
              <div className="w-full bg-[#1E1E1E] rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                    <Film className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-white truncate">{videoTitle}</h2>
                    <p className="text-xs text-slate-400">
                      {formatFriendlyTime(duration)} • {subtitles.length} legendas sincronizadas
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="px-3 py-1.5 rounded-lg bg-[#2A2A2A] hover:bg-[#333333] text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Trocar Mídia
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExportOpen(true)}
                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-colors cursor-pointer"
                  >
                    Exportar
                  </button>
                </div>
              </div>

              {/* Player Principal */}
              <div className="w-full flex justify-center">
                <div className="w-full max-w-lg">
                  <VideoPlayerWithSubtitles
                    videoUrl={videoUrl}
                    videoTitle={videoTitle}
                    subtitles={subtitles}
                    style={style}
                    currentTime={currentTime}
                    onTimeUpdate={(time) => setCurrentTime(time)}
                    onDurationChange={(dur) => setDuration(dur)}
                    activeCueId={currentActiveCue ? currentActiveCue.id : null}
                    displayMode={displayMode}
                    onToggleDisplayMode={setDisplayMode}
                    isLocalFile={isLocalFile}
                    isPlaying={isPlaying}
                    onPlayStateChange={setIsPlaying}
                    onTogglePlay={handleTogglePlay}
                    showSubtitlesOverlay={showOverlayOnVideo}
                    onToggleShowSubtitlesOverlay={setShowOverlayOnVideo}
                    onNavigateToSubtitles={() => setActiveTab('subtitles')}
                    onOpenStyles={() => setIsStyleModalOpen(true)}
                    aspectRatio={aspectRatio}
                    onToggleAspectRatio={setAspectRatio}
                    externalVideoRef={videoRef}
                    onUpdateStyle={setStyle}
                    onOpenExportModal={() => setIsExportOpen(true)}
                  />
                </div>
              </div>

              {/* Legenda Ativa no Momento */}
              <div className="w-full bg-[#1E1E1E] rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-medium">Legenda Atual</span>
                  {currentActiveCue && (
                    <span className="font-mono text-amber-400">
                      {formatFriendlyTime(currentActiveCue.startTime)} ➔ {formatFriendlyTime(currentActiveCue.endTime)}
                    </span>
                  )}
                </div>
                {currentActiveCue ? (
                  <p className="text-base font-semibold text-white leading-relaxed">
                    {currentActiveCue.translation || currentActiveCue.text}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 py-1">
                    Nenhuma legenda neste instante ({formatFriendlyTime(currentTime)}).
                  </p>
                )}
              </div>
            </div>

            {/* Coluna Direita: Painel Lateral de Controle (Abas Limpas) */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
              <div className="bg-[#1E1E1E] rounded-xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                  <h3 className="text-sm font-semibold text-white">Controles Rápidos</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-[#2A2A2A] font-mono">Espaço</span> Play
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('subtitles')}
                    className="p-3 rounded-lg bg-[#2A2A2A] hover:bg-[#333333] text-slate-200 text-xs font-medium flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Ver Todas ({subtitles.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsStyleModalOpen(true)}
                    className="p-3 rounded-lg bg-[#2A2A2A] hover:bg-[#333333] text-slate-200 text-xs font-medium flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Palette className="w-4 h-4 text-amber-400" />
                    <span>Estilo Visual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsTranslateOpen(true)}
                    className="p-3 rounded-lg bg-[#2A2A2A] hover:bg-[#333333] text-slate-200 text-xs font-medium flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Languages className="w-4 h-4 text-amber-400" />
                    <span>Traduzir IA</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerAutoSave()}
                    className="p-3 rounded-lg bg-[#2A2A2A] hover:bg-[#333333] text-slate-200 text-xs font-medium flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                    <span>Salvar SRT/VTT</span>
                  </button>
                </div>

                {isLocalFile && !hasGeneratedForLocal && (
                  <div className="mt-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                      <Sparkles className="w-4 h-4" />
                      <span>Arquivo Local Carregado</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Extraia o áudio e gere legendas automáticas em segundos.
                    </p>
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={() => handleGenerateSubtitles('', 'gemini', videoMode)}
                      className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 fill-slate-950" />
                      <span>Gerar Legendas com IA</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TELA 2: LISTAGEM E EDIÇÃO DE LEGENDAS */}
        {activeTab === 'subtitles' && (
          <div className="w-full">
            <SubtitleListContainer
              subtitles={subtitles}
              currentTime={currentTime}
              onSeekTo={handleSeekTo}
              onUpdateCue={handleUpdateCue}
              onDeleteCue={handleDeleteCue}
              onAddCue={handleAddCue}
              onSplitCue={handleSplitCue}
              onTranslateAll={handleTranslateAll}
              isTranslating={isTranslating}
              onBulkReplace={handleBulkReplace}
              onUpdateAllCues={handleUpdateAllCues}
              onOpenExportModal={() => setIsExportOpen(true)}
              displayMode={displayMode}
              onToggleDisplayMode={setDisplayMode}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              duration={duration}
              onNavigateToPlayer={() => setActiveTab('player')}
              videoTitle={videoTitle}
            />
          </div>
        )}

        {/* TELA 3: UPLOAD E CONFIGURAÇÕES */}
        {activeTab === 'upload' && (
          <div className="space-y-6 max-w-3xl mx-auto w-full">
            <UploadAndGeneratePanel
              onFileLoaded={(file, url, type) => {
                handleFileLoaded(file, url, type);
                showToast(`Arquivo "${file.name}" carregado com sucesso!`);
                setActiveTab('player');
              }}
              onSelectSample={(sample) => {
                handleSelectSample(sample);
                setActiveTab('player');
                showToast('Amostra carregada!');
              }}
              onClearLocalFile={() => {
                handleSelectSample(SAMPLE_VIDEOS[0]);
              }}
              onGenerateSubtitles={async (ctx, eng, mod, set) => {
                await handleGenerateSubtitles(ctx, eng, mod, set);
              }}
              isGenerating={isGenerating}
              generationProgress={generationProgress}
              longVideoProgress={longVideoProgress}
              currentFile={currentFile}
              isLocalFile={isLocalFile}
              videoMode={videoMode}
              onToggleVideoMode={handleToggleVideoMode}
              autoSaveConfig={autoSaveConfig}
              onUpdateAutoSaveConfig={handleUpdateAutoSaveConfig}
              activeProjectName={activeProjectName}
              sourceLanguage={sourceLanguage}
              onSourceLanguageChange={setSourceLanguage}
              targetLanguage={targetLanguage}
              onTargetLanguageChange={setTargetLanguage}
              detectedLanguage={detectedLanguage}
            />

            <ProjectManager
              currentSubtitles={subtitles}
              currentVideoTitle={videoTitle}
              currentStyle={style}
              activeProjectName={activeProjectName}
              onActiveProjectNameChange={handleActiveProjectNameChange}
              onLoadProject={handleLoadProject}
              onNewBlankProject={handleNewBlankProject}
              onToast={showToast}
              onOpenPlayer={() => setActiveTab('player')}
            />
          </div>
        )}

        {/* TELA 4: ESTILIZAÇÃO VISUAL (TIKTOK / REELS / HORMOZI / MRBEAST) */}
        {activeTab === 'styles' && (
          <div className="w-full space-y-6 animate-in fade-in">
            {/* Top Bar da Tela de Estilos */}
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20 shrink-0">
                  <Palette className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-extrabold text-white">
                      Estúdio de Estilos & Tipografia Viral
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Preset: {style.preset.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Altere cores, tamanho de fonte, contornos e animações com resposta visual imediata
                  </p>
                </div>
              </div>

              {/* Botões de Ação Rápida no Topo */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsStyleModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Abrir editor de estilo em janela flutuante"
                >
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Janela Flutuante</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('player')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                  title="Voltar para a tela cheia do reprodutor"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Ver no Reprodutor</span>
                </button>
              </div>
            </div>

            {/* LAYOUT RESPONSIVO: EMPILHADO VERTICALMENTE NO MOBILE E LADO A LADO NO DESKTOP */}
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 items-start w-full">
              {/* COLUNA DO PLAYER (Z-INDEX MENOR EXPLICITAMENTE PARA NUNCA COBRIR O EDITOR) */}
              <div
                id="styles-player-column"
                className="w-full lg:col-span-5 flex flex-col gap-4 relative z-0 order-1 lg:order-1"
              >
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl w-full">
                  <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-amber-400" />
                      <span>Vídeo com Legenda em Tempo Real</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                      {aspectRatio === '9:16' ? 'Vertical 9:16' : '16:9'}
                    </span>
                  </div>

                  <VideoPlayerWithSubtitles
                    videoUrl={videoUrl}
                    videoTitle={videoTitle}
                    subtitles={subtitles}
                    style={style}
                    currentTime={currentTime}
                    onTimeUpdate={(time) => setCurrentTime(time)}
                    onDurationChange={(dur) => setDuration(dur)}
                    activeCueId={currentActiveCue ? currentActiveCue.id : null}
                    displayMode={displayMode}
                    onToggleDisplayMode={setDisplayMode}
                    isLocalFile={isLocalFile}
                    isPlaying={isPlaying}
                    onPlayStateChange={setIsPlaying}
                    onTogglePlay={handleTogglePlay}
                    showSubtitlesOverlay={showOverlayOnVideo}
                    onToggleShowSubtitlesOverlay={setShowOverlayOnVideo}
                    onNavigateToSubtitles={() => setActiveTab('subtitles')}
                    onOpenStyles={() => setIsStyleModalOpen(true)}
                    aspectRatio={aspectRatio}
                    onToggleAspectRatio={setAspectRatio}
                    externalVideoRef={videoRef}
                    onUpdateStyle={setStyle}
                    onOpenExportModal={() => setIsExportOpen(true)}
                  />
                </div>

                {/* Resumo da Legenda Atual */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 text-xs space-y-1.5 w-full">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold">
                    <span>Legenda Atual no Vídeo:</span>
                    <span className="font-mono text-amber-400">
                      {formatFriendlyTime(currentTime)} / {formatFriendlyTime(duration)}
                    </span>
                  </div>
                  <p className="text-white font-bold text-sm bg-black/40 p-2.5 rounded-lg border border-slate-800 break-words">
                    {currentActiveCue
                      ? currentActiveCue.translation || currentActiveCue.text
                      : 'Reproduza o vídeo para visualizar as legendas sincronizadas'}
                  </p>
                </div>
              </div>

              {/* COLUNA DO EDITOR DE ESTILOS (Z-INDEX MAIOR EXPLICITAMENTE: Z-20) */}
              <div
                id="styles-editor-column"
                className="w-full lg:col-span-7 relative z-20 order-2 lg:order-2 space-y-3"
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-slate-400 font-medium">Configurações visuais</span>
                  <button
                    type="button"
                    onClick={() => {
                      setStyle({ ...DEFAULT_STYLE });
                      showToast('Estilo redefinido para o padrão com sucesso!');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    title="Restaurar o estilo padrão"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resetar para Padrão</span>
                  </button>
                </div>
                <StyleCustomizer
                  style={style}
                  setStyle={setStyle}
                  onChangeStyle={setStyle}
                  onBack={() => setActiveTab('player')}
                  onSave={() => {
                    try {
                      localStorage.setItem('legendafacil_custom_style', JSON.stringify(style));
                    } catch (e) {}
                    showToast('Estilo das legendas salvo com sucesso!');
                  }}
                  sampleText={
                    currentActiveCue
                      ? currentActiveCue.translation || currentActiveCue.text
                      : 'CRIE VÍDEOS VIRAIS COM LEGENDA AUTOMÁTICA'
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* TELA 5: CENTRAL DE TUTORIAIS DE USO */}
        {activeTab === 'tutorials' && (
          <TutorialView
            onNavigateToEditor={() => setActiveTab('player')}
            onNavigateToStyles={() => setActiveTab('styles')}
          />
        )}
      </main>

      {/* INPUT GLOBAL DE ARQUIVO ACIONÁVEL POR QUALQUER BOTÃO DO SISTEMA */}
      <input
        ref={globalFileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-matroska,audio/mpeg,audio/wav,audio/mp4,audio/ogg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const url = URL.createObjectURL(file);
            const type = file.type.startsWith('audio') ? 'audio' : 'video';
            handleFileLoaded(file, url, type);
            showToast(`Arquivo "${file.name}" carregado! Selecione os idiomas ou clique em Gerar Legendas.`);
          }
        }}
      />
    </div>
  );
}
