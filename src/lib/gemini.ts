import { GoogleGenerativeAI } from '@google/generative-ai';

export function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
