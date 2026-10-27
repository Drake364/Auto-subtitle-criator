import { SavedProject, SubtitleCue, SubtitleStyle } from '../types';

const STORAGE_INDEX_KEY = 'legendafacil_projects_index';
const STORAGE_PREFIX = 'legendafacil_project_';

/**
 * Normaliza a chave indexadora para o localStorage baseada no nome do projeto
 */
export function getProjectStorageKey(projectName: string): string {
  const safeName = encodeURIComponent(projectName.trim().toLowerCase());
  return `${STORAGE_PREFIX}${safeName}`;
}

/**
 * Retorna a lista de nomes de projetos cadastrados no índice
 */
export function getProjectNamesIndex(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Erro ao ler índice de projetos:', err);
    return [];
  }
}

/**
 * Atualiza o índice de nomes de projetos
 */
function saveProjectNamesIndex(names: string[]): void {
  try {
    const unique = Array.from(new Set(names.map((n) => n.trim()).filter(Boolean)));
    localStorage.setItem(STORAGE_INDEX_KEY, JSON.stringify(unique));
  } catch (err) {
    console.error('Erro ao gravar índice de projetos:', err);
  }
}

/**
 * Gera um preview resumido das primeiras falas para rápida identificação
 */
export function generateProjectPreview(cues: SubtitleCue[]): string {
  if (!cues || cues.length === 0) return 'Sem legendas';
  const first = cues.slice(0, 3).map((c) => c.translation || c.text).filter(Boolean);
  return first.join(' • ');
}

/**
 * Salva um projeto no localStorage indexado pelo nome do projeto
 */
export function saveProjectToStorage(
  projectName: string,
  videoTitle: string,
  subtitles: SubtitleCue[],
  style?: SubtitleStyle,
  existingId?: string
): SavedProject {
  const trimmedName = projectName.trim();
  if (!trimmedName) {
    throw new Error('O nome do projeto não pode ser vazio.');
  }

  const key = getProjectStorageKey(trimmedName);
  const now = Date.now();

  // Verificar se já existia para manter o createdAt original
  let originalCreatedAt = now;
  try {
    const existingRaw = localStorage.getItem(key);
    if (existingRaw) {
      const existing = JSON.parse(existingRaw) as SavedProject;
      if (existing && existing.createdAt) {
        originalCreatedAt = existing.createdAt;
      }
    }
  } catch {}

  const project: SavedProject = {
    id: existingId || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    projectName: trimmedName,
    videoTitle: videoTitle.trim() || 'Vídeo sem título',
    subtitles: Array.isArray(subtitles) ? subtitles : [],
    style,
    cueCount: Array.isArray(subtitles) ? subtitles.length : 0,
    createdAt: originalCreatedAt,
    updatedAt: now,
    previewText: generateProjectPreview(subtitles),
  };

  // 1. Salvar o projeto na chave indexada pelo nome
  localStorage.setItem(key, JSON.stringify(project));

  // 2. Atualizar o índice de projetos
  const currentNames = getProjectNamesIndex();
  if (!currentNames.some((n) => n.toLowerCase() === trimmedName.toLowerCase())) {
    saveProjectNamesIndex([...currentNames, trimmedName]);
  }

  return project;
}

/**
 * Carrega um projeto específico pelo nome
 */
export function loadProjectFromStorage(projectName: string): SavedProject | null {
  try {
    const key = getProjectStorageKey(projectName);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as SavedProject;
  } catch (err) {
    console.error(`Erro ao carregar projeto "${projectName}":`, err);
    return null;
  }
}

/**
 * Lista todos os projetos salvos no localStorage, ordenados pelo mais recente
 */
export function listAllProjectsFromStorage(): SavedProject[] {
  const names = getProjectNamesIndex();
  const projects: SavedProject[] = [];

  for (const name of names) {
    const proj = loadProjectFromStorage(name);
    if (proj) {
      projects.push(proj);
    }
  }

  // Ordenar decrescente por updatedAt
  return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Deleta um projeto do localStorage e remove do índice
 */
export function deleteProjectFromStorage(projectName: string): boolean {
  try {
    const key = getProjectStorageKey(projectName);
    localStorage.removeItem(key);

    const names = getProjectNamesIndex();
    const updated = names.filter((n) => n.toLowerCase() !== projectName.trim().toLowerCase());
    saveProjectNamesIndex(updated);
    return true;
  } catch (err) {
    console.error(`Erro ao deletar projeto "${projectName}":`, err);
    return false;
  }
}

/**
 * Exporta todos os projetos como arquivo JSON para backup
 */
export function exportAllProjectsBackupJson(): string {
  const projects = listAllProjectsFromStorage();
  return JSON.stringify(
    {
      app: 'LegendaFácil AI',
      exportedAt: new Date().toISOString(),
      version: 1,
      totalProjects: projects.length,
      projects,
    },
    null,
    2
  );
}

/**
 * Importa projetos a partir de um backup JSON
 */
export function importProjectsBackupJson(jsonString: string): { imported: number; errors: number } {
  try {
    const parsed = JSON.parse(jsonString);
    const projectsList: SavedProject[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.projects)
      ? parsed.projects
      : [];

    let count = 0;
    let errors = 0;

    for (const p of projectsList) {
      if (p && p.projectName && Array.isArray(p.subtitles)) {
        try {
          saveProjectToStorage(
            p.projectName,
            p.videoTitle || 'Vídeo importado',
            p.subtitles,
            p.style,
            p.id
          );
          count++;
        } catch {
          errors++;
        }
      } else {
        errors++;
      }
    }

    return { imported: count, errors };
  } catch (err) {
    console.error('Erro ao importar backup JSON de projetos:', err);
    return { imported: 0, errors: 1 };
  }
}
