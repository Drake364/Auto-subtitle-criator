/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Modelos válidos conforme documentação oficial do SDK @google/genai
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executa chamada à API Gemini com retentativas, rotação de modelos e timeout de 45s.
 */
async function executeWithRetryAndFallback<T>(
  action: (model: string, signal: AbortSignal) => Promise<T>,
  models: string[] = CANDIDATE_MODELS
): Promise<{ result: T; usedModel: string }> {
  let lastError: any = null;

  for (const model of models) {
    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45_000);
      try {
        const result = await action(model, controller.signal);
        return { result, usedModel: model };
      } catch (err: any) {
        lastError = err;
        const msg = (err?.message || String(err)).toLowerCase();
        const code = err?.code || err?.status || 0;

        const isBillingOrQuota =
          msg.includes('prepayment') ||
          msg.includes('depleted') ||
          msg.includes('resource_exhausted') ||
          msg.includes('quota');

        if (isBillingOrQuota) {
          throw err;
        }

        const isTransient =
          code === 503 ||
          code === 429 ||
          code === 500 ||
          code === 'UNAVAILABLE' ||
          code === 'RESOURCE_EXHAUSTED' ||
          msg.includes('503') ||
          msg.includes('429') ||
          msg.includes('high demand') ||
          msg.includes('overloaded') ||
          msg.includes('temporarily') ||
          msg.includes('unavailable');

        if (isTransient && attempt < maxRetries) {
          const delayMs = 900 * attempt + Math.floor(Math.random() * 300);
          console.warn(
            `[Gemini API] Modelo ${model} ocupado/transitório. Aguardando ${delayMs}ms (tentativa ${attempt + 1}/${maxRetries})...`
          );
          await sleep(delayMs);
        } else {
          break;
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }
    const lastMsg = (lastError?.message || String(lastError)).toLowerCase();
    if (lastMsg.includes('prepayment') || lastMsg.includes('depleted') || lastMsg.includes('quota')) {
      throw lastError;
    }
  }

  throw lastError;
}

function generateSmartFallbackCues(
  topicOrText: string,
  totalDuration: number = 15,
  _language: string = 'pt-BR'
): SubtitleCueInput[] {
  const dur = Math.max(5, totalDuration);
  const cleanInput = (topicOrText || '').trim();

  if (cleanInput.length > 25) {
    const words = cleanInput.split(/\s+/).filter(Boolean);
    const chunkSize = 5;
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(' '));
    }

    if (chunks.length > 0) {
      const timePerChunk = (dur - 0.8) / chunks.length;
      return chunks.map((chunk, idx) => {
        const start = Number((0.5 + idx * timePerChunk).toFixed(1));
        const end = Number((start + Math.max(1.4, timePerChunk - 0.2)).toFixed(1));
        return {
          id: `cue-${idx + 1}`,
          startTime: start,
          endTime: Math.min(Number((dur - 0.2).toFixed(1)), end),
          text: chunk,
        };
      });
    }
  }

  const topic = cleanInput || 'vídeos virais para redes sociais';
  const slice = dur / 4;
  return [
    {
      id: 'cue-1',
      startTime: 0.5,
      endTime: Number(slice.toFixed(1)),
      text: `Descubra o segredo de ${topic} agora mesmo!`,
    },
    {
      id: 'cue-2',
      startTime: Number((slice + 0.2).toFixed(1)),
      endTime: Number((slice * 2).toFixed(1)),
      text: 'Mais de 80% das pessoas assistem vídeos curtos no mudo.',
    },
    {
      id: 'cue-3',
      startTime: Number((slice * 2 + 0.2).toFixed(1)),
      endTime: Number((slice * 3).toFixed(1)),
      text: 'Legendas dinâmicas estilo TikTok aumentam sua retenção em até 300%!',
    },
    {
      id: 'cue-4',
      startTime: Number((slice * 3 + 0.2).toFixed(1)),
      endTime: Number((dur - 0.3).toFixed(1)),
      text: 'Personalize fontes, cores e exporte em SRT com apenas um clique.',
    },
  ];
}

export interface SubtitleCueInput {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  translation?: string;
  originalLanguage?: string;
  targetLanguage?: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  'pt-BR': 'Português (Brasil)',
  'en-US': 'Inglês (EUA)',
  'es-ES': 'Espanhol',
  'it-IT': 'Italiano',
  'fr-FR': 'Francês',
  'de-DE': 'Alemão',
  'ja-JP': 'Japonês',
  'it': 'Italiano',
  'en': 'Inglês',
  'es': 'Espanhol',
  'fr': 'Francês',
  'de': 'Alemão',
  'ja': 'Japonês',
  'pt': 'Português',
};

export async function translateSubtitlesWithGemini(
  cues: SubtitleCueInput[],
  targetLanguage: string = 'pt-BR',
  sourceLanguage: string = 'auto'
) {
  if (!cues || cues.length === 0) {
    return { success: true, cues: [] };
  }

  const targetLangName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;
  const sourceLangName = sourceLanguage !== 'auto' ? (LANGUAGE_NAMES[sourceLanguage] || sourceLanguage) : 'o idioma original do áudio';

  const ai = getGeminiClient();
  if (!ai) {
    return {
      success: false,
      mode: 'error',
      error: 'GEMINI_API_KEY não configurada no servidor. Insira sua chave ou use o modo offline.',
      cues: [],
    };
  }

  const prompt = `Você é um tradutor audiovisual profissional especializado em legendagem e localização de vídeos.
Traduza os textos das legendas faladas em ${sourceLangName} para ${targetLangName} de forma fluida, natural, dinâmica e contemporânea.
Regras:
1. Mantenha os mesmos 'id', 'startTime' e 'endTime'.
2. Mantenha no campo 'text' o texto original em ${sourceLangName}.
3. Coloque a tradução em ${targetLangName} no campo 'translation'.
4. Garanta ritmo fluido de leitura rápida.

Legendas originais:
${JSON.stringify(cues, null, 2)}`;

  try {
    const { result, usedModel } = await executeWithRetryAndFallback(async (model, signal) => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          abortSignal: signal,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    startTime: { type: Type.NUMBER },
                    endTime: { type: Type.NUMBER },
                    text: { type: Type.STRING },
                    translation: { type: Type.STRING },
                  },
                  required: ['id', 'startTime', 'endTime', 'text', 'translation'],
                },
              },
            },
            required: ['cues'],
          },
        },
      });

      const responseText = response.text || '{}';
      return JSON.parse(responseText);
    });

    const parsedCues = (result?.cues || []).map((c: any) => {
      const originalCue = cues.find((item) => item.id === c.id);
      return {
        id: c.id,
        startTime: c.startTime,
        endTime: c.endTime,
        text: originalCue?.text || c.text,
        translation: c.translation || c.text,
        originalLanguage: originalCue?.originalLanguage || (sourceLanguage !== 'auto' ? sourceLanguage : 'en'),
        targetLanguage: targetLanguage,
      };
    });

    return {
      success: true,
      mode: 'gemini',
      model: usedModel,
      message: `Legendas traduzidas para ${targetLangName} via ${usedModel}!`,
      cues: parsedCues.length > 0 ? parsedCues : cues,
    };
  } catch (error: any) {
    console.error('[Gemini Translation Error]:', error);
    return {
      success: false,
      mode: 'error',
      error: 'Não foi possível traduzir as legendas agora. Tente novamente ou verifique sua chave de API.',
      cues: [],
    };
  }
}

export async function generateSubtitlesWithGemini(context: {
  topicOrText: string;
  duration?: number;
  language?: string;
  engine?: string;
}) {
  const dur = Number(context.duration) || 15;
  const lang = context.language || 'Português (Brasil)';
  const topicOrText = context.topicOrText || 'Dicas de alta retenção para redes sociais';
  const isTikTokStyle = context.engine === 'smart';

  const ai = getGeminiClient();
  if (!ai) {
    if (context.engine === 'smart' || !context.engine) {
      const cues = generateSmartFallbackCues(topicOrText, dur, lang);
      return {
        success: true,
        mode: 'fallback_no_key',
        message: 'Legendas geradas com motor inteligente local (GEMINI_API_KEY não configurada).',
        cues,
      };
    }
    return {
      success: false,
      mode: 'error',
      error: 'GEMINI_API_KEY não configurada no servidor.',
      cues: [],
    };
  }

  const prompt = `Você é um gerador e formatador profissional de legendas para vídeos curtos (TikTok, Reels, Shorts).
Gere blocos de legendas sincronizados para o seguinte tema ou fala: "${topicOrText}".
Idioma de saída: ${lang}.
Duração total do vídeo: aproximadamente ${dur} segundos.
Diretrizes:
- Divida em frases curtas e dinâmicas (${isTikTokStyle ? '3 a 5' : '4 a 7'} palavras por bloco).
- Distribua os tempos (startTime e endTime em segundos) de forma contínua entre 0.5s e ${dur}s.
- Não deixe sobreposição de tempos entre os blocos.`;

  try {
    const { result, usedModel } = await executeWithRetryAndFallback(async (model, signal) => {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          abortSignal: signal,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              cues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    startTime: { type: Type.NUMBER },
                    endTime: { type: Type.NUMBER },
                    text: { type: Type.STRING },
                  },
                  required: ['id', 'startTime', 'endTime', 'text'],
                },
              },
            },
            required: ['cues'],
          },
        },
      });

      const text = response.text || '{}';
      return JSON.parse(text);
    });

    const cues = result?.cues || [];
    if (cues.length > 0) {
      return {
        success: true,
        mode: 'gemini',
        model: usedModel,
        message: `Legendas geradas com sucesso via ${usedModel}!`,
        cues,
      };
    }

    return {
      success: false,
      mode: 'error',
      error: 'Nenhuma legenda gerada pelo modelo.',
      cues: [],
    };
  } catch (error: any) {
    console.error('[Gemini Generation Error]:', error);
    if (context.engine === 'smart') {
      const fallbackCues = generateSmartFallbackCues(topicOrText, dur, lang);
      return {
        success: true,
        mode: 'smart_fallback',
        message: 'Legendas geradas pelo motor inteligente de contingência.',
        cues: fallbackCues,
      };
    }
    return {
      success: false,
      mode: 'error',
      error: 'Falha ao gerar legendas com IA. Tente novamente.',
      cues: [],
    };
  }
}

export interface TranscribeAudioOptions {
  audioBase64: string;
  mimeType?: string;
  duration?: number;
  language?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  promptTopic?: string;
  chunkOffsetSeconds?: number;
}

export async function transcribeAudioWithGemini(options: TranscribeAudioOptions) {
  const {
    audioBase64,
    mimeType = 'audio/wav',
    duration = 0,
    sourceLanguage = 'auto',
    targetLanguage = 'pt-BR',
    promptTopic = '',
    chunkOffsetSeconds = 0,
  } = options;

  if (!audioBase64 || audioBase64.trim().length === 0) {
    throw new Error('Buffer de áudio não fornecido para transcrição.');
  }

  const ai = getGeminiClient();
  if (!ai) {
    return {
      success: false,
      mode: 'error',
      error: 'GEMINI_API_KEY não configurada no servidor.',
      cues: [],
    };
  }

  // Contrato: Gemini retorna tempos relativos ao chunk; somamos offset uma vez aqui.
  const offset = Number(chunkOffsetSeconds) || 0;
  const targetLangName = LANGUAGE_NAMES[targetLanguage] || targetLanguage || 'Português (Brasil)';
  const isAuto = !sourceLanguage || sourceLanguage === 'auto';
  const sourceLangPrompt = isAuto
    ? '1. Ouça com atenção e identifique qual é o idioma falado no áudio.'
    : `1. O idioma falado no áudio é: ${LANGUAGE_NAMES[sourceLanguage] || sourceLanguage}.`;

  const prompt = `Você é um transcritor e tradutor audiovisual profissional especializado em legendagem precisa.
${sourceLangPrompt}
2. Transcreva com 100% de fidelidade cada palavra pronunciada no idioma original (campo 'text').
3. Divida a transcrição em blocos naturais de legenda (cerca de 4 a 8 palavras por frase).
4. Forneça a tradução precisa em ${targetLangName} no campo 'translation'.
5. Determine os timestamps (startTime e endTime em segundos numéricos, relativos ao início deste arquivo de áudio).
6. Se o trecho for silêncio, retorne 'cues' vazio [].
${promptTopic ? `Contexto adicional: "${promptTopic}".` : ''}

Retorne ESTRITAMENTE um objeto JSON no formato:
{
  "detectedLanguage": "Português",
  "detectedLanguageCode": "pt-BR",
  "cues": [
    {
      "startTime": 0.0,
      "endTime": 3.4,
      "text": "fala original",
      "translation": "tradução"
    }
  ]
}`;

  try {
    const { result, usedModel } = await executeWithRetryAndFallback(async (model, signal) => {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'audio/wav',
                data: audioBase64,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          abortSignal: signal,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedLanguage: { type: Type.STRING },
              detectedLanguageCode: { type: Type.STRING },
              cues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    startTime: { type: Type.NUMBER },
                    endTime: { type: Type.NUMBER },
                    text: { type: Type.STRING },
                    translation: { type: Type.STRING },
                  },
                  required: ['startTime', 'endTime', 'text'],
                },
              },
            },
            required: ['cues'],
          },
        },
      });

      const rawText = response.text || '';
      const cleanJson = rawText.replace(/```(?:json)?\n?/gi, '').replace(/```/g, '').trim();

      let parsed: { detectedLanguage?: string; detectedLanguageCode?: string; cues: any[] } = {
        cues: [],
      };

      try {
        if (!cleanJson || cleanJson === '[]' || cleanJson === '{}') {
          return parsed;
        }
        const data = JSON.parse(cleanJson);
        if (Array.isArray(data)) {
          parsed.cues = data;
        } else if (data && Array.isArray(data.cues)) {
          parsed = data;
        }
      } catch {
        const match = cleanJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (match) {
          try {
            parsed.cues = JSON.parse(match[0]);
          } catch {
            parsed.cues = [];
          }
        }
      }

      return parsed;
    });

    const detectedLang = result?.detectedLanguage || 'Português';
    const detectedCode = result?.detectedLanguageCode || 'pt-BR';

    const cues = (result?.cues || []).map((cue: any, idx: number) => {
      const rawStart = Number(cue.startTime) || 0;
      const rawEnd = Number(cue.endTime) || (rawStart + 2.5);
      // Somamos o offset uma vez aqui (Contrato)
      const start = Number((rawStart + offset).toFixed(2));
      const end = Number((rawEnd + offset).toFixed(2));
      const text = String(cue.text || '').trim();
      const translation = cue.translation ? String(cue.translation).trim() : text;

      return {
        id: `real-audio-cue-${Date.now()}-${idx + 1}`,
        startTime: start,
        endTime: end,
        text,
        translation,
        originalLanguage: detectedCode,
        targetLanguage: targetLanguage,
      };
    }).filter((c: any) => c.text.length > 0);

    return {
      success: true,
      mode: 'gemini_real_transcription',
      model: usedModel,
      detectedLanguage: detectedLang,
      detectedLanguageCode: detectedCode,
      cues,
      message: `${cues.length} blocos transcritos via ${usedModel}!`,
    };
  } catch (err: any) {
    console.error('[Gemini Transcription Error]:', err);
    return {
      success: false,
      mode: 'error',
      error: 'Não foi possível transcrever o áudio agora. Verifique sua chave ou tente novamente.',
      cues: [],
    };
  }
}
