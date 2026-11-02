# LegendaFácil AI 🎬✨
### Gerador e Editor Profissional de Legendas com Inteligência Artificial

[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini AI](https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285f4?logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

O **LegendaFácil AI** é uma plataforma web completa, responsiva e de alta performance para geração, edição, estilização e exportação de legendas automáticas em vídeos curtos e longos, utilizando modelos multimodais de inteligência artificial de última geração (**Google Gemini 2.5 Flash**).

Projetado especialmente para criadores de conteúdo (TikTok, Instagram Reels, YouTube Shorts, Podcasts e Cursos Online), o sistema oferece transcrição fonética com timestamps precisos, tradução direta para Português (ou qualquer outro idioma), estilos visuais dinâmicos (estilo Hormozi/MrBeast) e proteção nativa anti-travamento para vídeos longos.

---

## 🚀 Principais Funcionalidades

### 1. Modos Especializados de Vídeo
- 📱 **Modo Vídeos Curtos (Reels, TikTok, Shorts):**
  - Otimizado para vídeos verticais e horizontais de até 90 segundos.
  - Processamento ultra-rápido com sincronização imediata.
- 🎬 **Modo Vídeos Longos (Podcasts, YouTube, Aulas):**
  - Projetado para conteúdos extensos (5 min, 30 min, 1 hora ou mais).
  - **Fatiamento em blocos com proteção Anti-OOM (Out Of Memory):** O arquivo de áudio é fatiado e transmitido progressivamente sem alocar arquivos gigantes na memória RAM do navegador ou do dispositivo móvel.
- 🛡️ **Auto-detecção Inteligente de Duração e Tamanho:**
  - O sistema detecta automaticamente vídeos com mais de 90 segundos ou arquivos maiores que 25MB e ativa o Modo Longo com proteção sem que o usuário precise se preocupar.

### 2. Inteligência Artificial Multilíngue (Google Gemini)
- Transcreve com alta fidelidade a partir de arquivos de vídeo (`.mp4`, `.webm`, `.mov`, `.mkv`) e áudio (`.mp3`, `.wav`, `.m4a`, `.ogg`).
- **Detecção Automática de Idioma Falado:** Identifica Italiano, Inglês, Espanhol, Francês, Alemão, Japonês ou Português.
- **Tradução Direta Sincronizada:** Traduz para o Português mantendo rigorosamente a cadência temporal e as pausas originais da fala.
- **Filtragem de Ruído e Pontuação Inteligente:** Pontuação natural, remoção de hesitações e formatação legível.

### 3. Estilos Visuais Profissionais (Estilo Viral)
- **TikTok / Hormozi:** Tipografia Montserrat Extra Bold, caixa alta, realce em amarelo vibrante e fundo escuro contrastante.
- **MrBeast Impact:** Tipografia marcante com contorno espesso para máxima retenção de atenção.
- **Minimalista Moderno:** Clean, discreto, elegante e ideal para vídeos corporativos e entrevistas.
- **Neon / Cyberpunk:** Cores vibrantes em ciano e magenta com acabamento futurista.
- **Elegante / Cinema:** Tipografia com serifa suave e espaçamento refinado para documentários.
- **Karaokê Dinâmico:** Realce de palavras no tempo exato da pronúncia.

### 4. Editor e Sincronizador Interativo
- Reprodução com sincronismo em tempo real das legendas sobrepostas ao vídeo.
- Edição de texto rápida em linha clicando em qualquer frase ou palavra.
- Ajuste fino de tempo (*offset* global de atraso ou adiantamento em milissegundos).
- Adição, exclusão e reordenação de blocos de legenda diretamente na interface.

### 5. Exportação Multi-formato
- **SRT (SubRip):** Padrão universal para YouTube, Premiere, DaVinci Resolve, Final Cut e VLC.
- **VTT (WebVTT):** Padrão moderno para navegadores web e players HTML5.
- **JSON:** Estrutura completa de dados com timestamps e metadados para integrações e automações.
- **Texto Simples (TXT):** Transcrição corrida limpa, ideal para resumos, artigos de blog ou roteiros.

---

## 🛠️ Tecnologias Utilizadas

| Camada | Tecnologia | Finalidade |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript | Interface declarativa reativa e type-safe |
| **Build & Dev** | Vite 6 | Servidor de desenvolvimento ultrarrápido e empacotamento otimizado |
| **Estilização** | Tailwind CSS v4 | Utilitários modernos de layout e paleta de alto contraste |
| **Ícones** | Lucide React | Conjunto consistente e leve de ícones vetoriais |
| **Animações** | Motion (Framer Motion) | Micro-interações e transições fluidas de estado |
| **Backend / API** | Node.js + Express + TSX | Servidor de orquestração e proxy seguro para chamadas de IA |
| **Motor de IA** | `@google/genai` (Gemini 2.5 Flash) | Transcrição de áudio, segmentação temporal e tradução |
| **Processamento de Áudio** | Web Audio API / AudioContext | Extração nativa de áudio PCM, downsampling para 16kHz e codificação WAV em streaming |

---

## 📋 Pré-requisitos

Para executar o projeto localmente, certifique-se de ter instalado:
- **Node.js** (versão 18.0.0 ou superior — recomendado Node 20 LTS ou 22)
- Gerenciador de pacotes **npm** (incluso com o Node) ou **yarn** / **pnpm** / **bun**
- Uma chave de API do **Google Gemini** (gratuita através do [Google AI Studio](https://aistudio.google.com/))

---

## ⚙️ Instalação e Execução Local

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/legendafacil-ai.git
cd legendafacil-ai
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto a partir do exemplo fornecido:
```bash
cp .env.example .env
```

Abra o arquivo `.env` e insira sua chave da API do Gemini:
```env
# Chave de API da Google GenAI (obtenha em https://aistudio.google.com/)
GEMINI_API_KEY=sua_chave_gemini_aqui

# URL da aplicação (em desenvolvimento local, padrão: http://localhost:3000)
APP_URL=http://localhost:3000
```

### 4. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```

Acesse o aplicativo no seu navegador em: **`http://localhost:3000`**

---

## 📦 Scripts Disponíveis no `package.json`

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento Vite ouvindo em `0.0.0.0:3000` |
| `npm run build` | Compila os arquivos de produção para a pasta `dist/` |
| `npm run start` | Executa o servidor Express full-stack com `tsx server.ts` |
| `npm run lint` | Executa a verificação estática de tipos com o TypeScript (`tsc --noEmit`) |
| `npm run preview` | Inicializa a pré-visualização local dos arquivos compilados em `dist/` |
| `npm run clean` | Remove as pastas temporárias de compilação (`dist`, `server.js`) |

---

## 📂 Estrutura de Diretórios

```plaintext
├── .env.example                     # Modelo de variáveis de ambiente
├── .gitignore                       # Arquivos ignorados pelo Git
├── index.html                       # Ponto de entrada HTML com metatags e tipografia
├── metadata.json                    # Metadados e permissões da aplicação
├── package.json                     # Dependências e scripts do projeto
├── server.ts                        # Servidor Express com integração Vite middleware
├── tsconfig.json                    # Configurações do compilador TypeScript
├── vite.config.ts                   # Configurações do Vite e plugins
│
├── server/
│   ├── apiRouter.ts                 # Rotas /api da aplicação (transcrição Gemini, modelos)
│   └── gemini.ts                    # Conexão segura e lazy initialization do GoogleGenAI
│
├── src/
│   ├── main.tsx                     # Ponto de inicialização do React no DOM
│   ├── App.tsx                      # Componente raiz com orquestração de estado e abas
│   ├── index.css                    # Folha de estilo global com Tailwind CSS
│   ├── types.ts                     # Interfaces TypeScript (Legendas, Modos, Estilos)
│   ├── data/
│   │   └── sampleData.ts            # Vídeos e legendas de demonstração
│   ├── components/
│   │   ├── ActionDockFooter.tsx     # Barra de ações rápidas no rodapé com seletor de modo
│   │   ├── CreativeStepper.tsx      # Indicador do fluxo criativo (Passos 1 a 4)
│   │   ├── FirstUseHero.tsx         # Painel inicial de boas-vindas e seleção de vídeo
│   │   ├── Navbar.tsx               # Barra de navegação superior e status do sistema
│   │   ├── QuickGuideModal.tsx      # Modal de tutoriais e guia de boas práticas
│   │   ├── SubtitleEditor.tsx       # Editor de texto e sincronismo das legendas
│   │   ├── StyleCustomizer.tsx      # Seletor e customizador de estilos visuais
│   │   ├── ExportModal.tsx          # Exportador de arquivos (SRT, VTT, JSON, TXT)
│   │   ├── VideoPlayer.tsx          # Reprodutor com renderização das legendas em tempo real
│   │   └── UploadAndGeneratePanel.tsx # Painel de upload avançado e opções de IA
│   └── utils/
│       ├── audioExtractor.ts        # Extração de áudio, WAV 16kHz e proteção Anti-OOM
│       ├── localTranscriber.ts      # Cliente de transcrição e fallback inteligente
│       └── subtitleParser.ts        # Utilitários de conversão SRT, VTT e JSON
│
```

## 🤝 Como Contribuir

Contribuições são muito bem-vindas! Se você deseja sugerir novos recursos, relatar problemas ou enviar melhorias:
1. Consulte o arquivo [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes sobre as diretrizes de contribuição e convenções de código.
2. Abra uma *Issue* detalhando sua proposta ou bug encontrado.
3. Crie um *Fork* do projeto, implemente suas alterações e envie um *Pull Request*.

---

## 📄 Licença

Este projeto está licenciado sob os termos da **Licença MIT** — consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<p align="center">
  Desenvolvido com foco em alta performance e experiência do usuário para criadores de conteúdo.
</p>
