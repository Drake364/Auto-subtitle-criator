import React, { useState } from 'react';
import {
  DollarSign,
  Smartphone,
  Globe,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Zap,
  TrendingUp,
  CreditCard,
  Layers,
  Copy,
  Check,
} from 'lucide-react';
import { MONETIZATION_PLANS } from '../data/sampleData';

interface MonetizationViewProps {
  currentPlan: 'free' | 'creator' | 'business';
  onSelectPlan: (planId: 'free' | 'creator' | 'business') => void;
}

export const MonetizationView: React.FC<MonetizationViewProps> = ({
  currentPlan,
  onSelectPlan,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Monetização no Ecossistema Google</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Como Publicar na Google Play e Faturar com o App
            </h2>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Transforme este gerador de legendas em um produto digital lucrativo utilizando o Google AdMob, Google AdSense e assinaturas recorrentes via Google Play Billing.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center text-center shrink-0 min-w-[200px]">
            <span className="text-xs text-slate-400 font-medium">Seu Plano Atual no App</span>
            <span className="text-xl font-extrabold text-amber-400 mt-1 uppercase">
              {currentPlan === 'free' ? 'Gratuito' : currentPlan === 'creator' ? 'Criador Pro' : 'Agência'}
            </span>
            <span className="text-[11px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Status Ativo</span>
            </span>
          </div>
        </div>
      </div>

      {/* PLANOS DE ASSINATURA FREEMIUM (SIMULADOR DE MONETIZAÇÃO) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <span>Estrutura de Preços & Planos (Google Play Billing)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Modelo comprovado de alta conversão: plano grátis com anúncios + versão Pro sem anúncios e recursos ilimitados
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MONETIZATION_PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-5 sm:p-6 flex flex-col justify-between relative transition-all ${
                  plan.recommended
                    ? 'bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-950 border-amber-500/60 shadow-xl shadow-amber-500/10 ring-1 ring-amber-400/40'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                    Mais Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-base text-white">{plan.name}</h4>
                    {plan.adSupported && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        Com Anúncios
                      </span>
                    )}
                  </div>
                  <div className="mt-3 mb-1">
                    <span className="text-2xl sm:text-3xl font-black text-white">{plan.price}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">{plan.description}</p>

                  <ul className="space-y-2 border-t border-slate-800 pt-4 text-xs text-slate-300">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => onSelectPlan(plan.id)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all ${
                      isCurrent
                        ? 'bg-slate-800 text-slate-400 cursor-default border border-slate-700'
                        : plan.recommended
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
                        : 'bg-slate-800 hover:bg-slate-700 text-white active:scale-95'
                    }`}
                  >
                    {isCurrent ? 'Plano Selecionado' : 'Simular Escolha do Plano'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GUIA DE PUBLICAÇÃO NA GOOGLE PLAY STORE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <span>Guia Passo a Passo: Publicar na Google Play Store</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Como empacotar esta aplicação em um arquivo Android (.AAB) usando a tecnologia oficial do Google (Trusted Web Activity - TWA).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h4 className="font-bold text-sm text-white">Criar Conta no Google Play Console</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Acesse <code>play.google.com/console</code> e crie uma conta de desenvolvedor do Google (taxa única vitalícia de $25).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">
              2
            </span>
            <h4 className="font-bold text-sm text-white">Gerar o Android App (.AAB) com Bubblewrap</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              A ferramenta oficial do Google cria a chave de assinatura e gera o pacote compilado pronto para a Play Store:
            </p>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-amber-300">
              <code>bubblewrap init --manifest=manifest.json</code>
              <button
                onClick={() => copyCode('npm i -g @bubblewrap/cli && bubblewrap init', 1)}
                className="p-1 text-slate-400 hover:text-white"
              >
                {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">
              3
            </span>
            <h4 className="font-bold text-sm text-white">Integrar Google AdMob (Anúncios)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Crie uma conta no AdMob (<code>admob.google.com</code>) e adicione um Bloco Recompensado (Rewarded Video): o usuário assiste 1 anúncio de 15s para desbloquear uma exportação sem limite!
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">
              4
            </span>
            <h4 className="font-bold text-sm text-white">Configurar Google Play Billing (Assinaturas)</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cadastre o produto de assinatura com renovação mensal de R$ 29,90. O Google processa o pagamento via cartão, Pix ou saldo do Google Play e retém apenas 15%.
            </p>
          </div>
        </div>
      </div>

      {/* SIMULAÇÃO DE BANNER DE ANÚNCIO (GOOGLE ADMOB) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Simulador de Anúncio AdMob no App</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            Formato: 320x50 Banner Responsivo
          </span>
        </div>

        {currentPlan === 'free' ? (
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-dashed border-amber-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
                ADS
              </div>
              <div>
                <p className="text-xs font-bold text-white">Anúncio do Google AdMob Exibido Aqui</p>
                <p className="text-[11px] text-slate-400">
                  Gera receita passiva a cada impressão e clique de usuários no plano gratuito.
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectPlan('creator')}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold whitespace-nowrap shadow"
            >
              Remover Anúncios
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Você é assinante Pro! Todos os anúncios do Google estão desativados para você.</span>
            </span>
            <button
              onClick={() => onSelectPlan('free')}
              className="text-[11px] underline text-slate-400 hover:text-white"
            >
              Testar visualização grátis
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
