import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  Play,
  Pause,
  Clock,
  Film,
  Search,
  Languages,
  Scissors,
  ArrowRight,
  Replace,
  BookOpen,
  AlignLeft,
  List,
  Sparkles,
  FolderDown,
} from 'lucide-react';
import { SubtitleCue, SubtitleDisplayMode } from '../types';
import {
  formatFriendlyTime,
  exportToSrt,
  exportToTxt,
  downloadFile,
  downloadDualSrtFiles,
} from '../utils/subtitleUtils';

interface SubtitleListContainerProps {
  subtitles: SubtitleCue[];
  currentTime: number;
  onSeekTo: (time: number) => void;
  onUpdateCue: (
    id: string,
    newText: string,
    start?: number,
    end?: number,
    newTranslation?: string
  ) => void;
  onDeleteCue: (id: string) => void;
  onAddCue: () => void;
  onSplitCue: (id: string) => void;
  onTranslateAll: (targetLang: string) => void;
  isTranslating: boolean;
  onBulkReplace?: (findText: string, replaceText: string, caseSensitive: boolean) => void;
  onUpdateAllCues?: (cues: SubtitleCue[]) => void;
  onOpenExportModal?: () => void;
  displayMode?: SubtitleDisplayMode;
  onToggleDisplayMode?: (mode: SubtitleDisplayMode) => void;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  duration?: number;
  onNavigateToPlayer?: () => void;
  videoTitle?: string;
}

export const SubtitleListContainer: React.FC<SubtitleListContainerProps> = ({
  subtitles,
  currentTime,
  onSeekTo,
  onUpdateCue,
  onDeleteCue,
  onAddCue,
  onSplitCue,
  onTranslateAll,
  isTranslating,
  onBulkReplace,
  onUpdateAllCues,
  onOpenExportModal,
  displayMode = 'bilingual' as SubtitleDisplayMode,
  onToggleDisplayMode,
  isPlaying,
  onTogglePlay,
  duration,
  onNavigateToPlayer,
  videoTitle,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'timeline' | 'article'>('timeline');
  const [copied, setCopied] = useState(false);
  const [showTranslateDropdown, setShowTranslateDropdown] = useState(false);

  // Painel de Busca & Substituição em Massa
  const [showReplacePanel, setShowReplacePanel] = useState(false);
  const [replaceFindText, setReplaceFindText] = useState('');
  const [replaceWithText, setReplaceWithText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [replaceSuccessCount, setReplaceSuccessCount] = useState<number | null>(null);

  // Filtragem de Legendas com base na busca
  const filteredSubtitles = subtitles.filter((cue) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesEn = cue.text.toLowerCase().includes(term);
    const matchesPt = cue.translation ? cue.translation.toLowerCase().includes(term) : false;
    return matchesEn || matchesPt;
  });

  // Contagem de ocorrências para Substituição em Massa
  const occurrencesCount = replaceFindText.trim()
    ? subtitles.reduce((count, cue) => {
        const full = `${cue.text} ${cue.translation || ''}`;
        const text = caseSensitive ? full : full.toLowerCase();
        const search = caseSensitive ? replaceFindText : replaceFindText.toLowerCase();
        const matches = text.split(search).length - 1;
        return count + matches;
      }, 0)
    : 0;

  // Executar Substituição em Massa
  const handleExecuteBulkReplace = () => {
    if (!replaceFindText.trim()) return;

    if (onBulkReplace) {
      onBulkReplace(replaceFindText, replaceWithText, caseSensitive);
    } else if (onUpdateAllCues) {
      const updated = subtitles.map((cue) => {
        const regex = new RegExp(
          replaceFindText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          caseSensitive ? 'g' : 'gi'
        );
        return {
          ...cue,
          text: cue.text.replace(regex, replaceWithText),
          translation: cue.translation ? cue.translation.replace(regex, replaceWithText) : undefined,
        };
      });
      onUpdateAllCues(updated);
    }

    setReplaceSuccessCount(occurrencesCount);
    setTimeout(() => {
      setReplaceSuccessCount(null);
    }, 3000);
  };

  // Estatísticas
  const totalWords = subtitles.reduce(
    (acc, cue) => acc + (cue.translation || cue.text).trim().split(/\s+/).filter(Boolean).length,
    0
  );
  const readingTimeMin = Math.max(1, Math.ceil(totalWords / 150));

  const hasUntranslatedCues = subtitles.some((c) => !c.translation || c.translation.trim() === '');
  const hasAnyTranslation = subtitles.some((c) => Boolean(c.translation));

  const handleCopyTranscription = () => {
    const fullText = exportToTxt(subtitles, displayMode);
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleQuickDownloadDual = () => {
    downloadDualSrtFiles(subtitles, 'minhas-legendas');
  };

  return (
    <div
      id="subtitles-container"
      className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col h-full shadow-xl"
    >
      {/* BARRA DE CONTROLE DE REPRODUÇÃO EM TELA SEPARADA */}
      {onTogglePlay && (
        <div
          id="subtitles-playback-bar"
          className="mb-4 bg-slate-950/95 border border-amber-500/30 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg"
        >
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
            <button
              type="button"
              id="btn-subtitles-play-pause"
              onClick={onTogglePlay}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer shrink-0"
              title={isPlaying ? 'Pausar reprodução do vídeo' : 'Iniciar reprodução do vídeo'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              <span className="text-xs">{isPlaying ? 'Pausar' : 'Reproduzir'}</span>
            </button>

            <button
              type="button"
              onClick={() => onSeekTo(Math.max(0, currentTime - 5))}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition-colors cursor-pointer"
              title="Voltar 5 segundos"
            >
              -5s
            </button>

            <button
              type="button"
              onClick={() => onSeekTo(Math.min(duration || 100, currentTime + 5))}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition-colors cursor-pointer"
              title="Avançar 5 segundos"
            >
              +5s
            </button>

            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300 shrink-0 ml-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-white font-bold">{formatFriendlyTime(currentTime)}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-400">{formatFriendlyTime(duration || 0)}</span>
            </div>
          </div>

          {/* Barra de Linha do Tempo / Scrubber */}
          <div className="flex-1 w-full flex items-center gap-2 px-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.05}
              value={currentTime}
              onChange={(e) => onSeekTo(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:h-2.5 transition-all"
              title="Arrastar para qualquer segundo do vídeo"
            />
          </div>

          {/* Botão de navegação para voltar ao Reprodutor */}
          {onNavigateToPlayer && (
            <button
              type="button"
              id="btn-subtitles-go-player"
              onClick={onNavigateToPlayer}
              className="w-full md:w-auto px-3.5 py-2 rounded-lg bg-gradient-to-r from-slate-800 to-slate-800/90 hover:from-amber-500/20 hover:to-amber-500/10 text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 hover:border-amber-500/40 transition-all cursor-pointer shadow-sm shrink-0"
              title="Voltar para a tela do player de vídeo"
            >
              <Film className="w-4 h-4 text-amber-400" />
              <span>Ver no Reprodutor 🎬</span>
            </button>
          )}
        </div>
      )}

      {/* HEADER DO CONTAINER DE LEGENDAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/90">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>Legendas & Tradução</span>
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-semibold border border-slate-700">
              {subtitles.length} {subtitles.length === 1 ? 'bloco' : 'blocos'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {totalWords} palavras • ~{readingTimeMin} min de fala • Áudio em Inglês com suporte a PT-BR
          </p>
        </div>

        {/* CONTROLES SUPERIORES */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Alternador de Idioma de Exibição */}
          {onToggleDisplayMode && (
            <div className="bg-slate-950 p-0.5 rounded-xl border border-slate-800 flex items-center text-xs">
              <button
                type="button"
                onClick={() => onToggleDisplayMode('bilingual')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  displayMode === 'bilingual'
                    ? 'bg-sky-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Exibir ambas as legendas (Inglês e Português)"
              >
                <span>🌐 Bilíngue</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleDisplayMode('translated')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  displayMode === 'translated'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Exibir apenas a tradução em Português"
              >
                <span>🇧🇷 PT</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleDisplayMode('original')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  displayMode === 'original'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Exibir apenas o áudio original em Inglês"
              >
                <span>🇺🇸 EN</span>
              </button>
            </div>
          )}

          {/* Alternador de Modo: Linha do Tempo vs Artigo Corrido */}
          <div className="bg-slate-950 p-0.5 rounded-xl border border-slate-800 flex items-center text-xs">
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'timeline'
                  ? 'bg-slate-800 text-amber-300 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Modo blocos com timestamps"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Blocos</span>
            </button>
            <button
              onClick={() => setViewMode('article')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'article'
                  ? 'bg-slate-800 text-amber-300 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Modo texto contínuo"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Artigo</span>
            </button>
          </div>

          {/* Botão Substituir em Massa */}
          <button
            type="button"
            onClick={() => setShowReplacePanel(!showReplacePanel)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              showReplacePanel
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
            title="Substituir palavras em massa"
          >
            <Replace className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Substituir</span>
          </button>

          {/* Botão Traduzir para Português */}
          <div className="relative">
            <button
              id="btn-open-translate"
              onClick={() => onTranslateAll('pt-BR')}
              disabled={isTranslating || subtitles.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
              title="Traduzir legendas do inglês para português"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{isTranslating ? 'Traduzindo...' : 'Traduzir p/ PT-BR'}</span>
            </button>
          </div>

          {/* Copiar Texto */}
          <button
            onClick={handleCopyTranscription}
            disabled={subtitles.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all shadow-sm disabled:opacity-50"
            title="Copiar texto de todas as falas"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>

          {/* Botão Principal de Exportar */}
          <button
            id="btn-open-export-modal"
            onClick={onOpenExportModal}
            disabled={subtitles.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Abrir opções de salvamento do SRT traduzido ou de ambas as legendas"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar SRT</span>
          </button>
        </div>
      </div>

      {/* BANNER PROATIVO DE TRADUÇÃO (SE ÁUDIO EM INGLÊS DETECTADO) */}
      {subtitles.length > 0 && hasUntranslatedCues && !isTranslating && (
        <div className="mt-3 p-3 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-slate-950 to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🇺🇸 ➔ 🇧🇷</span>
            <div>
              <p className="font-bold text-white flex items-center gap-1.5">
                <span>Áudio em Inglês detectado!</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                  Tradução PT-BR Disponível
                </span>
              </p>
              <p className="text-slate-300 text-[11px] mt-0.5">
                Gere a tradução em Português para baixar o <strong>SRT Traduzido</strong> ou o{' '}
                <strong>Pacote com as Duas Legendas</strong> (Inglês + Português).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onTranslateAll('pt-BR')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span>Traduzir para Português</span>
          </button>
        </div>
      )}

      {/* ATALHO RÁPIDO: BAIXAR AMBOS OS ARQUIVOS SRT */}
      {hasAnyTranslation && (
        <div className="mt-2.5 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-300 flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Legendas Original (EN) e Traduzida (PT-BR) sincronizadas e prontas.</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickDownloadDual}
              className="text-sky-400 hover:text-sky-300 font-bold text-[11px] flex items-center gap-1 hover:underline cursor-pointer"
              title="Baixar rapidamente ambos os arquivos .srt"
            >
              <FolderDown className="w-3.5 h-3.5" />
              <span>Baixar as 2 Legendas (.srt)</span>
            </button>
          </div>
        </div>
      )}

      {/* PAINEL COLAPSÁVEL DE BUSCA & SUBSTITUIÇÃO EM MASSA */}
      {showReplacePanel && (
        <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2.5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Replace className="w-3.5 h-3.5" />
              <span>Substituição em Massa (Em todo o vídeo)</span>
            </span>
            <span className="text-[11px] text-slate-400">
              {occurrencesCount} {occurrencesCount === 1 ? 'ocorrência encontrada' : 'ocorrências encontradas'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Palavra ou termo a buscar..."
              value={replaceFindText}
              onChange={(e) => setReplaceFindText(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400"
            />
            <input
              type="text"
              placeholder="Substituir por..."
              value={replaceWithText}
              onChange={(e) => setReplaceWithText(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-amber-400 text-amber-500"
              />
              <span>Diferenciar maiúsculas/minúsculas</span>
            </label>

            <div className="flex items-center gap-2">
              {replaceSuccessCount !== null && (
                <span className="text-xs text-emerald-400 font-semibold animate-pulse">
                  ✓ {replaceSuccessCount} blocos atualizados!
                </span>
              )}
              <button
                type="button"
                onClick={handleExecuteBulkReplace}
                disabled={!replaceFindText.trim() || occurrencesCount === 0}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 text-xs font-extrabold shadow transition-all cursor-pointer"
              >
                Substituir Tudo ({occurrencesCount})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BARRA DE PESQUISA RÁPIDA & ADICIONAR BLOCO */}
      <div className="flex items-center gap-2 my-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar palavra ou frase (em inglês ou português)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-amber-400 transition-colors"
          />
        </div>

        <button
          id="btn-add-cue"
          onClick={onAddCue}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all whitespace-nowrap shadow-sm cursor-pointer"
          title="Inserir um novo bloco de legenda"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span>+ Adicionar Bloco</span>
        </button>
      </div>

      {/* VISUALIZAÇÃO 1: MODO LINHA DO TEMPO */}
      {viewMode === 'timeline' && (
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[480px] min-h-[220px]">
          {filteredSubtitles.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
              <FileText className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-400">Nenhuma legenda encontrada</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                {searchTerm
                  ? 'Tente buscar por outro termo ou limpe a busca.'
                  : 'Carregue um vídeo/áudio ou use a amostra para editar legendas.'}
              </p>
            </div>
          ) : (
            filteredSubtitles.map((cue, index) => {
              const isActive = currentTime >= cue.startTime && currentTime <= cue.endTime;
              const hasTranslation = Boolean(cue.translation && cue.translation.trim().length > 0);

              return (
                <div
                  key={cue.id}
                  id={`cue-item-${cue.id}`}
                  className={`group relative p-3.5 rounded-xl border transition-all duration-150 ${
                    isActive
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/30'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950/90'
                  }`}
                >
                  {/* Barra Superior do Bloco */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    {/* Timestamp & Botão de Saltar no Vídeo */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSeekTo(cue.startTime)}
                        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                        }`}
                        title="Pular vídeo para este segundo"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>{formatFriendlyTime(cue.startTime)}</span>
                        <span>➔</span>
                        <span>{formatFriendlyTime(cue.endTime)}</span>
                      </button>

                      <span className="text-[10px] text-slate-500 font-mono">#{index + 1}</span>

                      {isActive && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase tracking-wide animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Tocando Agora
                        </span>
                      )}
                    </div>

                    {/* Ações do Bloco: Dividir e Deletar */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onSplitCue(cue.id)}
                        className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Dividir frase em duas partes"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteCue(cue.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Remover este bloco"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* CAMPOS DE TEXTO ADAPTADOS AO MODO DE EXIBIÇÃO */}
                  {displayMode === 'bilingual' ? (
                    <div className="space-y-2">
                      {/* Linha 1: Áudio Original em Inglês */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-400 flex items-center gap-1">
                            <span>🇺🇸</span>
                            <span>Áudio Original (Inglês):</span>
                          </span>
                        </div>
                        <textarea
                          value={cue.text}
                          rows={1}
                          onChange={(e) =>
                            onUpdateCue(cue.id, e.target.value, cue.startTime, cue.endTime, cue.translation)
                          }
                          className="w-full p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200 font-medium focus:outline-hidden focus:border-amber-400 transition-colors resize-none leading-relaxed"
                          placeholder="Texto falado em inglês..."
                        />
                      </div>

                      {/* Linha 2: Tradução em Português */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-emerald-400 flex items-center gap-1">
                            <span>🇧🇷</span>
                            <span>Tradução (Português PT-BR):</span>
                          </span>
                          {!hasTranslation && (
                            <button
                              type="button"
                              onClick={() => onTranslateAll('pt-BR')}
                              className="text-amber-400 hover:underline font-semibold"
                            >
                              Traduzir com IA
                            </button>
                          )}
                        </div>
                        <textarea
                          value={cue.translation || ''}
                          rows={1}
                          onChange={(e) =>
                            onUpdateCue(cue.id, cue.text, cue.startTime, cue.endTime, e.target.value)
                          }
                          className="w-full p-2 rounded-lg bg-slate-900/90 border border-emerald-500/30 text-xs text-white font-medium focus:outline-hidden focus:border-emerald-400 transition-colors resize-none leading-relaxed"
                          placeholder="Tradução em português (clique em 'Traduzir p/ PT-BR' para gerar automaticamente)..."
                        />
                      </div>
                    </div>
                  ) : displayMode === 'translated' ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <span>🇧🇷</span>
                          <span>Português (Traduzido)</span>
                        </span>
                        <span className="text-[10px] text-slate-500 truncate max-w-[200px]" title={cue.text}>
                          Original: "{cue.text}"
                        </span>
                      </div>
                      <textarea
                        value={cue.translation || cue.text}
                        rows={2}
                        onChange={(e) =>
                          onUpdateCue(cue.id, cue.text, cue.startTime, cue.endTime, e.target.value)
                        }
                        className="w-full p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-100 font-medium focus:outline-hidden focus:border-amber-400 transition-colors resize-none leading-relaxed"
                        placeholder="Tradução em português..."
                      />
                    </div>
                  ) : (
                    // MODO ORIGINAL (EN)
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-amber-300 flex items-center gap-1">
                          <span>🇺🇸</span>
                          <span>Inglês (Áudio Original)</span>
                        </span>
                      </div>
                      <textarea
                        value={cue.text}
                        rows={2}
                        onChange={(e) =>
                          onUpdateCue(cue.id, e.target.value, cue.startTime, cue.endTime, cue.translation)
                        }
                        className="w-full p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-100 font-medium focus:outline-hidden focus:border-amber-400 transition-colors resize-none leading-relaxed"
                        placeholder="Texto falado em inglês..."
                      />
                    </div>
                  )}

                  {/* Micro-ajustes de tempo */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>Início:</span>
                      <button
                        onClick={() =>
                          onUpdateCue(
                            cue.id,
                            cue.text,
                            Math.max(0, Number((cue.startTime - 0.2).toFixed(1))),
                            cue.endTime,
                            cue.translation
                          )
                        }
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] cursor-pointer"
                      >
                        -0.2s
                      </button>
                      <button
                        onClick={() =>
                          onUpdateCue(
                            cue.id,
                            cue.text,
                            Number((cue.startTime + 0.2).toFixed(1)),
                            cue.endTime,
                            cue.translation
                          )
                        }
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] cursor-pointer"
                      >
                        +0.2s
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span>Fim:</span>
                      <button
                        onClick={() =>
                          onUpdateCue(
                            cue.id,
                            cue.text,
                            cue.startTime,
                            Math.max(cue.startTime + 0.2, Number((cue.endTime - 0.2).toFixed(1))),
                            cue.translation
                          )
                        }
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] cursor-pointer"
                      >
                        -0.2s
                      </button>
                      <button
                        onClick={() =>
                          onUpdateCue(
                            cue.id,
                            cue.text,
                            cue.startTime,
                            Number((cue.endTime + 0.2).toFixed(1)),
                            cue.translation
                          )
                        }
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] cursor-pointer"
                      >
                        +0.2s
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VISUALIZAÇÃO 2: MODO TEXTO CORRIDO */}
      {viewMode === 'article' && (
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[480px] min-h-[220px] p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Visualização Corrida ({displayMode === 'bilingual' ? 'Bilíngue' : displayMode === 'translated' ? 'Português' : 'Inglês'})</span>
            </span>
            <button
              onClick={() => {
                const txt = exportToTxt(subtitles, displayMode);
                downloadFile(txt, `transcricao-${displayMode}.txt`, 'text/plain');
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              <Download className="w-3 h-3 text-amber-400" />
              <span>Baixar TXT</span>
            </button>
          </div>

          <div className="space-y-3 leading-relaxed text-sm text-slate-200">
            {subtitles.map((cue) => {
              const isActive = currentTime >= cue.startTime && currentTime <= cue.endTime;

              return (
                <div
                  key={cue.id}
                  onClick={() => onSeekTo(cue.startTime)}
                  className={`p-2.5 rounded-lg cursor-pointer transition-all ${
                    isActive
                      ? 'bg-amber-500/10 border-l-2 border-amber-400 text-amber-200'
                      : 'hover:bg-slate-900 text-slate-300'
                  }`}
                  title="Clique para saltar no vídeo"
                >
                  <span className="font-mono text-[11px] text-amber-400/80 mr-2 select-none">
                    [{formatFriendlyTime(cue.startTime)}]
                  </span>
                  {displayMode === 'bilingual' ? (
                    <span className="space-y-1 inline-block">
                      <span className="block text-slate-300 font-medium">{cue.text}</span>
                      <span className="block text-emerald-400 font-semibold text-xs">
                        PT: {cue.translation || cue.text}
                      </span>
                    </span>
                  ) : displayMode === 'translated' ? (
                    <span>{cue.translation || cue.text}</span>
                  ) : (
                    <span>{cue.text}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DICA DE RODAPÉ */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Salvamento de SRT Traduzido, Original e Bilíngue com 1 clique</span>
        </span>
        <button
          onClick={onOpenExportModal}
          className="text-amber-400 hover:underline font-bold"
        >
          Opções de Exportação ➔
        </button>
      </div>
    </div>
  );
};
