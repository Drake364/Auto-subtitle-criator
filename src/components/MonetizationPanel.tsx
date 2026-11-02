import React, { useState } from 'react';
import {
  DollarSign,
  Smartphone,
  Globe,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
  Tag,
} from 'lucide-react';
import { MONETIZATION_PLANS } from '../data/sampleData';

export const MonetizationPanel: React.FC = () => {
  // Simulador de receita
  const [dailyUsers, setDailyUsers] = useState<number>(3500);
  const [cpmRate, setCpmRate] = useState<number>(12); // R$ por mil visualizações de anúncios
  const [proSubscribers, setProSubscribers] = useState<number>(85); // assinantes Pro pagantes

  // Cálculos de estimativa mensal
  const monthlyAdImpressions = dailyUsers * 30 * 2.5; // média 2.5 impressões por usuário
  const monthlyAdRevenue = (monthlyAdImpressions / 1000) * cpmRate;
  const monthlySubRevenue = proSubscribers * 29.9; // R$ 29.90/mês
  const totalMonthlyRevenue = monthlyAdRevenue + monthlySubRevenue;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6">
      {/* Banner Principal de Negócios */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900 to-[#0a0d14] p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            <DollarSign className="h-3.5 w-3.5" />
            <span>Monetização no Google & Estratégia de Faturamento</span>
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Como Publicar na Google Play e Ganhar Dinheiro com Seu App de Legendas
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            O mercado de legendagem automática para redes sociais movimenta bilhões de visualizações
            por dia. Conheça o modelo de receita com <strong>Google AdSense</strong>,{' '}
            <strong>Google AdMob</strong> e <strong>Assinaturas Freemium</strong>.
          </p>
        </div>
      </div>

      {/* Grid: Publicação na Google Play vs Google AdSense/AdMob */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Coluna 1: Publicação Google Play Store */}
        <div className="rounded-3xl border border-slate-800 bg-[#12151e] p-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Publicação na Google Play Store</h2>
              <p className="text-xs text-slate-400">Passo a passo com PWA / Trusted Web Activity</p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-slate-900/60 p-3.5 border border-slate-800/80">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-300">
                1
              </div>
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white">Criar Conta no Google Play Console:</span>
                <p className="mt-0.5 text-slate-400">
                  Taxa única de US$ 25 para cadastrar sua conta de desenvolvedor oficial Google.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-slate-900/60 p-3.5 border border-slate-800/80">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-300">
                2
              </div>
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white">Empacotar com Google Bubblewrap (CLI):</span>
                <p className="mt-0.5 text-slate-400">
                  Gere o arquivo Android (.AAB) diretamente da aplicação web sem necessidade de
                  reescrever em Java/Kotlin.
                </p>
                <div className="mt-2 rounded bg-slate-950 p-2 font-mono text-[10px] text-amber-300">
                  npx @bubblewrap/cli build
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-slate-900/60 p-3.5 border border-slate-800/80">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-300">
                3
              </div>
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white">Ficha da Loja Otimizada (ASO):</span>
                <p className="mt-0.5 text-slate-400">
                  Use palavras-chave como &quot;Gerador de Legendas&quot;, &quot;Legendas para
                  TikTok&quot;, &quot;Auto Subtitles&quot; para alcançar os primeiros lugares de busca
                  orgânica.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna 2: Google AdSense & Google AdMob */}
        <div className="rounded-3xl border border-slate-800 bg-[#12151e] p-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Formatos de Anúncios Google</h2>
              <p className="text-xs text-slate-400">Como posicionar anúncios para faturar alto</p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">1. Anúncio Premiado (Rewarded Ad)</span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  Maior CPM (R$ 20 - R$ 50)
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                O usuário assiste a um vídeo publicitário de 15 segundos para liberar o download do
                vídeo sem marca d&apos;água ou tradução em alta resolução. O usuário ganha o benefício e
                você recebe o pagamento do anunciante.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">2. Intersticial entre Ações</span>
                <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                  CPM Médio
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Aparece na tela de carregamento enquanto a IA gera as legendas ou no momento que a
                exportação do arquivo .SRT é concluída.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">3. Banner Responsivo</span>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                  Passivo Contínuo
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Posicionado discretamente no rodapé ou na barra lateral do editor web sem atrapalhar a
                edição de vídeo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Simulador Interativo de Faturamento */}
      <div className="rounded-3xl border border-slate-800 bg-[#12151e] p-6 sm:p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Simulador de Receita Mensal Estimada</h2>
              <p className="text-xs text-slate-400">
                Ajuste os controles deslizantes para simular ganhos com Anúncios Google + Assinaturas
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-right">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              Faturamento Estimado / Mês
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              R$ {totalMonthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-200/70">
              ≈ US$ {(totalMonthlyRevenue / 5.6).toFixed(0)} dólares
            </span>
          </div>
        </div>

        {/* Sliders do Simulador */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Usuários Diários */}
          <div className="space-y-2 rounded-2xl bg-slate-900/60 p-4 border border-slate-800/80">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>Usuários Diários Ativos</span>
              <span className="font-mono text-amber-400">{dailyUsers.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={500}
              max={30000}
              step={500}
              value={dailyUsers}
              onChange={(e) => setDailyUsers(Number(e.target.value))}
              className="w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-amber-500 h-1.5"
            />
            <p className="text-[11px] text-slate-500">
              Impressões estimadas: {(monthlyAdImpressions).toLocaleString()} / mês
            </p>
          </div>

          {/* CPM Médio */}
          <div className="space-y-2 rounded-2xl bg-slate-900/60 p-4 border border-slate-800/80">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>CPM Médio (AdMob/AdSense)</span>
              <span className="font-mono text-emerald-400">R$ {cpmRate},00</span>
            </div>
            <input
              type="range"
              min={5}
              max={35}
              step={1}
              value={cpmRate}
              onChange={(e) => setCpmRate(Number(e.target.value))}
              className="w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-emerald-500 h-1.5"
            />
            <p className="text-[11px] text-slate-500">
              Receita de anúncios: R$ {monthlyAdRevenue.toFixed(2)}
            </p>
          </div>

          {/* Assinantes Pro */}
          <div className="space-y-2 rounded-2xl bg-slate-900/60 p-4 border border-slate-800/80">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>Assinantes Criador Pro</span>
              <span className="font-mono text-sky-400">{proSubscribers} assinantes</span>
            </div>
            <input
              type="range"
              min={0}
              max={500}
              step={5}
              value={proSubscribers}
              onChange={(e) => setProSubscribers(Number(e.target.value))}
              className="w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-sky-500 h-1.5"
            />
            <p className="text-[11px] text-slate-500">
              Receita de assinaturas: R$ {monthlySubRevenue.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Modelos de Planos Freemium */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-white">Tabela de Preços Recomendada (Freemium)</h2>
          <p className="text-xs text-slate-400">
            Como estruturar a oferta para maximizar a conversão de criadores no Brasil e no exterior
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {MONETIZATION_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-3xl border p-6 transition-all ${
                plan.recommended
                  ? 'border-amber-400 bg-gradient-to-b from-amber-500/10 via-slate-900 to-[#12151e] shadow-2xl shadow-amber-500/10'
                  : 'border-slate-800 bg-[#12151e]'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-950 shadow-md">
                  Recomendado para Usuários
                </div>
              )}

              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-extrabold text-white">{plan.name}</h3>
                <p className="mt-1 text-xs text-slate-400">{plan.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">{plan.price}</span>
                </div>
              </div>

              <div className="my-5 flex-1 space-y-2.5">
                {plan.features.map((f, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full rounded-xl py-2.5 text-xs font-bold transition-transform hover:scale-[1.02] ${
                  plan.recommended
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {plan.id === 'free' ? 'Plano Atual Ativo' : 'Ativar Integração de Faturamento'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Mockup de Banner AdSense / AdMob em Ação */}
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-4 text-center">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
          <span className="flex items-center gap-1 font-mono">
            <Tag className="h-3 w-3 text-amber-400" />
            Exemplo de Bloco de Anúncio Google AdSense (Responsivo)
          </span>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px]">Anúncio</span>
        </div>
        <div className="flex h-16 w-full items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>
              <strong>Espaço Publicitário Google AdSense:</strong> Exibido automaticamente para
              usuários gratuitos gerando faturamento passivo diário.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
