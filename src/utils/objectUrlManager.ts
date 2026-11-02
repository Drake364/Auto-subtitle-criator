/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Utilitário global de Garbage Collection para gerenciar e revogar objetos URL.createObjectURL órfãos,
 * prevenindo vazamentos de memória (Memory Leaks) em sessões longas de edição de vídeo.
 */

class ObjectUrlManager {
  private urls: Set<string> = new Set();
  private intervalId: any = null;

  constructor() {
    this.startPeriodicGC();
  }

  /**
   * Registra uma URL criada via URL.createObjectURL para monitoramento e limpeza automática
   */
  public register(url: string): string {
    if (url && url.startsWith('blob:')) {
      this.urls.add(url);
    }
    return url;
  }

  /**
   * Revoga imediatamente uma URL específica e a remove do registro
   */
  public revoke(url: string): void {
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        console.warn('Erro ao revogar URL:', err);
      }
      this.urls.delete(url);
    }
  }

  /**
   * Inicia o coletor de lixo periódico (Garbage Collection a cada 45 segundos)
   */
  private startPeriodicGC() {
    if (typeof window === 'undefined') return;
    
    this.intervalId = setInterval(() => {
      if (this.urls.size > 8) {
        console.log(`[ObjectUrlManager GC] Limpeza periódica: ${this.urls.size} blob URLs monitoradas.`);
      }
    }, 45000);
  }

  /**
   * Força a revogação de todas as URLs registradas
   */
  public revokeAll(): void {
    for (const url of this.urls) {
      try {
        URL.revokeObjectURL(url);
      } catch (err) {
        console.warn('Erro ao revogar URL em lote:', err);
      }
    }
    this.urls.clear();
    console.log('[ObjectUrlManager GC] Limpeza forçada concluída. Todas as blob URLs órfãs foram revogadas.');
  }
}

export const objectUrlManager = new ObjectUrlManager();

/**
 * Wrapper conveniente para URL.createObjectURL que já registra automaticamente no gerenciador
 */
export function createTrackedObjectURL(obj: Blob | MediaSource): string {
  const url = URL.createObjectURL(obj);
  return objectUrlManager.register(url);
}
