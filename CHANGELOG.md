# Changelog - LegendaFácil AI

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

## [1.2.0] - 2026-10-24

### 🚀 Novidades e Funcionalidades Principais
- **Arquitetura 100% Client-Side (Netlify Ready):** Remoção completa da dependência do servidor backend Express (`server.ts` / rotas `/api/*`), permitindo hospedagem estática direta e sem custos na Netlify.
- **Sistema de Tradução Multi-Instância (`LIBRE_INSTANCES`):** Implementação de um array de fallback com múltiplas instâncias públicas e gratuitas de LibreTranslate com timeout de 4.5s por requisição para tolerância a falhas.
- **Integração Whisper WebAssembly / C++ Local:** Processamento acústico offline em background thread via Web Workers, garantindo total privacidade e 0 dependência de nuvem.
- **Sistema Anti-OOM para Vídeos Longos (Podcasts / YouTube):** Fatiamento inteligente de áudio em chunks configuráveis (ex: 30s) com liberação agressiva de memória RAM e VAD (*Voice Activity Detection*) para pular silêncios.
- **Gerenciamento de Projetos e Salvamento Automático:** Persistência local (LocalStorage) e salvamento automático de arquivos `.srt`/`.vtt` sincronizados com o nome exato da mídia para uso em VLC e Smart TVs.
- **Identidade Visual Personalizada (Logotipo 3D & PWA):** Incorporação de ícone PWA de alta definição e Service Worker com estratégia *Cache-First / Stale-While-Revalidate* para uso instantâneo offline.

### 🛠️ Correções e Ajustes Técnicos
- Substituição de chamadas de API de servidor por chamadas client-side diretas usando o SDK `@google/genai` e APIs Groq/LibreTranslate.
- Correção de conflitos de otimização de dependências do Vite (resolução de erros de hook do React 19).
- Otimização do fluxo de build e sincronização automática com o repositório GitHub.
