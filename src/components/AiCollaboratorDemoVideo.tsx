import React, { useEffect, useRef } from 'react';
import { Sparkles, Bot, Volume2, ShieldCheck } from 'lucide-react';

interface AiCollaboratorDemoVideoProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  aspectRatio: '9:16' | '16:9';
  onTogglePlay: () => void;
  isMuted?: boolean;
}

export const AiCollaboratorDemoVideo: React.FC<AiCollaboratorDemoVideoProps> = ({
  isPlaying,
  currentTime,
  duration,
  aspectRatio,
  onTogglePlay,
  isMuted = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastSpokenCueIndex = useRef<number>(-1);
  const drakeAvatarImgRef = useRef<HTMLImageElement | null>(null);

  // Carrega o avatar do Drake Studio para renderização no Canvas
  useEffect(() => {
    const img = new Image();
    img.src = '/drake_avatar.jpg';
    img.onload = () => {
      drakeAvatarImgRef.current = img;
    };
  }, []);

  // Roteiro falado de demonstração em Português do Brasil com timestamps
  const spokenCues = [
    { start: 0.5, end: 3.2, text: 'Se você quer viralizar seus vídeos nas redes sociais hoje' },
    { start: 3.4, end: 6.8, text: 'você com certeza precisa de legendas dinâmicas e atraentes' },
    { start: 7.0, end: 10.5, text: 'Mais de 80 por cento das pessoas assistem a vídeos no celular sem som' },
    { start: 10.8, end: 14.5, text: 'Com Drake Studio e o Colaborador de IA, seu conteúdo ganha retenção máxima' },
  ];

  // Síntese de áudio falado sincronizado com a reprodução
  useEffect(() => {
    if (isMuted || !isPlaying || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    // Se reiniciou o vídeo
    if (currentTime < 0.4) {
      lastSpokenCueIndex.current = -1;
    }

    const currentCueIndex = spokenCues.findIndex(
      (c) => currentTime >= c.start && currentTime <= c.end
    );

    if (currentCueIndex !== -1 && currentCueIndex !== lastSpokenCueIndex.current) {
      lastSpokenCueIndex.current = currentCueIndex;
      window.speechSynthesis.cancel();

      const cue = spokenCues[currentCueIndex];
      const utterance = new SpeechSynthesisUtterance(cue.text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.15;
      utterance.pitch = 1.05;

      // Seleciona voz brasileira se disponível
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find((v) => v.lang.includes('pt-BR') || v.lang.includes('pt'));
      if (ptVoice) {
        utterance.voice = ptVoice;
      }

      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, [isPlaying, currentTime, isMuted]);

  // Efeito sonoro harmônico de fundo com Web Audio API quando dá Play
  useEffect(() => {
    if (!isPlaying || isMuted || typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Pequeno bip harmônico suave de início
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Falha silenciosa em navegadores restritivos
    }
  }, [isPlaying, isMuted]);

  // Renderização contínua de alta fidelidade em Canvas (60 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const render = () => {
      tick++;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height * 0.42;

      // 1. Fundo Gradiente Futurista Escuro
      const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, width * 0.9);
      bgGrad.addColorStop(0, '#191e36');
      bgGrad.addColorStop(0.5, '#0e1220');
      bgGrad.addColorStop(1, '#080a11');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Luz de Fundo Volumétrica com Respiração (Breathing Glow)
      const pulse = Math.sin(tick * 0.05) * 15;
      const glowGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 180 + pulse);
      glowGrad.addColorStop(0, 'rgba(250, 204, 21, 0.22)');
      glowGrad.addColorStop(0.3, 'rgba(56, 189, 248, 0.18)');
      glowGrad.addColorStop(0.7, 'rgba(236, 72, 153, 0.08)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 190 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Posições dos dois protagonistas: Drake Studio (Criador) à esquerda e Gemini (IA) à direita
      const isVertical = aspectRatio === '9:16';
      const offsetDist = isVertical ? 86 : 140;
      const drakeX = cx - offsetDist;
      const geminiX = cx + offsetDist;
      const charsY = cy - (isVertical ? 15 : 10);

      // Conector de Colaboração Cósmica no Centro
      ctx.save();
      const beamGrad = ctx.createLinearGradient(drakeX, charsY, geminiX, charsY);
      beamGrad.addColorStop(0, 'rgba(236, 72, 153, 0.4)');
      beamGrad.addColorStop(0.5, 'rgba(250, 204, 21, 0.8)');
      beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0.4)');
      ctx.strokeStyle = beamGrad;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(drakeX + 46, charsY);
      ctx.lineTo(geminiX - 46, charsY);
      ctx.stroke();

      // Símbolo de Parceria / Colaboração Central
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '900 16px Montserrat, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#FACC15';
      ctx.shadowBlur = 12;
      ctx.fillText('✕', cx, charsY + 5);
      ctx.restore();

      // ----------------------------------------------------------------
      // PROTAGONISTA 1 (ESQUERDA): AVATAR DO CRIADOR - DRAKE STUDIO
      // ----------------------------------------------------------------
      ctx.save();
      ctx.translate(drakeX, charsY);
      const drakeScale = isPlaying ? 1 + Math.sin(tick * 0.08) * 0.03 : 1;
      ctx.scale(drakeScale, drakeScale);

      // Anéis de Frequência do Drake (Tons Quentes / Magenta / Ouro)
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 7]);
      ctx.beginPath();
      ctx.arc(0, 0, 52 + Math.sin(tick * 0.04) * 3, 0, Math.PI * 2);
      ctx.stroke();

      const avatarImg = drakeAvatarImgRef.current;
      const avatarRadius = 45;

      // Desenha o avatar recortado em círculo com borda neon estilizada
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, avatarRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      if (avatarImg && avatarImg.complete && avatarImg.naturalWidth > 0) {
        // Enquadra a foto de Drake Studio no círculo focando no rosto e jaqueta
        const imgAspect = avatarImg.naturalWidth / avatarImg.naturalHeight;
        let drawW = avatarRadius * 2.2;
        let drawH = drawW / imgAspect;
        ctx.drawImage(avatarImg, -drawW / 2, -drawH * 0.38, drawW, drawH);
      } else {
        // Fallback vetorial expressivo do Drake Studio
        const drakeFallGrad = ctx.createLinearGradient(-40, -40, 40, 40);
        drakeFallGrad.addColorStop(0, '#0284C7');
        drakeFallGrad.addColorStop(0.5, '#0369A1');
        drakeFallGrad.addColorStop(1, '#BE185D');
        ctx.fillStyle = drakeFallGrad;
        ctx.fillRect(-avatarRadius, -avatarRadius, avatarRadius * 2, avatarRadius * 2);

        // Logo circular central Drake Studio
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(0, 6, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#FACC15';
        ctx.font = '900 9px Montserrat, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DRAKE', 0, 4);
        ctx.font = '700 6px sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('STUDIO', 0, 13);
      }
      ctx.restore();

      // Borda luminosa externa do Avatar de Drake
      ctx.strokeStyle = '#EC4899';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#EC4899';
      ctx.shadowBlur = isPlaying ? 16 : 8;
      ctx.beginPath();
      ctx.arc(0, 0, avatarRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Mini badge "DRAKE STUDIO"
      ctx.font = '900 11px Montserrat, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText('DRAKE STUDIO', 0, avatarRadius + 18);

      ctx.font = '700 8px Montserrat, sans-serif';
      ctx.fillStyle = '#F472B6';
      ctx.fillText('CRIADOR', 0, avatarRadius + 29);
      ctx.restore();

      // ----------------------------------------------------------------
      // PROTAGONISTA 2 (DIREITA): LOGO DO COLABORADOR - GEMINI / AI STUDIO
      // ----------------------------------------------------------------
      ctx.save();
      ctx.translate(geminiX, charsY);
      const starScale = isPlaying ? 1 + Math.sin(tick * 0.1) * 0.05 : 1;
      ctx.scale(starScale, starScale);

      // Anéis de Frequência Orbitais da IA
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, 52 + Math.sin(tick * 0.03) * 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.setLineDash([4, 10]);
      ctx.beginPath();
      ctx.arc(0, 0, 68 + Math.cos(tick * 0.02) * 5, 0, Math.PI * 2);
      ctx.stroke();

      // Estrela de 4 pontas da IA (Gemini / AI Studio)
      const starGrad = ctx.createLinearGradient(-35, -35, 35, 35);
      starGrad.addColorStop(0, '#FACC15'); // Dourado
      starGrad.addColorStop(0.5, '#F59E0B'); // Âmbar
      starGrad.addColorStop(1, '#38BDF8'); // Ciano Gemini

      ctx.fillStyle = starGrad;
      ctx.shadowColor = '#FACC15';
      ctx.shadowBlur = isPlaying ? 24 : 14;

      ctx.beginPath();
      const rOuter = 40;
      const rInner = 8;
      ctx.moveTo(0, -rOuter);
      ctx.quadraticCurveTo(0, -rInner, rInner, 0);
      ctx.quadraticCurveTo(0, rInner, 0, rOuter);
      ctx.quadraticCurveTo(0, rInner, -rInner, 0);
      ctx.quadraticCurveTo(0, -rInner, 0, -rOuter);
      ctx.closePath();
      ctx.fill();

      // Núcleo brilhante branco
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();

      // Mini badge "GOOGLE AI STUDIO"
      ctx.font = '900 11px Montserrat, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 6;
      ctx.fillText('GOOGLE AI STUDIO', 0, 63);

      ctx.font = '700 8px Montserrat, sans-serif';
      ctx.fillStyle = '#38BDF8';
      ctx.fillText('COLABORADOR IA', 0, 74);
      ctx.restore();

      // ----------------------------------------------------------------
      // ONDAS SONORAS DINÂMICAS DO EQUALIZADOR (ÁUDIO DA FALA)
      // ----------------------------------------------------------------
      const numBars = isVertical ? 26 : 36;
      const barSpacing = width * (isVertical ? 0.024 : 0.016);
      const totalWaveWidth = numBars * barSpacing;
      const waveStartX = cx - totalWaveWidth / 2;
      const waveY = charsY + (isVertical ? 112 : 98);

      for (let i = 0; i < numBars; i++) {
        const x = waveStartX + i * barSpacing;
        const distFromCenter = Math.abs(i - numBars / 2) / (numBars / 2);
        const factor = Math.cos(distFromCenter * Math.PI * 0.5);

        let barHeight = 6;
        if (isPlaying) {
          barHeight = 6 + Math.sin(tick * 0.15 + i * 0.5) * 18 * factor + Math.random() * 8 * factor;
        } else {
          barHeight = 6 + Math.sin(tick * 0.04 + i * 0.3) * 4 * factor;
        }

        const barGrad = ctx.createLinearGradient(x, waveY - barHeight, x, waveY + barHeight);
        barGrad.addColorStop(0, '#EC4899'); // Rosa/Magenta Drake
        barGrad.addColorStop(0.5, '#FACC15'); // Dourado
        barGrad.addColorStop(1, '#38BDF8'); // Ciano Gemini

        ctx.fillStyle = barGrad;
        ctx.beginPath();
        ctx.roundRect(x - 2, waveY - barHeight / 2, 4, Math.max(4, barHeight), 2);
        ctx.fill();
      }

      // ----------------------------------------------------------------
      // TEXTOS E STATUS INFORMATIVO
      // ----------------------------------------------------------------
      ctx.textAlign = 'center';

      // Marca Superior
      ctx.font = 'bold 11px Montserrat, sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('PARCERIA CRIATIVA & TECNOLOGIA', cx, cy - (isVertical ? 90 : 75));

      ctx.font = '600 11px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = '#38BDF8';
      ctx.fillText(
        isPlaying ? '🔊 Demonstração Oficial em Reprodução' : '▶ Clique no Player para Assistir com Som',
        cx,
        charsY + (isVertical ? 142 : 124)
      );

      // Linha de Varredura de Estúdio (Scanline suave)
      const scanY = (tick * 1.5) % height;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
      ctx.fillRect(0, scanY, width, 2);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, aspectRatio]);

  return (
    <div
      onClick={onTogglePlay}
      className="relative w-full h-full flex items-center justify-center cursor-pointer select-none overflow-hidden group"
      title={isPlaying ? 'Clique para pausar o vídeo' : 'Clique para reproduzir o vídeo de demonstração com som'}
    >
      {/* Canvas animado do vídeo */}
      <canvas
        ref={canvasRef}
        width={aspectRatio === '9:16' ? 480 : 854}
        height={aspectRatio === '9:16' ? 854 : 480}
        className="w-full h-full object-cover"
      />

      {/* Selos de Interface do Estúdio */}
      <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/85 border border-pink-500/40 backdrop-blur-md text-[10px] font-bold text-pink-200 shadow-lg">
        <img
          src="/drake_avatar.jpg"
          alt="Drake Studio Avatar"
          className="w-4 h-4 rounded-full object-cover border border-pink-400 shadow-sm"
          referrerPolicy="no-referrer"
        />
        <span className="tracking-wide">DRAKE STUDIO &bull; CRIADOR</span>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-950/85 border border-amber-500/40 backdrop-blur-md text-[10px] font-bold text-amber-300 shadow-lg">
        <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
        <span>COLABORADOR IA</span>
      </div>

      {/* Indicador de Status do Áudio */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] text-slate-300 border border-slate-800 pointer-events-none">
        <Volume2 className={`w-3 h-3 ${isPlaying ? 'text-amber-400 animate-bounce' : 'text-slate-500'}`} />
        <span>{isPlaying ? 'Áudio PT-BR Ativo' : 'Clique para Tocar'}</span>
      </div>
    </div>
  );
};
