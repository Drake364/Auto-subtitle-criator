import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Play,
  Scissors,
  Search,
  Clock,
  Wand2,
  FileText,
  Upload,
} from 'lucide-react';
import { SubtitleCue } from '../types';
import { formatTimeSeconds, generateWordTimings, parseSrt } from '../utils/subtitleUtils';

interface SubtitleTimelineProps {
  subtitles: SubtitleCue[];
  setSubtitles: React.Dispatch<React.SetStateAction<SubtitleCue[]>>;
  currentTime: number;
  onSeek: (time: number) => void;
  onAutoGenerateWithAI: () => void;
  isGeneratingAI: boolean;
}

export const SubtitleTimeline: React.FC<SubtitleTimelineProps> = ({
  subtitles,
  setSubtitles,
  currentTime,
  onSeek,
  onAutoGenerateWithAI,
  isGeneratingAI,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll] = useState(true);

  // Filtra legendas pelo termo de busca
  const filteredCues = subtitles.filter((cue) =>
    cue.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTextChange = (id: string, newText: string) => {
    setSubtitles((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            text: newText,
            words: generateWordTimings(newText, c.startTime, c.endTime),
          };
        }
        return c;
      })
    );
  };

  const handleTimeChange = (id: string, field: 'startTime' | 'endTime', value: number) => {
    setSubtitles((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, [field]: Math.max(0, value) };
          // Garante startTime < endTime
          if (field === 'startTime' && updated.startTime >= updated.endTime) {
            updated.endTime = updated.startTime + 1.0;
          }
          if (field === 'endTime' && updated.endTime <= updated.startTime) {
            updated.startTime = Math.max(0, updated.endTime - 1.0);
          }
          updated.words = generateWordTimings(updated.text, updated.startTime, updated.endTime);
          return updated;
        }
        return c;
      })
    );
  };

  const handleAddCue = () => {
    const lastCue = subtitles[subtitles.length - 1];
    const newStart = lastCue ? lastCue.endTime + 0.2 : currentTime;
    const newEnd = newStart + 2.5;
    const newCue: SubtitleCue = {
      id: `cue-${Date.now()}`,
      startTime: Number(newStart.toFixed(2)),
      endTime: Number(newEnd.toFixed(2)),
      text: 'Nova fala ou texto legendado...',
      words: generateWordTimings('Nova fala ou texto legendado...', newStart, newEnd),
    };
    setSubtitles((prev) => [...prev, newCue]);
    onSeek(newStart);
  };

  const handleDeleteCue = (id: string) => {
    setSubtitles((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSplitCue = (cue: SubtitleCue) => {
    const midTime = (cue.startTime + cue.endTime) / 2;
    const words = cue.text.split(' ');
    const half = Math.ceil(words.length / 2);
    const text1 = words.slice(0, half).join(' ');
    const text2 = words.slice(half).join(' ');

    const cue1: SubtitleCue = {
      ...cue,
      endTime: Number(midTime.toFixed(2)),
      text: text1,
      words: generateWordTimings(text1, cue.startTime, midTime),
    };

    const cue2: SubtitleCue = {
      id: `cue-${Date.now()}`,
      startTime: Number(midTime.toFixed(2)),
      endTime: cue.endTime,
      text: text2 || 'Continuação...',
      words: generateWordTimings(text2 || 'Continuação...', midTime, cue.endTime),
    };

    setSubtitles((prev) => {
      const idx = prev.findIndex((c) => c.id === cue.id);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1, cue1, cue2);
      return next;
    });
  };

  const handleImportSrtFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        const parsed = parseSrt(content);
        if (parsed.length > 0) {
          setSubtitles(parsed);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-800 bg-[#12151e] p-4 shadow-xl">
      {/* Header & Quick Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Linha do Tempo</h2>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-amber-400">
              {subtitles.length} {subtitles.length === 1 ? 'bloco' : 'blocos'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Clique em qualquer trecho para pular direto no vídeo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botão de Transcrição Inteligente com IA */}
          <button
            id="btn-ai-transcribe"
            onClick={onAutoGenerateWithAI}
            disabled={isGeneratingAI}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-bold text-slate-950 transition-all hover:brightness-110 shadow-sm shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Wand2 className={`h-3.5 w-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
            <span>{isGeneratingAI ? 'Gerando com IA...' : 'Gerar com IA'}</span>
          </button>

          {/* Adicionar Bloco Manual */}
          <button
            id="btn-add-cue"
            onClick={handleAddCue}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-amber-400 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5 text-amber-400" />
            <span>Adicionar</span>
          </button>

          {/* Importar SRT existente */}
          <label
            htmlFor="import-srt-input"
            className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
            title="Importar arquivo de legenda .SRT"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Importar SRT</span>
            <input
              id="import-srt-input"
              type="file"
              accept=".srt"
              className="hidden"
              onChange={handleImportSrtFile}
            />
          </label>
        </div>
      </div>

      {/* Search Input Filter */}
      <div className="relative my-3">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
        <input
          id="search-subtitle-input"
          type="text"
          placeholder="Buscar palavra ou frase nas legendas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-1.5 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
      </div>

      {/* Subtitles List Container */}
      <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
        {filteredCues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
            <FileText className="mb-2 h-10 w-10 text-slate-600" />
            <p className="text-sm font-medium text-slate-300">Nenhuma legenda encontrada</p>
            <p className="mt-1 text-xs text-slate-500">
              Clique em &quot;Gerar com IA&quot; ou adicione uma manualmente para começar.
            </p>
          </div>
        ) : (
          filteredCues.map((cue, index) => {
            const isActive = currentTime >= cue.startTime && currentTime <= cue.endTime;

            return (
              <div
                key={cue.id}
                id={`cue-item-${cue.id}`}
                className={`group relative rounded-xl border p-3 transition-all duration-200 ${
                  isActive
                    ? 'border-amber-400/80 bg-amber-500/10 shadow-lg shadow-amber-500/5'
                    : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {/* Top bar of cue: index, time range, actions */}
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      onClick={() => onSeek(cue.startTime)}
                      className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded text-[10px] font-extrabold ${
                        isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                      title="Pular para este segundo"
                    >
                      {index + 1}
                    </span>

                    {/* Quick Seek Play Button */}
                    <button
                      onClick={() => onSeek(cue.startTime)}
                      className="flex items-center gap-1 text-[11px] font-mono text-slate-300 hover:text-amber-300"
                      title="Reproduzir a partir deste trecho"
                    >
                      <Play className="h-3 w-3 fill-current text-amber-400" />
                      <span>{formatTimeSeconds(cue.startTime)}</span>
                      <span className="text-slate-500">→</span>
                      <span>{formatTimeSeconds(cue.endTime)}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    {/* Botão de dividir cue */}
                    <button
                      onClick={() => handleSplitCue(cue)}
                      className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-amber-300"
                      title="Dividir frase em duas legendas"
                    >
                      <Scissors className="h-3.5 w-3.5" />
                    </button>

                    {/* Excluir */}
                    <button
                      onClick={() => handleDeleteCue(cue.id)}
                      className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-400"
                      title="Excluir este bloco"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtitle text textarea */}
                <textarea
                  value={cue.text}
                  rows={2}
                  onChange={(e) => handleTextChange(cue.id, e.target.value)}
                  className="w-full resize-none rounded-lg border border-transparent bg-slate-950/60 p-2 text-xs font-medium text-slate-100 placeholder-slate-600 transition-colors focus:border-amber-500/50 focus:bg-slate-950 focus:outline-none"
                  placeholder="Digite a fala deste momento..."
                />

                {/* Time adjustment precision sliders */}
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-slate-500" />
                    <span>Início:</span>
                    <button
                      onClick={() =>
                        handleTimeChange(cue.id, 'startTime', cue.startTime - 0.2)
                      }
                      className="rounded bg-slate-800 px-1 py-0.5 text-[10px] text-slate-300 hover:text-white"
                      title="Adiantar 0.2s"
                    >
                      -0.2s
                    </button>
                    <button
                      onClick={() =>
                        handleTimeChange(cue.id, 'startTime', cue.startTime + 0.2)
                      }
                      className="rounded bg-slate-800 px-1 py-0.5 text-[10px] text-slate-300 hover:text-white"
                      title="Atrasar 0.2s"
                    >
                      +0.2s
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span>Fim:</span>
                    <button
                      onClick={() =>
                        handleTimeChange(cue.id, 'endTime', cue.endTime - 0.2)
                      }
                      className="rounded bg-slate-800 px-1 py-0.5 text-[10px] text-slate-300 hover:text-white"
                    >
                      -0.2s
                    </button>
                    <button
                      onClick={() =>
                        handleTimeChange(cue.id, 'endTime', cue.endTime + 0.2)
                      }
                      className="rounded bg-slate-800 px-1 py-0.5 text-[10px] text-slate-300 hover:text-white"
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
    </div>
  );
};
