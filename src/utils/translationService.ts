/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Serviço de Tradução 100% Client-Side (Netlify SPA compatible).
 * Ordem de Prioridade:
 * 1. Gemini API (se o usuário possuir chave configurada)
 * 2. LibreTranslate (Gratuito, sem chave de API, via fetch direto)
 * 3. Fallback para o texto original
 */

import { GoogleGenAI } from '@google/genai';
import { SubtitleCue } from '../types';

/**
 * Traduz texto usando o LibreTranslate (público, gratuito, sem chave)
 */
export async function translateWithLibreTranslate(
  text: string,
  targetLang: string = 'pt'
): Promise<string> {
  if (!text || !text.trim()) return text;

  // Normaliza o código do idioma para o padrão ISO (ex: 'pt-BR' -> 'pt')
  const cleanTarget = targetLang.split('-')[0] || 'pt';

  const endpoints = [
    'https://libretranslate.de/translate',
    'https://translate.argosopentech.com/translate',
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: 'auto',
          target: cleanTarget,
          format: 'text',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.translatedText) {
          return data.translatedText;
        }
      }
    } catch (err) {
      console.warn(`Falha no endpoint LibreTranslate (${endpoint}):`, err);
    }
  }

  // Se todas as instâncias falharem, retorna o texto original
  return text;
}

/**
 * Traduz array de cues legendas no cliente (Client-Side)
 */
export async function clientSideTranslateSubtitles(
  cues: SubtitleCue[],
  targetLanguage: string = 'pt-BR'
): Promise<{ cues: SubtitleCue[]; engineUsed: string }> {
  const geminiKey = localStorage.getItem('user_gemini_api_key');
  let engineUsed = 'LibreTranslate (Gratuito)';

  // Tenta 1º: Gemini API (se houver chave do usuário)
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const prompt = `Traduza as seguintes legendas para o idioma ${targetLanguage}. Retorne estritamente um JSON array no formato [{"id": "...", "translation": "..."}]:\n` +
        JSON.stringify(cues.map(c => ({ id: c.id, text: c.translation || c.text })));

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const rawText = response.text || '';
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const updated = cues.map(cue => {
          const found = parsed.find((p: any) => p.id === cue.id);
          const t = found ? found.translation : (cue.translation || cue.text);
          return { ...cue, translation: t };
        });
        return { cues: updated, engineUsed: 'Google Gemini AI' };
      }
    } catch (err) {
      console.warn('Falha na tradução via Gemini Client-Side, recorrendo ao LibreTranslate:', err);
    }
  }

  // Tenta 2º: LibreTranslate (Gratuito, Client-Side)
  try {
    const updated: SubtitleCue[] = [];
    for (const cue of cues) {
      const sourceText = cue.text;
      const translated = await translateWithLibreTranslate(sourceText, targetLanguage);
      updated.push({
        ...cue,
        translation: translated,
      });
    }
    return { cues: updated, engineUsed: 'LibreTranslate (Gratuito)' };
  } catch (err) {
    console.warn('Falha no LibreTranslate, mantendo original:', err);
    return { cues, engineUsed: 'Nenhum (Original)' };
  }
}
