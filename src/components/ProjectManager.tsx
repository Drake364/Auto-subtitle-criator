import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FolderPlus,
  FolderOpen,
  Save,
  Trash2,
  Download,
  Search,
  Check,
  Clock,
  Film,
  FileText,
  AlertTriangle,
  Plus,
  RotateCcw,
  UploadCloud,
  FileDown,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { SavedProject, SubtitleCue, SubtitleStyle } from '../types';
import {
  saveProjectToStorage,
  loadProjectFromStorage,
  listAllProjectsFromStorage,
  deleteProjectFromStorage,
  exportAllProjectsBackupJson,
  importProjectsBackupJson,
} from '../utils/projectStorage';
import { exportToSrt, exportToVtt, downloadFile, getCleanVideoBaseName } from '../utils/subtitleUtils';

interface ProjectManagerProps {
  currentSubtitles: SubtitleCue[];
  currentVideoTitle: string;
  currentStyle?: SubtitleStyle;
  onLoadProject: (project: SavedProject) => void;
  onNewBlankProject?: () => void;
  activeProjectName?: string | null;
  onActiveProjectNameChange?: (name: string | null) => void;
  onToast?: (message: string) => void;
  className?: string;
  onOpenPlayer?: () => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  currentSubtitles,
  currentVideoTitle,
  currentStyle,
  onLoadProject,
  onNewBlankProject,
  activeProjectName = null,
  onActiveProjectNameChange,
  onToast,
  className = '',
  onOpenPlayer,
}) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [projectNameInput, setProjectNameInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('legendafacil_autosync_projects');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const fileBackupInputRef = useRef<HTMLInputElement | null>(null);

  // Recarrega a lista de projetos salvos do localStorage
  const refreshProjectsList = () => {
    const list = listAllProjectsFromStorage();
    setProjects(list);
  };

  useEffect(() => {
    refreshProjectsList();
  }, []);

  // Preenche o input do nome com o projeto ativo ou com o nome do vídeo atual
  useEffect(() => {
    if (activeProjectName) {
      setProjectNameInput(activeProjectName);
    } else if (currentVideoTitle && !projectNameInput) {
      const clean = getCleanVideoBaseName(currentVideoTitle);
      setProjectNameInput(`Projeto - ${clean}`);
    }
  }, [activeProjectName, currentVideoTitle]);

  // Sincronização automática com debounce caso o usuário esteja trabalhando em um projeto ativo
  useEffect(() => {
    if (!autoSyncEnabled || !activeProjectName || currentSubtitles.length === 0) return;

    const timer = setTimeout(() => {
      try {
        saveProjectToStorage(
          activeProjectName,
          currentVideoTitle,
          currentSubtitles,
          currentStyle
        );
        refreshProjectsList();
      } catch (err) {
        console.warn('Erro na autosincronização do projeto:', err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [currentSubtitles, currentVideoTitle, currentStyle, activeProjectName, autoSyncEnabled]);

  const handleToggleAutoSync = (enabled: boolean) => {
    setAutoSyncEnabled(enabled);
    try {
      localStorage.setItem('legendafacil_autosync_projects', JSON.stringify(enabled));
    } catch {}
    if (onToast) {
      onToast(
        enabled
          ? 'Sincronização automática ativada: edições serão salvas no projeto ativo.'
          : 'Sincronização automática desativada.'
      );
    }
  };

  // Salvar estado atual no localStorage indexado pelo nome do projeto
  const handleSaveProject = (customName?: string) => {
    const nameToUse = (customName || projectNameInput).trim();
    if (!nameToUse) {
      if (onToast) onToast('Digite um nome para o projeto.');
      return;
    }

    if (currentSubtitles.length === 0) {
      if (onToast) onToast('Aviso: o projeto será salvo sem legendas.');
    }

    setIsSaving(true);
    try {
      const saved = saveProjectToStorage(
        nameToUse,
        currentVideoTitle,
        currentSubtitles,
        currentStyle
      );
      refreshProjectsList();
      if (onActiveProjectNameChange) {
        onActiveProjectNameChange(saved.projectName);
      }
      if (onToast) {
        onToast(`Projeto "${saved.projectName}" salvo com sucesso no navegador!`);
      }
    } catch (err: any) {
      if (onToast) onToast(`Erro ao salvar: ${err?.message || 'Falha no localStorage'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Salvar como novo projeto com nome diferenciado
  const handleSaveAsNew = () => {
    const defaultNewName = `${projectNameInput || 'Projeto'} (Cópia)`;
    const newName = window.prompt('Digite o nome para o novo projeto:', defaultNewName);
    if (newName && newName.trim()) {
      setProjectNameInput(newName.trim());
      handleSaveProject(newName.trim());
    }
  };

  // Carregar um projeto salvo
  const handleLoad = (project: SavedProject) => {
    // Se havia um projeto ativo diferente com alterações não salvas e autosync desligado, salva antes
    if (activeProjectName && activeProjectName !== project.projectName && !autoSyncEnabled) {
      const confirmSwitch = window.confirm(
        `Deseja carregar "${project.projectName}"? Seu trabalho atual em "${activeProjectName}" pode ser substituído se não estiver salvo.`
      );
      if (!confirmSwitch) return;
    }

    onLoadProject(project);
    if (onActiveProjectNameChange) {
      onActiveProjectNameChange(project.projectName);
    }
    setProjectNameInput(project.projectName);
    if (onToast) {
      onToast(`Projeto "${project.projectName}" carregado! (${project.cueCount} legendas)`);
    }
  };

  // Deletar um projeto
  const handleConfirmDelete = (projectName: string) => {
    const success = deleteProjectFromStorage(projectName);
    if (success) {
      if (activeProjectName?.toLowerCase() === projectName.toLowerCase()) {
        if (onActiveProjectNameChange) onActiveProjectNameChange(null);
      }
      refreshProjectsList();
      setProjectToDelete(null);
      if (onToast) onToast(`Projeto "${projectName}" removido com sucesso.`);
    } else {
      if (onToast) onToast('Erro ao remover o projeto.');
    }
  };

  // Iniciar um trabalho limpo
  const handleStartBlank = () => {
    const confirmed = window.confirm(
      'Deseja iniciar um novo projeto em branco? Suas legendas atuais permanecerão salvas na lista caso já tenha salvo este projeto.'
    );
    if (!confirmed) return;

    if (onNewBlankProject) {
      onNewBlankProject();
    }
    if (onActiveProjectNameChange) {
      onActiveProjectNameChange(null);
    }
    setProjectNameInput('');
    if (onToast) onToast('Novo projeto em branco iniciado.');
  };

  // Download rápido direto do card
  const handleQuickDownload = (project: SavedProject, format: 'srt' | 'vtt') => {
    const content =
      format === 'srt'
        ? exportToSrt(project.subtitles, 'translated')
        : exportToVtt(project.subtitles, 'translated');
    const cleanBase = getCleanVideoBaseName(project.videoTitle || project.projectName);
    downloadFile(content, `${cleanBase}.${format}`, format === 'srt' ? 'text/plain' : 'text/vtt');
    if (onToast) {
      onToast(`Download de "${cleanBase}.${format}" iniciado!`);
    }
  };

  // Backup JSON
  const handleExportBackup = () => {
    const jsonStr = exportAllProjectsBackupJson();
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(jsonStr, `backup-legendas-projetos-${dateStr}.json`, 'application/json');
    if (onToast) onToast('Backup de todos os projetos exportado com sucesso!');
  };

  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const res = importProjectsBackupJson(text);
        refreshProjectsList();
        if (onToast) {
          onToast(
            `Restauração concluída: ${res.imported} projetos importados${
              res.errors > 0 ? ` (${res.errors} ignorados)` : ''
            }.`
          );
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filtragem dos projetos salvos
  const filteredProjects = projects.filter((p) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      p.projectName.toLowerCase().includes(query) ||
      p.videoTitle.toLowerCase().includes(query) ||
      (p.previewText && p.previewText.toLowerCase().includes(query))
    );
  });

  const formatTimestamp = (ms: number) => {
    if (!ms) return 'Data desconhecida';
    try {
      const d = new Date(ms);
      return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } catch {
      return 'Data recente';
    }
  };

  return (
    <div
      id="project-manager-panel"
      className={`bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4.5 ${className}`}
    >
      {/* CABEÇALHO DO GERENCIADOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Persistência & Biblioteca Local
            </span>
            {activeProjectName && (
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Trabalho Atual: {activeProjectName}
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mt-1">
            <Folder className="w-5 h-5 text-amber-400" />
            <span>Gerenciador de Projetos (Minhas Legendas)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Grave suas legendas no navegador sem risco de perdê-las ao fechar a página. Alterne entre múltiplos trabalhos com um clique.
          </p>
        </div>

        {/* CONTROLES DE BACKUP E NOVO PROJETO */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <input
            type="file"
            ref={fileBackupInputRef}
            onChange={handleImportBackupFile}
            accept=".json"
            className="hidden"
          />

          <button
            type="button"
            id="btn-import-projects-backup"
            onClick={() => fileBackupInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Restaurar projetos a partir de arquivo de backup JSON"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restaurar</span>
          </button>

          <button
            type="button"
            id="btn-export-projects-backup"
            onClick={handleExportBackup}
            disabled={projects.length === 0}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Exportar todos os projetos em um único arquivo de backup JSON"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Backup</span>
          </button>

          <button
            type="button"
            id="btn-new-blank-project"
            onClick={handleStartBlank}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Começar um novo projeto em branco"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo</span>
          </button>
        </div>
      </div>

      {/* ÁREA DE SALVAMENTO DO PROJETO ATUAL */}
      <div className="p-3.5 rounded-xl bg-slate-950/75 border border-slate-800 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <FolderPlus className="w-4 h-4 text-amber-400" />
              Salvar Trabalho Atual:
            </span>
            <span className="text-[11px] text-slate-400">
              ({currentSubtitles.length} legendas • {currentVideoTitle || 'Sem vídeo vinculado'})
            </span>
          </div>

          <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSyncEnabled}
              onChange={(e) => handleToggleAutoSync(e.target.checked)}
              className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
            />
            <span>Auto-sincronizar edições</span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              id="input-project-name"
              value={projectNameInput}
              onChange={(e) => setProjectNameInput(e.target.value)}
              placeholder="Digite o nome do projeto (ex: Aula 01, Entrevista, Short #4)..."
              className="w-full pl-3 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {projectNameInput && (
              <button
                type="button"
                onClick={() => setProjectNameInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-save-current-project"
              onClick={() => handleSaveProject()}
              disabled={isSaving || !projectNameInput.trim()}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{activeProjectName === projectNameInput.trim() ? 'Atualizar Projeto' : 'Salvar Projeto'}</span>
            </button>

            {activeProjectName && (
              <button
                type="button"
                id="btn-save-as-new-project"
                onClick={handleSaveAsNew}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                title="Salvar como um novo projeto separado"
              >
                <span>Duplicar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTA DE PROJETOS SALVOS */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              Projetos Salvos ({projects.length})
            </h3>
            {projects.length > 0 && (
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Armazenado com segurança no seu navegador
              </span>
            )}
          </div>

          {/* Campo de Busca */}
          {projects.length > 1 && (
            <div className="relative min-w-[200px] sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="input-search-saved-projects"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar projeto ou vídeo..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}
        </div>

        {/* ESTADO VAZIO */}
        {projects.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
              <Folder className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-300">
              Nenhum projeto salvo no momento
            </p>
            <p className="text-[11px] text-slate-500 max-w-md">
              Digite um nome no campo acima e clique em <strong>"Salvar Projeto"</strong> para registrar o estado atual das suas legendas. Você poderá alternar e voltar a ele quando quiser.
            </p>
            {currentSubtitles.length > 0 && (
              <button
                type="button"
                id="btn-quick-seed-project"
                onClick={() => handleSaveProject('Meu Primeiro Projeto')}
                className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Salvar legendas atuais como "Meu Primeiro Projeto"</span>
              </button>
            )}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/30 text-center text-xs text-slate-400">
            Nenhum projeto encontrado para a busca "{searchQuery}".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {filteredProjects.map((proj) => {
              const isActive = activeProjectName?.toLowerCase() === proj.projectName.toLowerCase();
              const isConfirmingDelete = projectToDelete === proj.projectName;

              return (
                <div
                  key={proj.projectName}
                  id={`project-card-${encodeURIComponent(proj.projectName)}`}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    isActive
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  {/* Topo do Card: Nome e Badges */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          <Folder className="w-4 h-4" />
                        </div>
                        <h4
                          className="text-xs sm:text-sm font-bold text-white truncate"
                          title={proj.projectName}
                        >
                          {proj.projectName}
                        </h4>
                      </div>

                      {isActive && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 shrink-0 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Ativo
                        </span>
                      )}
                    </div>

                    {/* Detalhes do Vídeo e Quantidade de Legendas */}
                    <div className="mt-2 space-y-1 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5 truncate">
                        <Film className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">Vídeo: {proj.videoTitle}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                          <FileText className="w-3 h-3 text-amber-400" />
                          {proj.cueCount} {proj.cueCount === 1 ? 'legenda' : 'legendas'}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimestamp(proj.updatedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Preview das Falas */}
                    {proj.previewText && (
                      <div className="mt-2 p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 text-[10px] text-slate-300 italic line-clamp-2">
                        "{proj.previewText}"
                      </div>
                    )}
                  </div>

                  {/* Ações do Card */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {isConfirmingDelete ? (
                      <div className="flex items-center justify-between w-full bg-red-950/40 p-1.5 rounded-lg border border-red-500/40 animate-in fade-in">
                        <span className="text-[10px] text-red-300 font-semibold">Excluir projeto?</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleConfirmDelete(proj.projectName)}
                            className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] cursor-pointer"
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setProjectToDelete(null)}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
                          >
                            Não
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          {/* Download rápido SRT */}
                          <button
                            type="button"
                            onClick={() => handleQuickDownload(proj, 'srt')}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer transition-colors"
                            title="Baixar arquivo .SRT deste projeto"
                          >
                            .SRT
                          </button>
                          {/* Download rápido VTT */}
                          <button
                            type="button"
                            onClick={() => handleQuickDownload(proj, 'vtt')}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer transition-colors"
                            title="Baixar arquivo .VTT deste projeto"
                          >
                            .VTT
                          </button>

                          {/* Botão de Excluir */}
                          <button
                            type="button"
                            onClick={() => setProjectToDelete(proj.projectName)}
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
                            title="Excluir este projeto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Botão Carregar Projeto */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            id={`btn-load-project-${encodeURIComponent(proj.projectName)}`}
                            onClick={() => handleLoad(proj)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                              isActive
                                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm shadow-amber-500/20'
                            }`}
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            <span>{isActive ? 'Recarregar' : 'Abrir'}</span>
                          </button>

                          {onOpenPlayer && (
                            <button
                              type="button"
                              onClick={() => {
                                handleLoad(proj);
                                onOpenPlayer();
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                              title="Abrir diretamente no Reprodutor"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
