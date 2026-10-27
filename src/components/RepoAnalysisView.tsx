import React from 'react';
import {
  Code2,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  Layers,
  Zap,
  ArrowRight,
  ExternalLink,
  Cpu,
  Smartphone,
  Sparkles,
} from 'lucide-react';

interface RepoAnalysisViewProps {
  onGoToEditor: () => void;
}

export const RepoAnalysisView: React.FC<RepoAnalysisViewProps> = ({ onGoToEditor }) => {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6">
      {/* Header do Repositório */}
      <div className="rounded-3xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 via-slate-900 to-[#0a0d14] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
              <GitBranch className="h-3.5 w-3.5" />
              <span>Análise Técnica de Engenharia Reversa</span>
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-white">
              Repositório: Serkali-sudo/auto-subtitle-generator
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Diagnóstico aprofundado da arquitetura original, gargalos encontrados e soluções
              modernas implementadas nesta versão.
            </p>
          </div>

          <a
            href="https://github.com/Serkali-sudo/auto-subtitle-generator"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
          >
            <span>Ver no GitHub</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Diagnóstico dos 4 Principais Problemas do App Original */}
      <div>
        <h2 className="text-base font-bold text-white mb-3">
          Diagnóstico dos Principais Desafios do Repositório Original
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <AlertTriangle className="h-4 w-4" />
              <span>FFmpeg-Kit Descontinuado</span>
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              O projeto usa <code>ffmpeg-kit</code> em C, que foi oficialmente arquivado pela
              comunidade e apresenta falhas graves de compilação em Android 14, 15 e arquiteturas de
              64 bits modernas.
            </p>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Cpu className="h-4 w-4" />
              <span>Peso Excessivo & Bateria</span>
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Executar o Whisper C++ no hardware do celular aquece a bateria rapidamente e limita a
              velocidade em aparelhos de entrada (leva minutos para transcrever um vídeo curto).
            </p>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Layers className="h-4 w-4" />
              <span>Interface & Layout Rígido</span>
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              O layout original não possui preview em tempo real com aspect ratio 9:16 para TikTok e
              Reels, nem permite estilizar cores neon, fontes ousadas ou animação karaokê.
            </p>
          </div>

          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <AlertTriangle className="h-4 w-4" />
              <span>Zero Monetização & Idioma Único</span>
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Não há integração com Google AdMob, Google Play Billing ou AdSense, e todo o fluxo está
              em inglês sem suporte nativo ao público brasileiro.
            </p>
          </div>
        </div>
      </div>

      {/* Matriz Comparativa: Original C++ vs Esta Versão com IA */}
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#12151e] shadow-xl">
        <div className="border-b border-slate-800 p-5">
          <h2 className="text-base font-bold text-white">Matriz Comparativa de Arquitetura</h2>
          <p className="text-xs text-slate-400">
            Diferença técnica entre o app do GitHub e o novo ecossistema
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Funcionalidade</th>
                <th className="px-5 py-3 font-semibold text-rose-300">Original (GitHub)</th>
                <th className="px-5 py-3 font-semibold text-emerald-300">
                  Nova Versão (LegendaFácil AI)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr>
                <td className="px-5 py-3.5 font-bold text-white">Motor de Transcrição</td>
                <td className="px-5 py-3.5 text-slate-400">Whisper.cpp / Vosk local em C</td>
                <td className="px-5 py-3.5 text-emerald-300 font-medium">
                  IA Gemini 2.5 Flash + Web Speech API ultra veloz
                </td>
              </tr>
              <tr>
                <td className="px-5 py-3.5 font-bold text-white">Tempo de Processamento</td>
                <td className="px-5 py-3.5 text-slate-400">2 a 5 minutos por vídeo no celular</td>
                <td className="px-5 py-3.5 text-emerald-300 font-medium">
                  2 a 5 segundos com pontuação e acentuação exatas
                </td>
              </tr>
              <tr>
                <td className="px-5 py-3.5 font-bold text-white">Localização em Português</td>
                <td className="px-5 py-3.5 text-slate-400">Apenas inglês técnico</td>
                <td className="px-5 py-3.5 text-emerald-300 font-medium">
                  100% em Português (Brasil) com tradutor para 100+ idiomas
                </td>
              </tr>
              <tr>
                <td className="px-5 py-3.5 font-bold text-white">Estilização para Redes Sociais</td>
                <td className="px-5 py-3.5 text-slate-400">Texto básico sem efeitos</td>
                <td className="px-5 py-3.5 text-emerald-300 font-medium">
                  Presets TikTok, MrBeast, Neon, Karaokê palavra por palavra
                </td>
              </tr>
              <tr>
                <td className="px-5 py-3.5 font-bold text-white">Publicação na Google Play</td>
                <td className="px-5 py-3.5 text-slate-400">
                  Complexa (requer compilação NDK e C++)
                </td>
                <td className="px-5 py-3.5 text-emerald-300 font-medium">
                  Pronta para empacotar via Bubblewrap/TWA em minutos
                </td>
              </tr>
              <tr>
                <td className="px-5 py-3.5 font-bold text-white">Monetização Google</td>
                <td className="px-5 py-3.5 text-slate-400">Nenhuma</td>
                <td className="px-5 py-3.5 text-emerald-300 font-medium">
                  Google AdSense, AdMob (Rewarded Ads) e Planos Freemium
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3 Opções Estratégicas de Modificação */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">
          3 Opções de Modificação Recomendadas para Você Seguir
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Opção 1 */}
          <div className="rounded-3xl border border-amber-500/40 bg-slate-900/60 p-5 shadow-lg">
            <div className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-300 inline-block mb-3">
              Opção 1 (Recomendada & Ativa)
            </div>
            <h3 className="text-sm font-bold text-white">Plataforma Web Studio + PWA Google</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Mantenha o app acessível na web e empacotado para a Google Play via TWA. Monetize com
              AdSense no navegador e AdMob no celular.
            </p>
            <div className="mt-4 border-t border-slate-800 pt-3">
              <span className="text-[11px] font-semibold text-emerald-400">
                ✓ Menor custo de manutenção e maior velocidade de entrega
              </span>
            </div>
          </div>

          {/* Opção 2 */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
            <div className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-300 inline-block mb-3">
              Opção 2
            </div>
            <h3 className="text-sm font-bold text-white">Refatorar App Nativo em Kotlin Compose</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Substituir o código C antigo por Kotlin moderno com Jetpack Compose no Android Studio,
              usando MediaPipe e a API oficial do Google Gemini.
            </p>
            <div className="mt-4 border-t border-slate-800 pt-3">
              <span className="text-[11px] font-semibold text-slate-400">
                ✓ Experiência nativa pura para usuários exclusivos de Android
              </span>
            </div>
          </div>

          {/* Opção 3 */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
            <div className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-300 inline-block mb-3">
              Opção 3
            </div>
            <h3 className="text-sm font-bold text-white">SaaS Freemium com Assinatura</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Criar um ecossistema online completo onde criadores de conteúdo do Brasil assinam o plano
              mensal de R$ 29,90 para legendar todos os seus vídeos do canal sem limites.
            </p>
            <div className="mt-4 border-t border-slate-800 pt-3">
              <span className="text-[11px] font-semibold text-emerald-400">
                ✓ Receita recorrente previsível com alta margem de lucro
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
