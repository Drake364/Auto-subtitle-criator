# Changelog - LegendaFácil AI

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

## [1.3.0] - 2026-10-27

### 🚀 Novidades e Melhorias de Produção
- **Arquitetura BFF Segura (Express + TypeScript Strict):** Refatoração completa do backend com limite de payload de 25MB, timeout global de 60s, guardas de API e proteção de chaves sensíveis.
- **Resiliência e Timeout em Chamadas Gemini:** Adição de `AbortController` (45s timeout) em `executeWithRetryAndFallback`, remoção de fallbacks falsos (`success: true` em catch blocks) e tratamento robusto de erros transientes.
- **Estratégia Híbrida de Service Worker (PWA):** Nova estratégia Network-First para navegação e `index.html` com Cache-First para assets estáticos e controle manual de atualização de versão.
- **Higiene Rigorosa de Tipagem (TypeScript Strict):** Ativação de `strict: true` e remoção de erros de tipagem em componentes e utilitários.

## [1.2.0] - 2026-10-24

### 🚀 Novidades e Funcionalidades Principais
- **Sistema de Tradução Multi-Instância (`LIBRE_INSTANCES`):** Implementação de um array de fallback com múltiplas instâncias públicas e gratuitas de LibreTranslate com timeout de 4.5s por requisição para tolerância a falhas.
- **Sistema Anti-OOM para Vídeos Longos (Podcasts / YouTube):** Fatiamento inteligente de áudio em chunks configuráveis com liberação agressiva de memória RAM e VAD.
- **Gerenciamento de Projetos e Salvamento Automático:** Persistência local (LocalStorage) e salvamento automático de arquivos `.srt`/`.vtt`.
- **Identidade Visual Personalizada (Logotipo 3D & PWA):** Incorporação de ícone PWA e Service Worker.

### 🛠️ Correções e Ajustes Técnicos
- Otimização do fluxo de build e sincronização automática com o repositório GitHub.
